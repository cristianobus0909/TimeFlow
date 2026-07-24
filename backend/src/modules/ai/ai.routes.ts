import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticateToken } from '@core/middleware/auth.middleware';

const router = Router();
const controller = new AIController();

// Require authorization token middleware
router.use(authenticateToken);

router.get('/daily-brief', controller.getDailyBrief);
router.get('/insights', controller.getInsights);
router.post('/search', controller.naturalLanguageSearch);

export const aiRoutes = router;
export default aiRoutes;
