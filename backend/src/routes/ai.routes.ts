import { Router } from 'express';
import { predictCompletion, recommendTeam, analyzePerformance } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/predict/completion', predictCompletion);
router.post('/recommend/team', recommendTeam);
router.get('/analyze/performance', analyzePerformance);
export default router;
