import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  addComment, 
  sendReminders,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  addAttachment,
  deleteAttachment,
  logTime,
  getTimeLogs,
  addWatcher,
  removeWatcher,
  addDependency,
  removeDependency,
  getActivityLog,
  updateProgress,
  getTasksByPriority,
  getTasksByComplexity,
  getTaskStats,
} from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// ──────────────── TASK CRUD ────────────────
router.post('/', createTask);
router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.get('/priority/:priority', getTasksByPriority);
router.get('/complexity/:complexity', getTasksByComplexity);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

// ──────────────── COMMENTS & ACTIVITY ────────────────
router.post('/:id/comments', addComment);
router.get('/:id/activity', getActivityLog);

// ──────────────── SUBTASKS ────────────────
router.post('/:id/subtasks', addSubtask);
router.put('/:id/subtasks/:subtaskId', updateSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

// ──────────────── ATTACHMENTS ────────────────
router.post('/:id/attachments', addAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

// ──────────────── TIME LOGGING ────────────────
router.post('/:id/time-logs', logTime);
router.get('/:id/time-logs', getTimeLogs);

// ──────────────── WATCHERS ────────────────
router.post('/:id/watchers', addWatcher);
router.delete('/:id/watchers/:userId', removeWatcher);

// ──────────────── TASK DEPENDENCIES ────────────────
router.post('/:id/dependencies', addDependency);
router.delete('/:id/dependencies', removeDependency);

// ──────────────── PROGRESS ────────────────
router.put('/:id/progress', updateProgress);

// ──────────────── REMINDERS ────────────────
router.post('/reminders', authorize('admin', 'manager'), sendReminders);

export default router;
