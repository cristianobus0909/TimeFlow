import { Router } from 'express';
import { authenticateToken } from '@core/middleware/auth.middleware';
import { getSettings, updateSettings } from './settings.controller';

const router = Router();

// Secure settings endpoints
router.use(authenticateToken as any);

router.get('/', getSettings as any);
router.put('/', updateSettings as any);

export default router;
