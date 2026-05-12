import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Team from '../models/Team';
import User from '../models/User';

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const team = await Team.create({ ...req.body, managerId: req.user!._id });
    res.status(201).json({ success: true, data: team });
  } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const getTeams = async (_req: AuthRequest, res: Response): Promise<void> => {
  const teams = await Team.find()
    .populate('managerId', 'name email avatar')
    .populate('members', 'name email avatar role performanceScore');
  res.json({ success: true, data: teams });
};

export const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  const team = await Team.findById(req.params.id)
    .populate('managerId', 'name email avatar')
    .populate('members', 'name email avatar role performanceScore tasksCompleted');
  if (!team) { res.status(404).json({ message: 'Team not found' }); return; }
  res.json({ success: true, data: team });
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.body;
  const team = await Team.findByIdAndUpdate(req.params.id, { $addToSet: { members: userId } }, { new: true });
  await User.findByIdAndUpdate(userId, { teamId: req.params.id });
  res.json({ success: true, data: team });
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.body;
  const team = await Team.findByIdAndUpdate(req.params.id, { $pull: { members: userId } }, { new: true });
  await User.findByIdAndUpdate(userId, { $unset: { teamId: '' } });
  res.json({ success: true, data: team });
};
