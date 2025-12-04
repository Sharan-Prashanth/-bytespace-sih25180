import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import storageService from '../services/storageService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Helper to find proposal by ObjectId or proposalCode
 */
const findProposal = async (proposalId) => {
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    return await Proposal.findById(proposalId);
  }
  return await Proposal.findOne({ proposalCode: proposalId });
};

/**
 * @route   POST /api/proposals/:proposalId/invite-ci
 * @desc    Invite co-investigator
 * @access  Private (PI only)
 */
export const inviteCoInvestigator = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;
  const { proposalId } = req.params;

  // Find proposal
  let proposal = await findProposal(proposalId);
  if (proposal) {
    await proposal.populate('createdBy', 'fullName email');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Only PI can invite
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  if (!isPI) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can invite co-investigators'
    });
  }

  // Check limit (max 5 CIs)
  if (proposal.coInvestigators.length >= 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 co-investigators allowed'
    });
  }

  // Find or create user
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found. Please ask them to register first.'
    });
  }

  // Check if user has USER role only (not committee members, experts, or admins)
  const restrictedRoles = ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'EXPERT_REVIEWER', 'SUPER_ADMIN'];
  const hasRestrictedRole = user.roles.some(role => restrictedRoles.includes(role));
  
  if (hasRestrictedRole) {
    return res.status(400).json({
      success: false,
      message: 'Committee members, expert reviewers, and administrators cannot be invited as co-investigators'
    });
  }

  // Check if already added
  if (proposal.coInvestigators.includes(user._id)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a co-investigator'
    });
  }

  // Add as CI
  proposal.coInvestigators.push(user._id);
  proposal.collaborators.push({
    userId: user._id,
    role: 'CI',
    addedAt: new Date()
  });

  await proposal.save();

  // Send invitation email
  try {
    await emailService.sendCollaborationInviteEmail(
      user.email,
      user.fullName,
      proposal.createdBy.fullName,
      proposal.proposalCode,
      proposal.title
    );
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
  }

  // Log activity
  try {
    await activityLogger.log({
      user: req.user._id,
      action: 'COLLABORATOR_ADDED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        addedUser: user._id,
        role: 'CI'
      },
      ipAddress: req.ip
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  res.json({
    success: true,
    message: 'Co-investigator invited successfully',
    data: {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: 'CI'
      }
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/add-collaborator
 * @desc    Add collaborator (for committee/reviewers)
 * @access  Private (Committee/Admin)
 */
export const addCollaborator = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const { proposalId } = req.params;

  // Check if proposalId is a valid MongoDB ObjectId or a proposalCode
  let proposal;
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    proposal = await Proposal.findById(proposalId);
  } else {
    proposal = await Proposal.findOne({ proposalCode: proposalId });
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already added
  const alreadyAdded = proposal.collaborators.some(
    collab => collab.userId.toString() === userId
  );

  if (alreadyAdded) {
    return res.status(400).json({
      success: false,
      message: 'User is already a collaborator'
    });
  }

  // Add as collaborator
  proposal.collaborators.push({
    userId: user._id,
    role: role || 'REVIEWER',
    addedAt: new Date()
  });

  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'COLLABORATOR_ADDED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      addedUser: user._id,
      role
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Collaborator added successfully',
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role
      }
    }
  });
});

/**
 * @route   GET /api/collaboration/:proposalId/collaborators
 * @desc    Get all collaborators for a proposal
 * @access  Private
 */
