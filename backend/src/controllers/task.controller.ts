import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Task from '../models/Task';
import { sendTaskAssignedEmail, sendTaskCompletedEmail, sendTaskReminderEmail } from '../services/email.service';
import User from '../models/User';

// Utility function to log activity
const logActivity = async (taskId: string, userId: string, action: string, changes: Record<string, any> = {}) => {
  await Task.findByIdAndUpdate(taskId, {
    $push: {
      activityLogs: {
        user: userId,
        action,
        changes,
        createdAt: new Date(),
      },
    },
  });
};

// ──────────────── TASK CRUD ────────────────

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user!._id,
      watchers: [req.user!._id],
    });
    // Respond immediately — don't block on email or activity log
    res.status(201).json({ success: true, data: task });
    // Fire-and-forget side effects
    logActivity(task._id.toString(), req.user!._id.toString(), 'created', {}).catch(() => {});
    User.findById(task.assignedTo).then(assignee => {
      if (assignee) sendTaskAssignedEmail(assignee.email, assignee.name, task.title).catch(() => {});
    }).catch(() => {});
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.complexity) filter.complexity = req.query.complexity;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.labels) filter.labels = { $in: (req.query.labels as string).split(',') };
    if (req.user!.role === 'employee') filter.assignedTo = req.user!._id;

    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'subtasks.title': { $regex: search, $options: 'i' } },
        { labels: { $regex: search, $options: 'i' } },
      ];
    }

    const sortBy = req.query.sortBy || 'deadline';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Lean list: only fields needed for the table view
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name avatar')
      .populate('projectId', 'title')
      .select('title status priority deadline progress estimatedHours assignedTo projectId createdAt')
      .sort({ [sortBy as string]: sortOrder })
      .lean();

    res.json({ success: true, data: tasks });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name')
      .populate('watchers', 'name')
      .populate('comments.user', 'name avatar')
      .populate('subtasks.assignedTo', 'name')
      .populate('attachments.uploadedBy', 'name')
      .populate('timeLogs.user', 'name')
      .populate('activityLogs.user', 'name')
      .populate('blockedBy', 'title status')
      .populate('blocks', 'title status');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const update: Record<string, any> = { ...req.body };
    const oldTask = await Task.findById(req.params.id);
    
    if (update.status === 'completed') {
      update.completedAt = new Date();
      update.progress = 100;
      update.completionPercentage = 100;
    }
    
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('assignedTo', 'name email avatar');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    const assignee = task.assignedTo as any;
    const changes = {};
    for (const key in update) {
      if (oldTask && oldTask[key as keyof typeof oldTask] !== update[key]) {
        changes[key as string] = { old: oldTask?.[key as keyof typeof oldTask], new: update[key] };
      }
    }
    
    await logActivity(task._id.toString(), req.user!._id.toString(), 'updated', changes);

    if (update.status === 'completed' && oldTask?.status !== 'completed') {
      await User.findByIdAndUpdate(task.assignedTo, { $inc: { tasksCompleted: 1 } });
      if (assignee && assignee.email) {
        await sendTaskCompletedEmail(assignee.email, task.title, new Date().toLocaleDateString());
      }
    }

    if (update.assignedTo && oldTask?.assignedTo?.toString() !== update.assignedTo) {
      if (assignee && assignee.email) {
        await sendTaskAssignedEmail(assignee.email, assignee.name, task.title);
      }
    }

    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'deleted', { task });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── SUBTASKS ────────────────

export const addSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, assignedTo } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { subtasks: { title, completed: false, assignedTo } } },
      { new: true }
    ).populate('subtasks.assignedTo', 'name');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'added_subtask', { subtask: title });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const updateSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subtaskId } = req.params;
    const { title, completed, assignedTo } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    const subtask = task.subtasks.find(
      (subtask) => subtask._id?.toString() === subtaskId
    );
    if (!subtask) { res.status(404).json({ message: 'Subtask not found' }); return; }

    if (title) subtask.title = title;
    if (typeof completed === 'boolean') {
      subtask.completed = completed;
      if (completed) subtask.completedAt = new Date();
    }
    if (assignedTo) subtask.assignedTo = assignedTo;

    await task.save();
    await logActivity(task._id.toString(), req.user!._id.toString(), 'updated_subtask', { subtaskId, changes: { title, completed, assignedTo } });
    
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const deleteSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { subtasks: { _id: req.params.subtaskId } } },
      { new: true }
    );
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'deleted_subtask', { subtaskId: req.params.subtaskId });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── ATTACHMENTS ────────────────

export const addAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileName, fileUrl, fileSize } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          attachments: { 
            fileName, 
            fileUrl, 
            fileSize,
            uploadedBy: req.user!._id,
            uploadedAt: new Date(),
          } 
        } 
      },
      { new: true }
    ).populate('attachments.uploadedBy', 'name');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'added_attachment', { fileName });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { _id: req.params.attachmentId } } },
      { new: true }
    );
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'deleted_attachment', { attachmentId: req.params.attachmentId });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── TIME LOGGING ────────────────

