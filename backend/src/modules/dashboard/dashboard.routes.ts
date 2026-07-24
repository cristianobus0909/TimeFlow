import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new DashboardController();

// Require authentication for all dashboard routes
router.use(authenticateToken);

router.get('/overview', controller.getOverview);

export default router;
