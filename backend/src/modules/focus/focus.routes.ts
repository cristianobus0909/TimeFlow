import { Router } from 'express';
import { FocusController } from './focus.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new FocusController();

// Require authentication for all focus routes
router.use(authenticateToken);

router.get('/overview', controller.getOverview);
router.get('/goals', controller.getGoals);
router.post('/goals', controller.setGoal);
router.get('/streaks', controller.getStreak);

export default router;
