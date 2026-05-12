import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Project from '../models/Project';
import Task from '../models/Task';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.create({ ...req.body, managerId: req.user!._id });
    res.status(201).json({ success: true, data: project });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter: Record<string, any> = {};
  if (req.query.teamId) filter.teamId = req.query.teamId;
  if (req.query.status) filter.status = req.query.status;

  const projects = await Project.find(filter)
    .populate('managerId', 'name email avatar')
    .populate('teamId', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: projects });
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id)
    .populate('managerId', 'name email avatar')
    .populate('teamId', 'name members');
  if (!project) { res.status(404).json({ message: 'Project not found' }); return; }

  const tasks = await Task.find({ projectId: project._id })
    .populate('assignedTo', 'name avatar');
  res.json({ success: true, data: { ...project.toJSON(), tasks } });
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: project });
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  await Project.findByIdAndDelete(req.params.id);
  await Task.deleteMany({ projectId: req.params.id });
  res.json({ success: true, message: 'Project deleted' });
};