export const getCollaborators = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  // Check if proposalId is a valid MongoDB ObjectId or a proposalCode
  let proposal;
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    proposal = await Proposal.findById(proposalId)
      .populate('createdBy', 'fullName email roles designation organisationName')
      .populate('coInvestigators', 'fullName email roles designation organisationName')
      .populate('collaborators.userId', 'fullName email roles designation organisationName')
      .populate('assignedReviewers.reviewer', 'fullName email roles designation organisationName');
  } else {
    proposal = await Proposal.findOne({ proposalCode: proposalId })
      .populate('createdBy', 'fullName email roles designation organisationName')
      .populate('coInvestigators', 'fullName email roles designation organisationName')
      .populate('collaborators.userId', 'fullName email roles designation organisationName')
      .populate('assignedReviewers.reviewer', 'fullName email roles designation organisationName');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Build collaborators list
  const collaborators = [];

  // Add PI
  if (proposal.createdBy) {
    collaborators.push({
      _id: `pi_${proposal.createdBy._id}`,
      user: proposal.createdBy,
      role: 'PI',
      addedAt: proposal.createdAt,
      isActiveNow: false // Will be updated by Socket.io client
    });
  }

  // Add CIs - safely handle populated/non-populated cases
  if (proposal.coInvestigators && proposal.coInvestigators.length > 0) {
    proposal.coInvestigators.forEach(ci => {
      if (ci) {
        const ciId = ci._id || ci;
        const collabEntry = proposal.collaborators.find(c => {
          const userId = c.userId?._id || c.userId;
          return userId && userId.toString() === ciId.toString();
        });
        
        collaborators.push({
          _id: `ci_${ciId}`,
          user: ci,
          role: 'CI',
          addedAt: collabEntry?.addedAt || proposal.createdAt,
          isActiveNow: false
        });
      }
    });
  }

  // Add reviewers - safely handle populated/non-populated cases
  if (proposal.assignedReviewers && proposal.assignedReviewers.length > 0) {
    proposal.assignedReviewers.forEach(reviewer => {
      if (reviewer && reviewer.reviewer) {
        const reviewerId = reviewer.reviewer._id || reviewer.reviewer;
        collaborators.push({
          _id: `reviewer_${reviewerId}`,
          user: reviewer.reviewer,
          role: 'REVIEWER',
          addedAt: reviewer.assignedAt || proposal.createdAt,
          isActiveNow: false
        });
      }
    });
  }

  // Add other collaborators (committee members) - safely handle populated/non-populated cases
  if (proposal.collaborators && proposal.collaborators.length > 0) {
    proposal.collaborators.forEach(collab => {
      if (collab && collab.userId) {
        const userId = collab.userId._id || collab.userId;
        
        // Skip if already added as CI or PI
        const alreadyAdded = collaborators.some(c => {
          const existingUserId = c.user._id || c.user;
          return existingUserId && existingUserId.toString() === userId.toString();
        });
        
        if (!alreadyAdded && collab.role !== 'CI') {
          collaborators.push({
            _id: `collab_${userId}`,
            user: collab.userId,
            role: collab.role || 'COLLABORATOR',
            addedAt: collab.addedAt || proposal.createdAt,
            isActiveNow: false
          });
        }
      }
    });
  }

  res.json({
    success: true,
    data: collaborators
  });
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload image (signature, seal, embedded image)
 * @access  Private
 */
export const uploadImage = asyncHandler(async (req, res) => {
  console.log('[uploadImage] Received upload request');
  console.log('[uploadImage] File:', req.file ? { 
    originalname: req.file.originalname, 
    mimetype: req.file.mimetype, 
    size: req.file.size 
  } : 'No file');
  console.log('[uploadImage] Body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const folder = req.body.folder || 'misc';
  console.log('[uploadImage] Using folder:', folder);

  const uploadResult = await storageService.uploadImage(req.file, folder);
  console.log('[uploadImage] Storage service result:', uploadResult);

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: uploadResult.error
    });
  }

  const responseData = {
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: uploadResult.url,
      path: uploadResult.path,
      s3Key: uploadResult.path // Include s3Key for deletion
    }
  };
  
  console.log('[uploadImage] Sending response:', JSON.stringify(responseData, null, 2));
  res.json(responseData);
});

/**
 * @route   POST /api/upload/document
 * @desc    Upload proposal document
 * @access  Private
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { proposalCode, type } = req.body;

  if (!proposalCode) {
    return res.status(400).json({
      success: false,
      message: 'Proposal code is required'
    });
  }

  const uploadResult = await storageService.uploadProposalFile(
    req.file,
    proposalCode,
    type || 'document'
  );

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Document upload failed',
      error: uploadResult.error
    });
  }

  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      fileUrl: uploadResult.url,
      url: uploadResult.url,
      path: uploadResult.path,
      s3Key: uploadResult.path // Include s3Key for deletion
    }
  });
});

/**
 * @route   DELETE /api/collaboration/delete/image
 * @desc    Delete an image from storage (images bucket)
 * @access  Private
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { url, path, s3Key } = req.body;

  // Use s3Key if provided, otherwise extract from path or url
  let filePath = s3Key || path;
  
  if (!filePath && url) {
    // Extract path from URL (e.g., https://xxx.supabase.co/storage/v1/object/public/images/path/to/file.jpg)
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('images');
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }
    } catch (e) {
      // URL parsing failed, try using url directly
      filePath = url;
    }
  }

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: 'Image path or s3Key is required'
    });
  }

  try {
    const deleteResult = await storageService.deleteFile(storageService.buckets.images, filePath);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Image deletion failed',
        error: deleteResult.error
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Image deletion failed',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/collaboration/delete/document
 * @desc    Delete a document from storage (proposal-files bucket)
 * @access  Private
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { url, path, s3Key } = req.body;

  // Use s3Key if provided, otherwise extract from path or url
  let filePath = s3Key || path;
  
  if (!filePath && url) {
    // Extract path from URL (e.g., https://xxx.supabase.co/storage/v1/object/public/proposal-files/path/to/file.pdf)
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('proposal-files');
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }
    } catch (e) {
      // URL parsing failed, try using url directly
      filePath = url;
    }
  }

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: 'Document path or s3Key is required'
    });
  }

  try {
    const deleteResult = await storageService.deleteFile(storageService.buckets.proposalFiles, filePath);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Document deletion failed',
        error: deleteResult.error
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Document deletion failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/collaboration/:proposalId/track-image
 * @desc    Track an embedded image in a proposal
 * @access  Private
 */
