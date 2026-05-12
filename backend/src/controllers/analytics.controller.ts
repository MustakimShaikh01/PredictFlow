import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Task from '../models/Task';
import Project from '../models/Project';
import User from '../models/User';

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [totalTasks, completedTasks, totalProjects, totalUsers] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'completed' }),
    Project.countDocuments(),
    User.countDocuments({ isActive: true }),
  ]);

  const overdueTasks = await Task.countDocuments({ deadline: { $lt: new Date() }, status: { $ne: 'completed' } });
  const activeProjects = await Project.countDocuments({ status: 'active' });

  const tasksByStatus = await Task.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const tasksByPriority = await Task.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      totalTasks, completedTasks, overdueTasks,
      totalProjects, activeProjects, totalUsers,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByStatus, tasksByPriority,
    },
  });
};

export const getTeamPerformance = async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ isActive: true }).select('name performanceScore tasksCompleted role department');
  res.json({ success: true, data: users });
};

export const getProjectProgress = async (_req: AuthRequest, res: Response): Promise<void> => {
  const projects = await Project.find().select('title progress status deadline estimatedHours actualHours');
  res.json({ success: true, data: projects });
};