export const logTime = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hours, date, description } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          timeLogs: { 
            user: req.user!._id,
            hours,
            date: date || new Date(),
            description,
          } 
        },
        $inc: { actualHours: hours },
      },
      { new: true }
    ).populate('timeLogs.user', 'name');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'logged_time', { hours, description });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTimeLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id).populate('timeLogs.user', 'name email');
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ success: true, data: task.timeLogs });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── WATCHERS ────────────────

export const addWatcher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { watchers: req.body.userId } },
      { new: true }
    ).populate('watchers', 'name email');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'added_watcher', { userId: req.body.userId });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const removeWatcher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { watchers: req.params.userId } },
      { new: true }
    ).populate('watchers', 'name email');
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'removed_watcher', { userId: req.params.userId });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── TASK DEPENDENCIES ────────────────

export const addDependency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dependencyId, type } = req.body; // type: 'blocks' or 'blockedBy'
    
    if (type === 'blocks') {
      await Task.findByIdAndUpdate(req.params.id, { $addToSet: { blocks: dependencyId } });
      await Task.findByIdAndUpdate(dependencyId, { $addToSet: { blockedBy: req.params.id } });
    } else {
      await Task.findByIdAndUpdate(req.params.id, { $addToSet: { blockedBy: dependencyId } });
      await Task.findByIdAndUpdate(dependencyId, { $addToSet: { blocks: req.params.id } });
    }
    
    const task = await Task.findById(req.params.id).populate('blocks', 'title').populate('blockedBy', 'title');
    await logActivity(task!._id.toString(), req.user!._id.toString(), 'added_dependency', { dependencyId, type });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const removeDependency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dependencyId, type } = req.body;
    
    if (type === 'blocks') {
      await Task.findByIdAndUpdate(req.params.id, { $pull: { blocks: dependencyId } });
      await Task.findByIdAndUpdate(dependencyId, { $pull: { blockedBy: req.params.id } });
    } else {
      await Task.findByIdAndUpdate(req.params.id, { $pull: { blockedBy: dependencyId } });
      await Task.findByIdAndUpdate(dependencyId, { $pull: { blocks: req.params.id } });
    }
    
    const task = await Task.findById(req.params.id).populate('blocks', 'title').populate('blockedBy', 'title');
    await logActivity(task!._id.toString(), req.user!._id.toString(), 'removed_dependency', { dependencyId, type });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── COMMENTS & ACTIVITY ────────────────

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user!._id, text: req.body.text, createdAt: new Date() } } },
      { new: true }
    ).populate('comments.user', 'name avatar');
    
    await logActivity(task!._id.toString(), req.user!._id.toString(), 'commented', { comment: req.body.text });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getActivityLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id).populate('activityLogs.user', 'name avatar');
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ success: true, data: task.activityLogs });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── PROGRESS & STATUS ────────────────

export const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { progress } = req.body;
    if (progress < 0 || progress > 100) {
      res.status(400).json({ message: 'Progress must be between 0 and 100' });
      return;
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { progress, completionPercentage: progress },
      { new: true }
    );
    
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await logActivity(task._id.toString(), req.user!._id.toString(), 'updated_progress', { progress });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// ──────────────── REMINDERS & RECURRING TASKS ────────────────

export const sendReminders = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incompleteTasks = await Task.find({ 
      status: { $ne: 'completed' }, 
      deadline: { $exists: true } 
    }).populate('assignedTo');
    
    let sentCount = 0;
    for (const task of incompleteTasks) {
      const assignee = task.assignedTo as any;
      if (assignee && assignee.email && task.deadline) {
        await sendTaskReminderEmail(assignee.email, assignee.name, task.title, new Date(task.deadline).toLocaleDateString());
        sentCount++;
      }
    }
    res.json({ success: true, message: `Sent ${sentCount} reminders` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getTasksByPriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ 
      projectId: req.query.projectId,
      priority: req.query.priority 
    })
      .populate('assignedTo', 'name')
      .sort({ deadline: 1 });
    
    res.json({ success: true, data: tasks });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTasksByComplexity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ 
      projectId: req.query.projectId,
      complexity: req.query.complexity 
    })
      .populate('assignedTo', 'name')
      .sort({ storyPoints: -1 });
    
    res.json({ success: true, data: tasks });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTaskStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query.projectId;
    
    const stats = await Task.aggregate([
      { $match: { projectId: require('mongoose').Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgressTasks: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          criticalTasks: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          highPriorityTasks: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          avgEstimatedHours: { $avg: '$estimatedHours' },
          avgActualHours: { $avg: '$actualHours' },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: '$actualHours' },
          totalStoryPoints: { $sum: '$storyPoints' },
        },
      },
    ]);
    
    res.json({ success: true, data: stats[0] || {} });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};
