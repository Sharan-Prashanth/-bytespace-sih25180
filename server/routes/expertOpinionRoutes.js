import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  submitOpinion,
  getOpinions,
  checkUserOpinion,
  getOpinionStats
} from '../controllers/expertOpinionController.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// POST /api/proposals/:proposalId/opinions - Submit opinion
router.post('/', submitOpinion);

// GET /api/proposals/:proposalId/opinions - Get all opinions
router.get('/', getOpinions);

// GET /api/proposals/:proposalId/opinions/check - Check if user has submitted opinion
router.get('/check', checkUserOpinion);

// GET /api/proposals/:proposalId/opinions/stats - Get opinion statistics
router.get('/stats', getOpinionStats);

export default router;
