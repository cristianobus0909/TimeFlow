import { Router } from 'express';
import { AIController } from './ai.controller';

const router = Router();
const controller = new AIController();

router.get('/daily-brief', controller.getDailyBrief);
router.get('/insights', controller.getInsights);
router.post('/search', controller.naturalLanguageSearch);

export const aiRoutes = router;
export default aiRoutes;
