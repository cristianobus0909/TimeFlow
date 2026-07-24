import { Router } from 'express';
import { CommentController } from './comment.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new CommentController();

router.use(authenticateToken);

router.get('/', controller.getComments);
router.post('/', controller.addComment);

export default router;
