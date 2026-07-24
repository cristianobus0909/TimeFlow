import { Types } from 'mongoose';
import { Invoice, IInvoice } from './invoice.model';
import { Payment, IPayment } from './payment.model';
import { Expense, IExpense } from './expense.model';
import { FinancialTransaction } from './financial-transaction.model';
import { Project } from '@modules/projects/project.model';
import { Client } from '@modules/clients/client.model';
import { WorkSession } from '@modules/workSessions/work-session.model';
import { NotFoundError, ValidationError } from '@core/errors/classes';

export class FinancialService {
  // --- INVOICES ---
  public async createInvoice(orgId: string, data: any, userId: string): Promise<IInvoice> {
    const orgObjectId = new Types.ObjectId(orgId);
    
    // Auto-generate invoice number: INV-YYYY-000001
    const count = await Invoice.countDocuments({ organization: orgObjectId });
    const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const subtotal = data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.rate), 0);
    const taxes = data.taxes || 0;
    const discount = data.discount || 0;
    const total = subtotal + taxes - discount;

    const invoice = new Invoice({
      ...data,
      number,
      subtotal,
      taxes,
      discount,
      total,
      organization: orgObjectId,
      status: data.status || 'PENDING',
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
    });

    await invoice.save();

    // If initial status is PAID, record a financial transaction
    if (invoice.status === 'PAID') {
      await this.recordTransaction({
        organization: orgObjectId,
        type: 'INCOME',
        client: data.client ? new Types.ObjectId(data.client) : undefined,
        project: data.project ? new Types.ObjectId(data.project) : undefined,
        invoice: invoice._id,
        amount: total,
        currency: data.currency || 'USD',
        status: 'COMPLETED',
        paymentMethod: 'TRANSFER',
        transactionDate: new Date(),
        description: `Cobro automático de factura ${number}`,
      });
    }

    return invoice;
  }

  public async getInvoices(orgId: string): Promise<IInvoice[]> {
    return Invoice.find({ organization: new Types.ObjectId(orgId), isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('client', 'name company');
  }

  public async getInvoiceById(id: string, orgId: string): Promise<IInvoice> {
    const invoice = await Invoice.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
      isDeleted: false,
    }).populate('client', 'name company');

    if (!invoice) {
      throw new NotFoundError('Factura no encontrada.');
    }
    return invoice;
  }

  // --- PAYMENTS ---
  public async createPayment(orgId: string, data: any, userId: string): Promise<IPayment> {
    const orgObjectId = new Types.ObjectId(orgId);
    const invoiceId = new Types.ObjectId(data.invoice);

    const invoice = await Invoice.findOne({ _id: invoiceId, organization: orgObjectId });
    if (!invoice) {
      throw new NotFoundError('La factura asociada no existe en su organización.');
    }

    const payment = new Payment({
      ...data,
      invoice: invoiceId,
      organization: orgObjectId,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    });

    await payment.save();

    // Fetch all completed payments for this invoice
    const allPayments = await Payment.find({ invoice: invoiceId, status: 'COMPLETED', isDeleted: false });
    const paidSum = allPayments.reduce((acc, p) => acc + p.amount, 0);

    // Update invoice status based on payment sums
    if (paidSum >= invoice.total) {
      invoice.status = 'PAID';
    } else if (paidSum > 0) {
      invoice.status = 'PARTIALLY_PAID';
    }
    await invoice.save();

    // Record Income Transaction
    await this.recordTransaction({
      organization: orgObjectId,
      type: 'INCOME',
      client: invoice.client,
      project: invoice.project,
      invoice: invoice._id,
      amount: payment.amount,
      currency: payment.currency,
      status: 'COMPLETED',
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.paymentDate,
      description: `Pago registrado para factura ${invoice.number}. Ref: ${payment.reference || 'N/A'}`,
    });

    return payment;
  }

  public async getPayments(orgId: string): Promise<IPayment[]> {
    return Payment.find({ organization: new Types.ObjectId(orgId), isDeleted: false })
      .sort({ paymentDate: -1 })
      .populate({
        path: 'invoice',
        select: 'number client total',
        populate: { path: 'client', select: 'name' }
      });
  }

  // --- EXPENSES ---
  public async createExpense(orgId: string, data: any, userId: string): Promise<IExpense> {
    const orgObjectId = new Types.ObjectId(orgId);
    
    const expense = new Expense({
      ...data,
      project: data.project ? new Types.ObjectId(data.project) : undefined,
      organization: orgObjectId,
      date: data.date ? new Date(data.date) : new Date(),
    });

    await expense.save();

    // Record Expense Transaction
    await this.recordTransaction({
      organization: orgObjectId,
      type: 'EXPENSE',
      project: expense.project,
      amount: expense.amount,
      currency: expense.currency,
      status: 'COMPLETED',
      transactionDate: expense.date,
      description: `Gasto registrado: ${expense.description} (${expense.category})`,
    });

    return expense;
  }

  public async getExpenses(orgId: string): Promise<IExpense[]> {
    return Expense.find({ organization: new Types.ObjectId(orgId), isDeleted: false })
      .sort({ date: -1 })
      .populate('project', 'name color');
  }

  // --- DASHBOARD FINANCIAL METRICS ---
  public async getFinancialDashboard(orgId: string): Promise<any> {
    const orgObjectId = new Types.ObjectId(orgId);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Transactions of this month
    const currentTransactions = await FinancialTransaction.find({
      organization: orgObjectId,
      transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'COMPLETED',
      isDeleted: false,
    });

    const income = currentTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expenses = currentTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const profit = income - expenses;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    // 2. Pending Invoices (Overdue or unpaid)
    const pendingInvoices = await Invoice.find({
      organization: orgObjectId,
      status: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      isDeleted: false,
    }).populate('client', 'name');

    const totalPendingAmount = pendingInvoices.reduce((acc, inv) => acc + inv.total, 0);

    // 3. Top Projects by Profit (Calculated dynamically)
    const projects = await Project.find({ organization: orgObjectId, isDeleted: false });
    const topProjects = await Promise.all(
      projects.map(async (p) => {
        const trans = await FinancialTransaction.find({
          organization: orgObjectId,
          project: p._id,
          status: 'COMPLETED',
          isDeleted: false,
        });
        const projIncome = trans.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const projExpenses = trans.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
        return {
          _id: p._id,
          name: p.name,
          color: p.color,
          income: projIncome,
          expenses: projExpenses,
          profit: projIncome - projExpenses,
        };
      })
    );
    topProjects.sort((a, b) => b.profit - a.profit);

    // 4. Proyección simple de Cash Flow (próximos 30 días)
    const upcomingDueDateLimit = new Date();
    upcomingDueDateLimit.setDate(upcomingDueDateLimit.getDate() + 30);

    const upcomingInvoices = await Invoice.find({
      organization: orgObjectId,
      status: { $in: ['PENDING', 'PARTIALLY_PAID'] },
      dueDate: { $gte: new Date(), $lte: upcomingDueDateLimit },
      isDeleted: false,
    });

    const expectedInflows = upcomingInvoices.reduce((acc, inv) => acc + inv.total, 0);

    return {
      metrics: {
        income,
        expenses,
        profit,
        margin: Math.round(margin * 10) / 10,
        totalPendingAmount,
      },
      pendingInvoices: pendingInvoices.slice(0, 5),
      topProjects: topProjects.slice(0, 5),
      cashFlow: {
        expectedInflows,
        daysCount: 30,
      },
    };
  }

  // --- PRIVATE TRANSACTION LOGGER ---
  private async recordTransaction(data: any): Promise<void> {
    const transaction = new FinancialTransaction(data);
    await transaction.save();
  }
}
export default FinancialService;
