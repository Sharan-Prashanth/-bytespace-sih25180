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
  beaconSave
} from '../controllers/proposalController.js';
import { authenticate, authenticateBeacon } from '../middleware/auth.js';
import { upload, uploadFormIPdf } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Beacon save uses query token authentication (for sendBeacon API)
router.post('/:proposalId/beacon-save', authenticateBeacon, beaconSave);

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
