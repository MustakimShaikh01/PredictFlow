import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import Task from '../models/Task';
import User from '../models/User';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Predict task completion days using AI service (with fallback)
export const predictCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, complexity, teamSize, estimatedHours } = req.body;
    const tasks = projectId ? await Task.find({ projectId }) : [];
    const completed = tasks.filter(t => t.status === 'completed');
    const avgActual = completed.length
      ? completed.reduce((s, t) => s + t.actualHours, 0) / completed.length
      : estimatedHours;

    try {
      const { data } = await axios.post(`${AI_URL}/predict/completion`, {
        complexity, teamSize, estimatedHours, avgActual,
      });
      res.json({ success: true, data });
    } catch {
      // Fallback: simple heuristic
      const predicted = Math.ceil((estimatedHours / teamSize) * (complexity === 'high' ? 1.5 : complexity === 'medium' ? 1.2 : 1));
      res.json({ success: true, data: { predictedDays: predicted, confidence: 0.7, source: 'heuristic' } });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// Recommend team members for a project
export const recommendTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills, projectType } = req.body;
    const users = await User.find({ isActive: true }).select('name role performanceScore tasksCompleted department experience');

    try {
      const { data } = await axios.post(`${AI_URL}/recommend/team`, { skills, projectType, users });
      res.json({ success: true, data });
    } catch {
      // Fallback: rank by performance score
      const ranked = users.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
      res.json({ success: true, data: { recommended: ranked, source: 'heuristic' } });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// Promotion recommendations
export const analyzePerformance = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ isActive: true, role: 'employee' })
      .select('name performanceScore tasksCompleted experience department');

    const recommendations = users.map(u => ({
      user: u,
      promotionScore: Math.min(100, (u.performanceScore * 0.5) + (Math.min(u.tasksCompleted, 50) * 1) + (Math.min(u.experience, 10) * 2)),
      recommendation: u.performanceScore >= 80 && u.tasksCompleted >= 20 ? 'Promote' : u.performanceScore >= 60 ? 'Review' : 'Monitor',
    })).sort((a, b) => b.promotionScore - a.promotionScore);

    res.json({ success: true, data: recommendations });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};
