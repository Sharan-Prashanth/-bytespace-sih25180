import express from 'express';
import {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,
  submitProposal,
  getProposalTracking,
  updateProposalInfo,
  uploadFormI,
  deleteFormI,
  beaconSave,
  getInlineDiscussions,
  saveInlineDiscussions,
  addInlineComment,
  resolveDiscussion,
  getAssignedProposals,
  getExpertReviewHistory,
  updateReviewStatus
} from '../controllers/proposalController.js';
import { authenticate, authenticateBeacon, optionalAuthenticate } from '../middleware/auth.js';
import { upload, uploadFormIPdf } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Beacon save uses query token authentication (for sendBeacon API)
router.post('/:proposalId/beacon-save', authenticateBeacon, beaconSave);

// Discussions routes - support both Bearer token and query token for beacon support
// If query token is present, use beacon auth; otherwise use regular auth
const discussionsAuth = (req, res, next) => {
  if (req.query.token) {
    return authenticateBeacon(req, res, next);
  }
  return authenticate(req, res, next);
};

// Inline discussions routes (before router.use(authenticate))
router.get('/:proposalId/discussions', authenticate, getInlineDiscussions);
router.post('/:proposalId/discussions', discussionsAuth, saveInlineDiscussions);
router.post('/:proposalId/discussions/comment', authenticate, addInlineComment);
router.post('/:proposalId/discussions/resolve', authenticate, resolveDiscussion);

router.use(authenticate);

// Assigned proposals for expert reviewers (must be before /:proposalId routes)
router.get('/assigned-to-me', getAssignedProposals);
router.get('/my-review-history', getExpertReviewHistory);

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
router.post('/:proposalCode/upload-formi', uploadFormIPdf.single('file'), uploadFormI);
router.delete('/:proposalCode/formi', deleteFormI);

// Expert review status update
router.patch('/:proposalId/review-status', updateReviewStatus);

export default router;
