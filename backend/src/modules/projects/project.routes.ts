import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';
import { checkProjectLimit } from '@core/middleware/quota.middleware';

const router = Router();
const controller = new ProjectController();

// Require authentication for all project routes
router.use(authenticateToken);

router.get('/', controller.getProjects);
router.get('/:id', controller.getProjectById);
router.post('/', checkProjectLimit, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Task-Project links management
router.post('/:id/tasks', controller.addTask);
router.delete('/:id/tasks/:projectTaskId', controller.removeTask);
router.put('/:id/tasks/reorder', controller.reorderTasks);
router.put('/:id/tasks/:projectTaskId/status', controller.toggleTaskStatus);

export default router;
