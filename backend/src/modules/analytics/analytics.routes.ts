import { Router } from 'express';
import { authenticateToken } from '@core/middleware/auth.middleware';
import { getDashboardStats, getAnalyticsStats } from './analytics.controller';

const router = Router();

// Secure analytics endpoints
router.use(authenticateToken as any);

router.get('/dashboard', getDashboardStats as any);
router.get('/stats', getAnalyticsStats as any);

export default router;
