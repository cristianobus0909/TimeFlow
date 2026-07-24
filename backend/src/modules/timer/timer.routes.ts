import { Router } from 'express';
import { WorkSessionController } from './timer.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new WorkSessionController();

// Require authentication for all timer/session routes
router.use(authenticateToken);

router.get('/', controller.getSessions);
router.post('/', controller.createSession);
router.delete('/:id', controller.deleteSession);
router.put('/:id/notes', controller.updateSessionNotes);

export default router;
