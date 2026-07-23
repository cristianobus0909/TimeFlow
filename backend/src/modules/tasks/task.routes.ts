import { Router } from 'express';
import { authenticateToken } from '@core/middleware/auth.middleware';
import { checkTaskLimit } from '@core/middleware/quota.middleware';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleFavorite,
  deleteTask,
} from './task.controller';

const router = Router();

// Secure all task endpoints
router.use(authenticateToken as any);

router.get('/', getTasks as any);
router.get('/:id', getTaskById as any);
router.post('/', checkTaskLimit as any, createTask as any);
router.put('/:id', updateTask as any);
router.patch('/:id/favorite', toggleFavorite as any);
router.delete('/:id', deleteTask as any);

export default router;