export const trackEmbeddedImage = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { url, s3Key } = req.body;

  if (!url || !s3Key) {
    return res.status(400).json({
      success: false,
      message: 'URL and s3Key are required'
    });
  }

  const proposal = await findProposal(proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check if image is already tracked
  const existingImage = proposal.embeddedImages?.find(img => img.s3Key === s3Key);
  if (!existingImage) {
    if (!proposal.embeddedImages) {
      proposal.embeddedImages = [];
    }
    proposal.embeddedImages.push({
      url,
      s3Key,
      addedAt: new Date()
    });
    await proposal.save();
  }

  res.json({
    success: true,
    message: 'Image tracked successfully'
  });
});

/**
 * @route   DELETE /api/collaboration/:proposalId/embedded-image
 * @desc    Delete an embedded image from storage and remove tracking
 * @access  Private
 */
export const deleteEmbeddedImage = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { url, s3Key } = req.body;

  // Use s3Key if provided, otherwise extract from url
  let filePath = s3Key;
  
  if (!filePath && url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('images');
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }
    } catch (e) {
      filePath = url;
    }
  }

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: 'Image s3Key or URL is required'
    });
  }

  try {
    // Delete from Supabase storage
    const deleteResult = await storageService.deleteFile(storageService.buckets.images, filePath);

    // Remove from proposal tracking (even if storage delete fails - file might not exist)
    if (proposalId) {
      const proposal = await findProposal(proposalId);
      if (proposal && proposal.embeddedImages) {
        proposal.embeddedImages = proposal.embeddedImages.filter(
          img => img.s3Key !== filePath && img.url !== url
        );
        await proposal.save();
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting embedded image:', error);
    res.status(500).json({
      success: false,
      message: 'Image deletion failed',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/collaboration/:proposalId/collaborators/:collaboratorId
 * @desc    Remove a collaborator from proposal
 * @access  Private (PI only for CI removal)
 */
export const removeCollaborator = asyncHandler(async (req, res) => {
  const { proposalId, collaboratorId } = req.params;

  const proposal = await findProposal(proposalId);
  if (proposal) {
    await proposal.populate('createdBy', 'fullName email');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Only PI can remove collaborators (or admin)
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can remove collaborators'
    });
  }

  // Remove from coInvestigators array
  proposal.coInvestigators = proposal.coInvestigators.filter(
    ci => ci.toString() !== collaboratorId
  );

  // Remove from collaborators array
  proposal.collaborators = proposal.collaborators.filter(
    collab => collab.userId.toString() !== collaboratorId
  );

  await proposal.save();

  // Log activity
  try {
    await activityLogger.log({
      user: req.user._id,
      action: 'COLLABORATOR_REMOVED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        removedUser: collaboratorId
      },
      ipAddress: req.ip
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  res.json({
    success: true,
    message: 'Collaborator removed successfully'
  });
});

/**
 * @route   GET /api/collaboration/:proposalId/active-users
 * @desc    Get currently active users in collaboration room
 * @access  Private
 */
export const getActiveUsers = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  // Get collaboration service from app
  const collaborationService = req.app.get('collaborationService');
  
  if (!collaborationService) {
    return res.json({
      success: true,
      data: []
    });
  }

  // Get room state
  const roomState = collaborationService.getRoomState(proposalId);
  
  if (!roomState) {
    return res.json({
      success: true,
      data: []
    });
  }

  res.json({
    success: true,
    data: roomState.activeUsers || []
  });
});

/**
 * @route   GET /api/collaboration/proposals/:proposalId/collaborate
 * @desc    Get proposal for collaboration with full details
 * @access  Private (must be collaborator)
 */
export const getProposalForCollaboration = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Populate all relevant fields
  await proposal.populate([
    { path: 'createdBy', select: 'fullName email roles designation organisationName' },
    { path: 'coInvestigators', select: 'fullName email roles designation organisationName' },
    { path: 'collaborators.userId', select: 'fullName email roles designation organisationName' },
    { path: 'assignedReviewers.reviewer', select: 'fullName email roles designation' }
  ]);

  // Check if user has access
  const userId = req.user._id.toString();
  const isPI = proposal.createdBy?._id?.toString() === userId;
  const isCI = proposal.coInvestigators?.some(ci => ci?._id?.toString() === userId);
  const isCollaborator = proposal.collaborators?.some(c => c?.userId?._id?.toString() === userId);
  const isReviewer = proposal.assignedReviewers?.some(r => r?.reviewer?._id?.toString() === userId);
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');
  const isCommittee = req.user.roles?.some(r => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(r));

  if (!isPI && !isCI && !isCollaborator && !isReviewer && !isAdmin && !isCommittee) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this proposal'
    });
  }

  res.json({
    success: true,
    data: proposal
  });
});

