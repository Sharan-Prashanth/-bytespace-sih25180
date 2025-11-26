import express from 'express';
import {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,
  submitProposal,
  getProposalTracking,
  updateProposalInfo
} from '../controllers/proposalController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getProposals)
  .post(createProposal);

router.route('/:proposalId')
  .get(getProposalById)
  .put(updateProposal)
  .delete(deleteProposal);

router.post('/:proposalId/submit', submitProposal);
router.get('/:proposalId/track', getProposalTracking);
router.patch('/:proposalId/info', updateProposalInfo);

export default router;
