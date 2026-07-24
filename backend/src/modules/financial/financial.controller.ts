import { Request, Response, NextFunction } from 'express';
import { FinancialService } from './financial.service';

export class FinancialController {
  private service: FinancialService;

  constructor() {
    this.service = new FinancialService();
  }

  // --- INVOICES ---
  public createInvoice = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const userId = req.user!._id.toString();
      const result = await this.service.createInvoice(orgId, req.body, userId);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  public getInvoices = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const result = await this.service.getInvoices(orgId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  public getInvoiceById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const result = await this.service.getInvoiceById(req.params.id as string, orgId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  // --- PAYMENTS ---
  public createPayment = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const userId = req.user!._id.toString();
      const result = await this.service.createPayment(orgId, req.body, userId);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  public getPayments = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const result = await this.service.getPayments(orgId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  // --- EXPENSES ---
  public createExpense = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const userId = req.user!._id.toString();
      const result = await this.service.createExpense(orgId, req.body, userId);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  public getExpenses = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const result = await this.service.getExpenses(orgId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  // --- METRICS ---
  public getFinancialDashboard = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organization.toString();
      const result = await this.service.getFinancialDashboard(orgId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
export default FinancialController;
