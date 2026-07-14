import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = Router();

// Secure settings endpoints
router.use(authenticateToken as any);

router.get('/', getSettings as any);
router.put('/', updateSettings as any);

export default router;
