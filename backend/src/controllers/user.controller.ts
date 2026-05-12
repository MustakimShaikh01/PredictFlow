import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Task from '../models/Task';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, user: req.user });
};

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ success: true, data: user });
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, department, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, department, avatar }, { new: true }).select('-password');
  res.json({ success: true, data: user });
};

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.id;
  const tasks = await Task.find({ assignedTo: userId });
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overdue = tasks.filter(t => t.deadline < new Date() && t.status !== 'completed').length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  res.json({ success: true, data: { total: tasks.length, completed, inProgress, overdue, completionRate } });
};
