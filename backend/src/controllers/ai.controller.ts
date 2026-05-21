import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import Task from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';

const AI_URL = process.env.AI_SERVICE_URL || 'https://predictflow.onrender.com';

// 1. Predict task completion days (with heuristic fallback)
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
      // Heuristic fallback
      const predicted = Math.ceil((estimatedHours / teamSize) * (complexity === 'high' ? 1.5 : complexity === 'medium' ? 1.2 : 1));
      res.json({ success: true, data: { predictedDays: predicted, confidence: 0.75, source: 'heuristic' } });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// 2. Recommend team members for a project
export const recommendTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills, projectType } = req.body;
    const users = await User.find({ isActive: true }).select('name role performanceScore tasksCompleted department experience');

    try {
      const { data } = await axios.post(`${AI_URL}/recommend/team`, { skills, projectType, users });
      res.json({ success: true, data });
    } catch {
      // Heuristic fallback: Rank by score matching skills
      const skillList = Array.isArray(skills) ? skills.map((s: string) => s.toLowerCase()) : [];
      const ranked = users.map(u => {
        let score = u.performanceScore;
        // Boost if role fits projectType or skills match (simulated)
        if (skillList.some((s: string) => u.role.toLowerCase().includes(s))) score += 10;
        return { user: u, score: Math.min(100, score) };
      }).sort((a, b) => b.score - a.score).map(r => r.user).slice(0, 5);

      res.json({ success: true, data: { recommended: ranked, source: 'heuristic' } });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// 3. Performance & promotion recommendations
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

// 4. NEW: AI Task Complexity & Story Point Estimator
export const estimateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    // Heuristics based on text complexity keywords
    const keywords = (title + ' ' + (description || '')).toLowerCase();
    let complexity: 'easy' | 'medium' | 'hard' | 'extreme' = 'medium';
    let storyPoints = 3;
    let estimatedHours = 12;
    let subtasks: string[] = [];

    if (keywords.includes('setup') || keywords.includes('config') || keywords.includes('doc')) {
      complexity = 'easy';
      storyPoints = 1;
      estimatedHours = 4;
      subtasks = ['Research configuration options', 'Implement initial settings', 'Verify configuration and write docs'];
    } else if (keywords.includes('integrate') || keywords.includes('api') || keywords.includes('auth') || keywords.includes('login')) {
      complexity = 'medium';
      storyPoints = 5;
      estimatedHours = 20;
      subtasks = ['Design API endpoints & request/response schemas', 'Implement backend validation & controllers', 'Create frontend UI & connect API client', 'Write unit tests & verify security controls'];
    } else if (keywords.includes('refactor') || keywords.includes('performance') || keywords.includes('optimize') || keywords.includes('database') || keywords.includes('migration')) {
      complexity = 'hard';
      storyPoints = 8;
      estimatedHours = 32;
      subtasks = ['Analyze current system bottlenecks', 'Draft database schema modification / optimization plan', 'Execute dry-run migration & backup controls', 'Rewrite optimized code queries', 'Verify load handling & rollback plans'];
    } else if (keywords.includes('architect') || keywords.includes('rewrite') || keywords.includes('scaling') || keywords.includes('deploy')) {
      complexity = 'extreme';
      storyPoints = 13;
      estimatedHours = 60;
      subtasks = ['Create complete system design architecture document', 'Design distributed scaling model & pipeline constraints', 'Construct containerized infrastructure configurations', 'Write foundational boilerplate codes', 'Perform multi-stage integration & security analysis'];
    } else {
      subtasks = ['Define initial requirements & target outcomes', 'Develop core feature logic implementation', 'Conduct thorough manual and automated code tests'];
    }

    res.json({
      success: true,
      data: {
        complexity,
        storyPoints,
        estimatedHours,
        subtasks,
        confidence: 0.82,
        aiExplanation: `Based on title analysis: "${title}", the task contains patterns relating to development flows. Recommended ${storyPoints} story points with a structured ${complexity} track and automated breakdown of ${subtasks.length} standard subtasks.`,
      }
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// 5. NEW: AI Project Risk & Bottleneck Analysis
export const analyzeProjectRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      res.status(400).json({ message: 'ProjectId is required' });
      return;
    }

    const project = await Project.findById(projectId).populate('managerId', 'name');
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name email performanceScore');
    if (!tasks.length) {
      res.json({
        success: true,
        data: {
          riskLevel: 'Low',
          riskScore: 10,
          summary: 'No active tasks found in this project. Ready for allocation!',
          bottlenecks: [],
          delayedTasks: [],
        }
      });
      return;
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed');
    const critical = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;

    // Calculate simulated Risk score
    let riskScore = 20; // baseline
    riskScore += (overdue.length / total) * 40;
    riskScore += (critical / total) * 20;
    if (completed / total < 0.3 && tasks.some(t => t.status === 'in-progress')) riskScore += 15;
    riskScore = Math.min(100, Math.round(riskScore));

    const riskLevel = riskScore > 75 ? 'Critical' : riskScore > 45 ? 'Medium' : 'Low';

    // Identify bottleneck assignees (members with too many unfinished tasks)
    const assigneeMap: Record<string, { name: string; count: number; overdue: number }> = {};
    tasks.forEach(t => {
      if (t.status !== 'completed' && t.assignedTo) {
        const id = t.assignedTo._id.toString();
        const isOverdue = t.deadline && new Date(t.deadline) < new Date();
        if (!assigneeMap[id]) {
          assigneeMap[id] = { name: (t.assignedTo as any).name, count: 0, overdue: 0 };
        }
        assigneeMap[id].count += 1;
        if (isOverdue) assigneeMap[id].overdue += 1;
      }
    });

    const bottlenecks = Object.values(assigneeMap)
      .filter(u => u.count >= 3 || u.overdue >= 1)
      .sort((a, b) => (b.count + b.overdue) - (a.count + a.overdue));

    res.json({
      success: true,
      data: {
        projectName: project.title,
        riskLevel,
        riskScore,
        summary: riskLevel === 'Critical'
          ? `High risk detected. The project has ${overdue.length} overdue tasks and ${critical} critical pending items.`
          : riskLevel === 'Medium'
            ? `Moderate operational risks. Keep an eye on task deadlines and assignee workloads.`
            : `Project is in highly healthy standing. Completion rate: ${Math.round((completed / total) * 100)}%.`,
        stats: {
          totalTasks: total,
          completedTasks: completed,
          overdueTasks: overdue.length,
          criticalPending: critical,
        },
        bottlenecks,
        delayedTasks: overdue.map(o => ({
          id: o._id,
          title: o.title,
          deadline: o.deadline,
          assignee: (o.assignedTo as any)?.name || 'Unassigned',
        })),
      }
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// 6. NEW: AI Task Description & Content Auto-generator
export const generateTaskDescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, tone } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const currentTone = tone || 'Professional';
    const draft = `### 📋 Task Overview
We need to implement the feature: **"${title}"**. This will ensure that our system meets target milestones and architectural guidelines.

### 🎯 Key Requirements & Objectives
- Achieve robust, secure development standards.
- Ensure thorough test coverage and schema validation.
- Implement necessary frontend inputs or API adjustments cleanly.
- Verify compatibility with core system configurations.

### 🧪 Acceptance Criteria
1. **Functional Validation**: The implementation successfully meets the required output.
2. **Quality Check**: Code successfully linted with proper error handling.
3. **Integration**: Verified API and UI consistency across components.

*Draft generated automatically by PredictFlow AI in ${currentTone} tone.*`;

    res.json({ success: true, data: { description: draft } });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};
