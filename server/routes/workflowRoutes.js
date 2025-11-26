import express from 'express';
import {
  updateProposalStatus,
  assignReviewer,
  requestClarification,
  getDashboardStats
} from '../controllers/workflowController.js';
import { authenticate } from '../middleware/auth.js';
import { isCommitteeMember } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard/stats', getDashboardStats);

router.put('/:proposalId/status', isCommitteeMember, updateProposalStatus);
router.post('/:proposalId/assign-reviewer', isCommitteeMember, assignReviewer);
router.post('/:proposalId/request-clarification', requestClarification);

export default router;
