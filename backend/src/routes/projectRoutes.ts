import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { checkProjectLimit } from '../middlewares/quota';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addTaskToProject,
  removeTaskFromProject,
  reorderProjectTasks,
  toggleProjectTaskStatus,
} from '../controllers/projectController';

const router = Router();

// Secure all project endpoints
router.use(authenticateToken as any);

router.get('/', getProjects as any);
router.get('/:id', getProjectById as any);
router.post('/', checkProjectLimit as any, createProject as any);
router.put('/:id', updateProject as any);
router.delete('/:id', deleteProject as any);

// Project Task Relationships
router.post('/:id/tasks', addTaskToProject as any);
router.delete('/:id/tasks/:projectTaskId', removeTaskFromProject as any);
router.put('/:id/tasks/reorder', reorderProjectTasks as any);
router.put('/:id/tasks/:projectTaskId/status', toggleProjectTaskStatus as any);

export default router;
