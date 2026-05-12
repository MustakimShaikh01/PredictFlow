import { Router } from 'express';
import { getDashboardStats, getTeamPerformance, getProjectProgress } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/dashboard', getDashboardStats);
router.get('/team-performance', getTeamPerformance);
router.get('/project-progress', getProjectProgress);
export default router;
