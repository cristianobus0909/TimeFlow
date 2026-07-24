import { Router } from 'express';
import { ClientController } from './client.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new ClientController();

// Require authentication for all client routes
router.use(authenticateToken);

router.get('/', controller.getClients);
router.get('/:id', controller.getClientById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
