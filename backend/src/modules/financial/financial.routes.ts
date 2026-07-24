import { Router } from 'express';
import { FinancialController } from './financial.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new FinancialController();

// Use authentication middleware for all financial actions
router.use(authenticateToken);

// Invoices
router.post('/invoices', controller.createInvoice);
router.get('/invoices', controller.getInvoices);
router.get('/invoices/:id', controller.getInvoiceById);

// Payments
router.post('/payments', controller.createPayment);
router.get('/payments', controller.getPayments);

// Expenses
router.post('/expenses', controller.createExpense);
router.get('/expenses', controller.getExpenses);

// Financial dashboard metrics aggregations
router.get('/dashboard', controller.getFinancialDashboard);

export const financialRoutes = router;
export default financialRoutes;
