import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new OrganizationController();

// Require authentication for all organization routes
router.use(authenticateToken);

router.get('/me', controller.getMyOrganization);
router.get('/:id', controller.getOrganizationById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
