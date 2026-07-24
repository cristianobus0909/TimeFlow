import { Router } from 'express';
import { WorkSessionController } from './work-session.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new WorkSessionController();

// Require authentication for all work-sessions routes
router.use(authenticateToken);

router.get('/active', controller.getActive);
router.get('/history', controller.getHistory);
router.post('/start', controller.start);
router.post('/:id/pause', controller.pause);
router.post('/:id/resume', controller.resume);
router.post('/:id/finish', controller.finish);
router.post('/:id/cancel', controller.cancel);

// Daily Goals Endpoints
router.post('/goals', controller.saveGoal);
router.get('/goals/today', controller.getTodayGoal);
router.get('/indicators', controller.getIndicators);

export default router;
