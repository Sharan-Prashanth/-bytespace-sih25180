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
  deleteFormI
} from '../controllers/proposalController.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadFormIPdf } from '../middleware/upload.js';
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
router.post('/:proposalCode/upload-formi', uploadFormIPdf.single('file'), uploadFormI);
router.delete('/:proposalCode/formi', deleteFormI);

export default router;
