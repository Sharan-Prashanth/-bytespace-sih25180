import express from 'express';
import {
  inviteCoInvestigator,
  addCollaborator,
  getCollaborators,
  uploadImage,
  uploadDocument
} from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Proposal collaboration routes
router.post('/proposals/:proposalId/invite-ci', inviteCoInvestigator);
router.post('/proposals/:proposalId/add-collaborator', addCollaborator);
router.get('/proposals/:proposalId/collaborators', getCollaborators);

// Legacy routes without /proposals prefix (for backward compatibility)
router.post('/:proposalId/invite-ci', inviteCoInvestigator);
router.post('/:proposalId/add-collaborator', addCollaborator);
router.get('/:proposalId/collaborators', getCollaborators);

// File upload routes
router.post('/upload/image', upload.single('image'), uploadImage);
router.post('/upload/document', upload.single('document'), uploadDocument);

export default router;
