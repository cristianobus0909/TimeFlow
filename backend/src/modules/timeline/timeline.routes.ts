import { Router } from 'express';
import { TimelineController } from './timeline.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new TimelineController();

router.use(authenticateToken);

router.get('/', controller.getEvents);

export default router;