/**
 * @route   POST /api/collaboration/:proposalId/sync
 * @desc    Sync proposal data - saves to draft version for submitted proposals
 * @access  Private (PI or CI only)
 */
export const syncProposalData = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { proposalInfo, forms } = req.body;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  await proposal.populate('createdBy', 'fullName email');

  // Only PI or CI can sync
  const userId = req.user._id.toString();
  const isPI = proposal.createdBy?._id?.toString() === userId;
  const isCI = proposal.coInvestigators?.some(ci => ci?.toString() === userId);
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isCI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI or CI can sync proposal data'
    });
  }

  // Check if proposal is in a final rejected state
  const finalStates = ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'];
  if (finalStates.includes(proposal.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a rejected proposal'
    });
  }

  // For DRAFT proposals, update directly on the proposal
  if (proposal.status === 'DRAFT') {
    if (proposalInfo) {
      const updateFields = ['title', 'fundingMethod', 'principalAgency', 'subAgencies', 
        'projectLeader', 'projectCoordinator', 'durationMonths', 'outlayLakhs'];
      
      updateFields.forEach(field => {
        if (proposalInfo[field] !== undefined) {
          proposal[field] = proposalInfo[field];
        }
      });
    }
    
    if (forms) {
      proposal.forms = forms;
    }

    proposal.updatedAt = new Date();
    await proposal.save();

    return res.json({
      success: true,
      message: 'Proposal synced successfully',
      data: {
        currentVersion: proposal.currentVersion,
        updatedAt: proposal.updatedAt,
        hasDraft: false
      }
    });
  }

  // For submitted proposals, save to draft version
  const draftProposalInfo = proposalInfo ? {
    title: proposalInfo.title ?? proposal.title,
    fundingMethod: proposalInfo.fundingMethod ?? proposal.fundingMethod,
    principalAgency: proposalInfo.principalAgency ?? proposal.principalAgency,
    subAgencies: proposalInfo.subAgencies ?? proposal.subAgencies,
    projectLeader: proposalInfo.projectLeader ?? proposal.projectLeader,
    projectCoordinator: proposalInfo.projectCoordinator ?? proposal.projectCoordinator,
    durationMonths: proposalInfo.durationMonths ?? proposal.durationMonths,
    outlayLakhs: proposalInfo.outlayLakhs ?? proposal.outlayLakhs
  } : {
    title: proposal.title,
    fundingMethod: proposal.fundingMethod,
    principalAgency: proposal.principalAgency,
    subAgencies: proposal.subAgencies,
    projectLeader: proposal.projectLeader,
    projectCoordinator: proposal.projectCoordinator,
    durationMonths: proposal.durationMonths,
    outlayLakhs: proposal.outlayLakhs
  };

  // Get or create draft version
  const { draft, created } = await ProposalVersion.getOrCreateDraft(
    proposal._id,
    req.user._id,
    {
      forms: forms || proposal.forms,
      proposalInfo: draftProposalInfo,
      supportingDocs: proposal.supportingDocs
    }
  );

  // If draft already exists, update it
  if (!created) {
    if (forms) draft.forms = forms;
    draft.proposalInfo = draftProposalInfo;
    draft.lastModifiedBy = req.user._id;
    await draft.save();
  }

  // Update proposal to indicate it has a draft
  if (!proposal.hasDraft) {
    proposal.hasDraft = true;
    proposal.draftVersion = draft.versionNumber;
    await proposal.save();
  }

  // Log activity
  try {
    await activityLogger.log({
      user: req.user._id,
      action: created ? 'DRAFT_CREATED' : 'DRAFT_SYNCED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        draftVersion: draft.versionNumber
      },
      ipAddress: req.ip
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  res.json({
    success: true,
    message: created ? 'Draft created and synced' : 'Draft synced successfully',
    data: {
      currentVersion: proposal.currentVersion,
      draftVersion: draft.versionNumber,
      hasDraft: true,
      updatedAt: draft.updatedAt
    }
  });
});
