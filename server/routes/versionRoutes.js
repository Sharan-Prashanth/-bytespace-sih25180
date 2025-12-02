import express from 'express';
import {
  getVersions,
  getVersionContent,
  createVersion,
  getDraft,
  saveAsDraft,
  discardDraft
} from '../controllers/versionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// GET /api/proposals/:proposalId/versions - List all versions (major + draft if exists)
// POST /api/proposals/:proposalId/versions - Create new major version (promotes draft)
router.route('/')
  .get(getVersions)
  .post(createVersion);

// Draft version management
// GET /api/proposals/:proposalId/draft - Get current draft
// POST /api/proposals/:proposalId/draft - Save changes to draft (create if not exists)
// DELETE /api/proposals/:proposalId/draft - Discard draft
router.route('/draft')
  .get(getDraft)
  .post(saveAsDraft)
  .delete(discardDraft);

// GET /api/proposals/:proposalId/versions/:versionNumber - Get specific version content for viewing
router.get('/:versionNumber', getVersionContent);

// Note: 
// - Draft versions are working copies that get overwritten with each save
// - When a new major version is created, the draft is promoted and becomes permanent
// - Previous major versions are read-only and can be viewed in the view page

export default router;
