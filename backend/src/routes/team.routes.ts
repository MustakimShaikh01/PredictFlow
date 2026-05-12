import { Router } from 'express';
import { createTeam, getTeams, getTeamById, addMember, removeMember } from '../controllers/team.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/members', addMember);
router.delete('/:id/members', removeMember);
export default router;
