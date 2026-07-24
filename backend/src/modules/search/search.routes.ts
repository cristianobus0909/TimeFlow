import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new SearchController();

router.use(authenticateToken);

router.get('/', controller.search);

export default router;
