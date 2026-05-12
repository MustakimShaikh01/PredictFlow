import { Router } from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask, addComment, sendReminders } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/reminders', authorize('admin', 'manager'), sendReminders);
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);
router.post('/:id/comments', addComment);
export default router;
