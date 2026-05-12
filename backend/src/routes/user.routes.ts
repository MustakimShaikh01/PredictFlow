import { Router } from 'express';
import { getMe, getAllUsers, getUserById, updateUser, getUserStats } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/me', getMe);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.get('/:id/stats', getUserStats);
export default router;
