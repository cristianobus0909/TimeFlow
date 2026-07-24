import { Router } from 'express';
import { AttachmentController } from './attachment.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new AttachmentController();

router.use(authenticateToken);

router.get('/', controller.getAttachments);
router.post('/', controller.addAttachment);

export default router;
