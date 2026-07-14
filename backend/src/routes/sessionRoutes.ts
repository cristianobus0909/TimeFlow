import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createSession,
  getSessions,
  deleteSession,
  updateSessionNotes,
} from '../controllers/sessionController';

const router = Router();

// Secure all session endpoints
router.use(authenticateToken as any);

router.post('/', createSession as any);
router.get('/', getSessions as any);
router.delete('/:id', deleteSession as any);
router.put('/:id/notes', updateSessionNotes as any);

export default router;
