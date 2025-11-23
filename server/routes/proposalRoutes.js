import express from "express";
import { 
  // Core CRUD operations
  createProposal,
  getProposals,
  getMyProposals,
  getInvestigatorProposals,
  getCMPDIProposals,
  getExpertProposals,
  getTSSRCProposals,
  getSSRCProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  
  // Draft operations
  saveDraft,
  getDrafts,
  
  // Form-specific operations
  updateProposalForm,
  getProposalForm,
  getProposalForms,
  uploadFormPdf,
  
  // Submission & Status
  submitProposal,
  updateProposalStatus,
  
  // Collaboration
  inviteCollaborator,
  respondToInvitation,
  removeCollaborator,
  updateCollaboratorPermissions,
  
  // Committee Operations - CMPDI
  assignCMPDIMember,
  assignExpertReviewer,
  submitExpertReview,
  submitCMPDIDecision,
  
  // Committee Operations - TSSRC
  assignTSSRCMember,
  submitTSSRCDecision,
  
  // Committee Operations - SSRC
  assignSSRCMember,
  submitSSRCDecision,
  
  // Comments & Feedback
  addComment,
  getComments,
  
  // Documents
  uploadDocument,
  getDocuments,
  deleteDocument,
  
  // Monitoring (Optional)
  addMonitoringLog,
  getMonitoringLogs,
  
  // AI Evaluation
  triggerAIEvaluation,
  getAIEvaluation,
  
  // Statistics & Reports
  getProposalStats,
  getWorkflowTimeline
} from "../controllers/proposalController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============= CORE CRUD OPERATIONS =============
// Create new proposal (Principal Investigators / Users)
router.post("/", authorize('USER', 'SUPER_ADMIN'), createProposal);

// Get all proposals (filtered by user role)
router.get("/", getProposals);

// Get user's own proposals
router.get("/my-proposals", getMyProposals);

// ============= DRAFT OPERATIONS =============
// Save draft (create or update)
router.post("/draft", authorize('USER', 'SUPER_ADMIN'), saveDraft);

// Get user's drafts
router.get("/drafts", authorize('USER', 'SUPER_ADMIN'), getDrafts);

// Role-specific proposal endpoints
router.get("/investigator", authorize('USER', 'SUPER_ADMIN'), getInvestigatorProposals);
router.get("/cmpdi", authorize('CMPDI_MEMBER', 'SUPER_ADMIN'), getCMPDIProposals);
router.get("/expert", authorize('EXPERT_REVIEWER', 'SUPER_ADMIN'), getExpertProposals);
router.get("/tssrc", authorize('TSSRC_MEMBER', 'SUPER_ADMIN'), getTSSRCProposals);
router.get("/ssrc", authorize('SSRC_MEMBER', 'SUPER_ADMIN'), getSSRCProposals);

// Get single proposal by ID
router.get("/:id", getProposalById);

// Update proposal metadata
router.put("/:id", authorize('USER', 'SUPER_ADMIN'), updateProposal);

// Delete proposal (soft delete, only drafts)
router.delete("/:id", authorize('USER', 'SUPER_ADMIN'), deleteProposal);

// ============= FORM-SPECIFIC OPERATIONS =============
// Get all forms from a proposal
router.get("/:id/forms", getProposalForms);

// Get specific form content
router.get("/:id/forms/:formKey", getProposalForm);

// Update specific form content
router.put("/:id/forms/:formKey", authorize('USER', 'SUPER_ADMIN'), updateProposalForm);

// Upload PDF for a specific form
router.post("/:id/forms/:formKey/upload-pdf", authorize('USER', 'SUPER_ADMIN'), uploadFormPdf);

// ============= SUBMISSION & STATUS =============
// Submit proposal (draft → submitted)
router.post("/:id/submit", authorize('USER', 'SUPER_ADMIN'), submitProposal);

// Update proposal status (committee members only)
router.put("/:id/status", authorize('CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'), updateProposalStatus);

// ============= COLLABORATION =============
// Invite collaborator (only principal investigators)
router.post("/:id/collaborators/invite", authorize('USER', 'SUPER_ADMIN'), inviteCollaborator);

// Respond to collaboration invitation
router.post("/:id/collaborators/respond", authorize('USER'), respondToInvitation);

// Remove collaborator
router.delete("/:id/collaborators/:userId", authorize('USER', 'SUPER_ADMIN'), removeCollaborator);

// Update collaborator permissions
router.put("/:id/collaborators/:userId/permissions", authorize('USER', 'SUPER_ADMIN'), updateCollaboratorPermissions);

// ============= CMPDI OPERATIONS =============
// Assign CMPDI member to proposal
router.post("/:id/cmpdi/assign-member", authorize('CMPDI_MEMBER', 'SUPER_ADMIN'), assignCMPDIMember);

// Assign expert reviewer
router.post("/:id/cmpdi/assign-expert", authorize('CMPDI_MEMBER', 'SUPER_ADMIN'), assignExpertReviewer);

// Submit expert review
router.post("/:id/cmpdi/expert-review", authorize('EXPERT_REVIEWER', 'SUPER_ADMIN'), submitExpertReview);

// Submit CMPDI decision
router.post("/:id/cmpdi/decision", authorize('CMPDI_MEMBER', 'SUPER_ADMIN'), submitCMPDIDecision);

// ============= TSSRC OPERATIONS =============
// Assign TSSRC member
router.post("/:id/tssrc/assign-member", authorize('TSSRC_MEMBER', 'SUPER_ADMIN'), assignTSSRCMember);

// Submit TSSRC decision
router.post("/:id/tssrc/decision", authorize('TSSRC_MEMBER', 'SUPER_ADMIN'), submitTSSRCDecision);

// ============= SSRC OPERATIONS =============
// Assign SSRC member
router.post("/:id/ssrc/assign-member", authorize('SSRC_MEMBER', 'SUPER_ADMIN'), assignSSRCMember);

// Submit SSRC decision
router.post("/:id/ssrc/decision", authorize('SSRC_MEMBER', 'SUPER_ADMIN'), submitSSRCDecision);

// ============= COMMENTS & FEEDBACK =============
// Add comment to proposal
router.post("/:id/comments", addComment);

// Get all comments for proposal
router.get("/:id/comments", getComments);

// ============= DOCUMENTS =============
// Upload document
router.post("/:id/documents", uploadDocument);

// Get all documents
router.get("/:id/documents", getDocuments);

// Delete document
router.delete("/:id/documents/:documentId", authorize('USER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'), deleteDocument);

// ============= MONITORING (OPTIONAL) =============
// Add monitoring log
router.post("/:id/monitoring", authorize('CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'), addMonitoringLog);

// Get monitoring logs
router.get("/:id/monitoring", getMonitoringLogs);

// ============= AI EVALUATION =============
// Trigger AI evaluation
router.post("/:id/ai-evaluation/trigger", authorize('CMPDI_MEMBER', 'SUPER_ADMIN'), triggerAIEvaluation);

// Get AI evaluation results
router.get("/:id/ai-evaluation", getAIEvaluation);

// ============= STATISTICS & REPORTS =============
// Get proposal statistics
router.get("/:id/stats", getProposalStats);

// Get workflow timeline
router.get("/:id/timeline", getWorkflowTimeline);

export default router;
