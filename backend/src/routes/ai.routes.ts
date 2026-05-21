import { Router } from 'express';
import {
  predictCompletion,
  recommendTeam,
  analyzePerformance,
  estimateTask,
  analyzeProjectRisk,
  generateTaskDescription
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/predict/completion', predictCompletion);
router.post('/recommend/team', recommendTeam);
router.get('/analyze/performance', analyzePerformance);
router.post('/estimate/task', estimateTask);
router.post('/predict/risk', analyzeProjectRisk);
router.post('/generate/description', generateTaskDescription);

export default router;
