import { Router } from 'express';
import { RateController } from './rate.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new RateController();

// Require authentication for all rate routes
router.use(authenticateToken);

router.get('/', controller.getRates);
router.get('/:id', controller.getRateById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
