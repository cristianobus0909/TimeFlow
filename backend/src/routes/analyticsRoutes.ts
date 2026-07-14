import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getDashboardStats, getAnalyticsStats } from '../controllers/analyticsController';

const router = Router();

// Secure analytics endpoints
router.use(authenticateToken as any);

router.get('/dashboard', getDashboardStats as any);
router.get('/stats', getAnalyticsStats as any);

export default router;
