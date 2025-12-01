import express from 'express';
import {
  getVersions,
  getVersionContent,
  createVersion
} from '../controllers/versionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// GET /api/proposals/:proposalId/versions - List all major versions
router.route('/')
  .get(getVersions)
  .post(createVersion);

// GET /api/proposals/:proposalId/versions/:versionNumber - Get specific version content for viewing
router.get('/:versionNumber', getVersionContent);

// Note: Revert/rollback functionality removed - users can only view previous versions
// Previous versions are opened in view page in read-only mode

export default router;
