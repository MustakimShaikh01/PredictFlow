import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Task from '../models/Task';
import { sendTaskAssignedEmail, sendTaskCompletedEmail, sendTaskReminderEmail } from '../services/email.service';
import User from '../models/User';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user!._id });
    const assignee = await User.findById(task.assignedTo);
    if (assignee) await sendTaskAssignedEmail(assignee.email, assignee.name, task.title);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter: Record<string, any> = {};
  if (req.query.projectId) filter.projectId = req.query.projectId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.user!.role === 'employee') filter.assignedTo = req.user!._id;

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name')
    .populate('projectId', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: tasks });
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name')
    .populate('comments.user', 'name avatar');
  if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
  res.json({ success: true, data: task });
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const update: Record<string, any> = { ...req.body };
  if (update.status === 'completed') update.completedAt = new Date();
  
  const oldTask = await Task.findById(req.params.id);
  const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('assignedTo', 'name email avatar');
  if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

  const assignee = task.assignedTo as any;

  // If newly completed, send email and update stats
  if (update.status === 'completed' && oldTask?.status !== 'completed') {
    await User.findByIdAndUpdate(task.assignedTo, { $inc: { tasksCompleted: 1 } });
    if (assignee && assignee.email) {
      await sendTaskCompletedEmail(assignee.email, task.title, new Date().toLocaleDateString());
    }
  }

  // If newly assigned to someone else
  if (update.assignedTo && oldTask?.assignedTo?.toString() !== update.assignedTo) {
    if (assignee && assignee.email) {
      await sendTaskAssignedEmail(assignee.email, assignee.name, task.title);
    }
  }

  res.json({ success: true, data: task });
};

export const sendReminders = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incompleteTasks = await Task.find({ status: { $ne: 'completed' }, deadline: { $exists: true } }).populate('assignedTo');
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

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Task deleted' });
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { user: req.user!._id, text: req.body.text, createdAt: new Date() } } },
    { new: true }
  ).populate('comments.user', 'name avatar');
  res.json({ success: true, data: task });
};
