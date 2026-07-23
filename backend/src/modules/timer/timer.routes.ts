import { Router } from 'express';
import { authenticateToken } from '@core/middleware/auth.middleware';
import {
  createSession,
  getSessions,
  deleteSession,
  updateSessionNotes,
} from './timer.controller';

const router = Router();

// Secure all session endpoints
router.use(authenticateToken as any);

router.post('/', createSession as any);
router.get('/', getSessions as any);
router.delete('/:id', deleteSession as any);
router.put('/:id/notes', updateSessionNotes as any);

export default router;
