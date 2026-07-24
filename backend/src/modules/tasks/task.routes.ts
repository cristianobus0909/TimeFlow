import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';
import { checkTaskLimit } from '@core/middleware/quota.middleware';

const router = Router();
const controller = new TaskController();

// Require authentication for all task routes
router.use(authenticateToken);

router.get('/', controller.getTasks);
router.get('/:id', controller.getTaskById);
router.post('/', checkTaskLimit, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
