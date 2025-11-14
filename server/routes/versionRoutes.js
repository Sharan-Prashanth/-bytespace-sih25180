import express from 'express';
import { saveDraft, history } from '../controllers/versionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Save a draft version (protected)
router.post('/saveDraft', protect, saveDraft);

// Get version history for a proposal
router.get('/history/:proposalId', protect, history);

export default router;
