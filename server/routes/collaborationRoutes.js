import express from 'express';
import {
  inviteCoInvestigator,
  addCollaborator,
  getCollaborators,
  removeCollaborator,
  getActiveUsers,
  uploadImage,
  uploadDocument,
  deleteImage,
  getProposalForCollaboration,
  syncProposalData
} from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Get proposal for collaboration (with full details)
router.get('/proposals/:proposalId/collaborate', getProposalForCollaboration);

// Sync proposal data (create minor version)
router.post('/proposals/:proposalId/sync', syncProposalData);
router.post('/:proposalId/sync', syncProposalData);

// Proposal collaboration routes
router.post('/proposals/:proposalId/invite-ci', inviteCoInvestigator);
router.post('/proposals/:proposalId/add-collaborator', addCollaborator);
router.get('/proposals/:proposalId/collaborators', getCollaborators);
router.delete('/proposals/:proposalId/collaborators/:collaboratorId', removeCollaborator);
router.get('/proposals/:proposalId/active-users', getActiveUsers);

// Legacy routes without /proposals prefix (for backward compatibility)
router.post('/:proposalId/invite-ci', inviteCoInvestigator);
router.post('/:proposalId/add-collaborator', addCollaborator);
router.get('/:proposalId/collaborators', getCollaborators);
router.delete('/:proposalId/collaborators/:collaboratorId', removeCollaborator);
router.get('/:proposalId/active-users', getActiveUsers);

// File upload routes
router.post('/upload/image', upload.single('image'), uploadImage);
router.post('/upload/document', upload.single('document'), uploadDocument);
router.delete('/delete/image', deleteImage);

export default router;
