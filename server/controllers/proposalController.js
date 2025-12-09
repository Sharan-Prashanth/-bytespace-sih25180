import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import proposalIdGenerator from '../utils/proposalIdGenerator.js';
import emailService from '../services/emailService.js';
import aiService from '../services/aiService.js';
import aiValidationService from '../services/aiValidationService.js';
import storageService from '../services/storageService.js';
import formExtractionService from '../services/formExtractionService.js';
import activityLogger from '../utils/activityLogger.js';
import { updateCollaboratorsForStatus, updateAssignedReviewersForExpertReview } from '../utils/roleBasedAssignment.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Helper: Find proposal by ID or proposalCode
 */
const findProposal = async (proposalId) => {
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    return await Proposal.findById(proposalId);
  } else {
    return await Proposal.findOne({ proposalCode: proposalId });
  }
};

/**
 * Helper: Check if user has access to proposal
 */
const checkProposalAccess = (proposal, user) => {
  // Handle both populated and non-populated createdBy
  const createdById = proposal.createdBy?._id || proposal.createdBy;
  const isPI = createdById.toString() === user._id.toString();
  
  // For DRAFT proposals, only the creator (PI) can access
  if (proposal.status === 'DRAFT') {
    return isPI;
  }
  
  // Handle populated co-investigators
  const isCI = proposal.coInvestigators?.some(ci => {
    const ciId = ci._id || ci;
    return ciId.toString() === user._id.toString();
  });
  
  // Handle populated collaborators
  const isCollaborator = proposal.collaborators?.some(collab => {
    const userId = collab.userId?._id || collab.userId;
    return userId.toString() === user._id.toString();
  });
  
  // Handle populated reviewers (assigned reviewers)
  const isAssignedReviewer = proposal.assignedReviewers?.some(rev => {
    const reviewerId = rev.reviewer?._id || rev.reviewer;
    return reviewerId.toString() === user._id.toString();
  });
  
  const isAdmin = user.roles?.includes('SUPER_ADMIN');
  const isCommittee = user.roles?.some(role => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role));
  
  // Expert reviewers have access to proposals in expert review stage or if they're assigned
  const isExpertReviewer = user.roles?.includes('EXPERT_REVIEWER');
  const expertCanAccess = isExpertReviewer && (
    proposal.status === 'CMPDI_EXPERT_REVIEW' || 
    proposal.status === 'CMPDI_ACCEPTED' ||
    proposal.status === 'CMPDI_REJECTED'
  );

  return isPI || isCI || isCollaborator || isAssignedReviewer || isAdmin || isCommittee || expertCanAccess;
};

/**
 * Helper: Process embedded images in forms
 * Replaces base64 images with S3 URLs
 */
const processFormImages = async (forms, proposalCode) => {
  if (!forms) return forms;
  
  const processedForms = JSON.parse(JSON.stringify(forms)); // Deep clone
  
  const processNodes = async (nodes) => {
    if (!Array.isArray(nodes)) return;
    
    for (const node of nodes) {
      if (node.type === 'img' && node.url && node.url.startsWith('data:')) {
        try {
          // Extract base64 data
          const matches = node.url.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Upload to S3
            const uploadResult = await storageService.uploadImage({
              buffer,
              mimetype: mimeType,
              originalname: `${Date.now()}.png`
            }, `${proposalCode}/images`);
            
            if (uploadResult.success) {
              node.url = uploadResult.url;
            }
          }
        } catch (error) {
          console.error('Error processing image:', error);
          // Continue with other images
        }
      }
      
      // Process nested children
      if (node.children) {
        await processNodes(node.children);
      }
    }
  };
  
  // Handle different form structures
  for (const formKey in processedForms) {
    if (processedForms[formKey]) {
      // Handle formi.content structure
      if (processedForms[formKey].content && Array.isArray(processedForms[formKey].content)) {
        await processNodes(processedForms[formKey].content);
      }
      // Handle direct array structure
      else if (Array.isArray(processedForms[formKey])) {
        await processNodes(processedForms[formKey]);
      }
    }
  }
  
  return processedForms;
};

/**
 * @route   GET /api/proposals
 * @desc    Get proposals (filtered by user role)
 * @access  Private
 */
export const getProposals = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const user = req.user;

  let query = { isDeleted: false };

  // Filter based on user role
  if (user.roles.includes('SUPER_ADMIN')) {
    // Admin sees all proposals
  } else if (user.roles.includes('CMPDI_MEMBER')) {
    // CMPDI sees proposals in their review stages and can track proposals forwarded to TSSRC/SSRC
    query.status = { $in: ['SUBMITTED', 'AI_EVALUATION', 'AI_VALIDATION_PENDING', 'CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'] };
  } else if (user.roles.includes('TSSRC_MEMBER')) {
    // TSSRC sees proposals in their review stages and can track proposals forwarded to SSRC
    query.status = { $in: ['TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'] };
  } else if (user.roles.includes('SSRC_MEMBER')) {
    // SSRC sees TSSRC approved proposals and their review stages
    query.status = { $in: ['SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'] };
  } else if (user.roles.includes('EXPERT_REVIEWER')) {
    // Expert reviewers see proposals in expert review stage or assigned to them
    query.$or = [
      { status: 'CMPDI_EXPERT_REVIEW' },
      { 'assignedReviewers.reviewer': user._id }
    ];
  } else {
    // Normal users see their own proposals
    query.$or = [
      { createdBy: user._id },
      { coInvestigators: user._id }
    ];
  }

  // Additional filters
  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { proposalCode: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { projectLeader: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [proposals, total] = await Promise.all([
    Proposal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'fullName email')
      .populate('coInvestigators', 'fullName email')
      .select('-forms')
      .lean(),
    Proposal.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      proposals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @route   POST /api/proposals
 * @desc    Create a new proposal (starts as version 0.1 draft)
 * @access  Private
 */
export const createProposal = asyncHandler(async (req, res) => {
  const {
    title,
    fundingMethod,
    principalAgency,
    subAgencies,
    projectLeader,
    projectCoordinator,
    durationMonths,
    outlayLakhs,
    forms,
    formi // Accept both forms and formi from frontend
  } = req.body;

  // Generate unique proposal code
  const proposalCode = await proposalIdGenerator.generateProposalCode();

  // Process embedded images if any - accept either formi or forms
  const formContent = formi || forms;
  const processedForms = formContent ? await processFormImages(formContent, proposalCode) : null;

  // Create proposal with version 0.1 (initial draft)
  const proposal = await Proposal.create({
    proposalCode,
    title,
    fundingMethod,
    principalAgency,
    subAgencies: subAgencies || [],
    projectLeader,
    projectCoordinator,
    durationMonths,
    outlayLakhs,
    forms: processedForms,
    status: 'DRAFT',
    currentVersion: 0.1, // Initial draft version
    createdBy: req.user._id,
    collaborators: [{
      userId: req.user._id,
      role: 'PI',
      addedAt: new Date()
    }]
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_CREATED',
    proposalId: proposal._id,
    details: { proposalCode: proposal.proposalCode, version: 0.1 },
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Proposal created successfully',
    data: proposal
  });
});

/**
 * @route   GET /api/proposals/:proposalId
 * @desc    Get proposal by ID or proposalCode
 * @access  Private
 */
export const getProposalById = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  // Check if proposalId is a valid MongoDB ObjectId or a proposalCode
  let proposal;
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    // It's a valid ObjectId
    proposal = await Proposal.findById(proposalId)
      .populate('createdBy', 'fullName email designation organisationName')
      .populate('coInvestigators', 'fullName email designation organisationName')
      .populate('collaborators.userId', 'fullName email roles')
      .populate('assignedReviewers.reviewer', 'fullName email expertiseDomains')
      .populate('assignedReviewers.assignedBy', 'fullName email')
      .populate('timeline.changedBy', 'fullName email');
  } else {
    // It's a proposalCode (e.g., PROP-2025-0007)
    proposal = await Proposal.findOne({ proposalCode: proposalId })
      .populate('createdBy', 'fullName email designation organisationName')
      .populate('coInvestigators', 'fullName email designation organisationName')
      .populate('collaborators.userId', 'fullName email roles')
      .populate('assignedReviewers.reviewer', 'fullName email expertiseDomains')
      .populate('assignedReviewers.assignedBy', 'fullName email')
      .populate('timeline.changedBy', 'fullName email');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
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
 * @route   PUT /api/proposals/:proposalId
 * @desc    Update proposal (auto-save or manual save)
 *          For DRAFT proposals (version 0.1): Updates directly on proposal
 *          For submitted proposals: Creates/updates a draft version (x.1)
 * @access  Private
 */
export const updateProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  // Find proposal by ObjectId or proposalCode
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

  // Check if user is PI or CI
  const isPI = proposal.createdBy.toString() === req.user._id.toString();
  const isCI = proposal.coInvestigators.some(ci => ci.toString() === req.user._id.toString());
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isCI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI and CI can update the proposal'
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

  // Update fields - accept both 'forms' and 'formi' from frontend
  const updateableFields = [
    'title', 'fundingMethod', 'principalAgency', 'subAgencies',
    'projectLeader', 'projectCoordinator', 'durationMonths', 'outlayLakhs', 'forms', 'formi', 'supportingDocs'
  ];

  // For DRAFT proposals (version 0.1, not yet submitted), update directly
  if (proposal.status === 'DRAFT') {
    for (const field of updateableFields) {
      if (req.body[field] !== undefined) {
        if (field === 'forms' || field === 'formi') {
          // Process embedded images - store in forms field
          proposal.forms = await processFormImages(req.body[field], proposal.proposalCode);
        } else {
          proposal[field] = req.body[field];
        }
      }
    }
    
    // Keep version at 0.1 for drafts
    proposal.currentVersion = 0.1;
    await proposal.save();

    // Log activity
    await activityLogger.log({
      user: req.user._id,
      action: 'PROPOSAL_UPDATED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        version: 0.1,
        updates: Object.keys(req.body)
      },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Draft updated successfully',
      data: proposal
    });
  }

  // For submitted proposals, save to draft version (x.1) instead
  // This prevents overwriting the current major version
  const currentMajorVersion = Math.floor(proposal.currentVersion);
  const draftVersion = currentMajorVersion + 0.1;
  
  const proposalInfo = {
    title: req.body.title ?? proposal.title,
    fundingMethod: req.body.fundingMethod ?? proposal.fundingMethod,
    principalAgency: req.body.principalAgency ?? proposal.principalAgency,
    subAgencies: req.body.subAgencies ?? proposal.subAgencies,
    projectLeader: req.body.projectLeader ?? proposal.projectLeader,
    projectCoordinator: req.body.projectCoordinator ?? proposal.projectCoordinator,
    durationMonths: req.body.durationMonths ?? proposal.durationMonths,
    outlayLakhs: req.body.outlayLakhs ?? proposal.outlayLakhs
  };

  let forms = proposal.forms;
  if (req.body.forms || req.body.formi) {
    const formContent = req.body.formi || req.body.forms;
    forms = await processFormImages(formContent, proposal.proposalCode);
  }

  const supportingDocs = req.body.supportingDocs ?? proposal.supportingDocs;

  // Get or create draft version (x.1)
  const { draft, created } = await ProposalVersion.getOrCreateDraft(
    proposal._id,
    req.user._id,
    { forms, proposalInfo, supportingDocs },
    currentMajorVersion
  );

  // If draft already exists, update it
  if (!created) {
    draft.forms = forms;
    draft.proposalInfo = proposalInfo;
    draft.supportingDocs = supportingDocs;
    draft.lastModifiedBy = req.user._id;
    await draft.save();
  }

  // Update proposal's current version to reflect draft
  proposal.currentVersion = draftVersion;
  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: created ? 'DRAFT_CREATED' : 'DRAFT_UPDATED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      draftVersion: draftVersion,
      updates: Object.keys(req.body)
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: created ? `Draft version ${draftVersion} created` : `Draft version ${draftVersion} updated`,
    data: {
      proposal: proposal,
      currentVersion: draftVersion,
      isDraft: true
    }
  });
});

/**
 * @route   DELETE /api/proposals/:proposalId
 * @desc    Delete proposal (only drafts) - Hard delete for drafts
 * @access  Private
 */
export const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await findProposal(req.params.proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Only PI or admin can delete
  const isPI = proposal.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');

  if (!isPI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI or admin can delete the proposal'
    });
  }

  // Can only delete drafts
  if (proposal.status !== 'DRAFT') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete submitted proposals. Only draft proposals can be deleted.'
    });
  }

  // Store proposal info for logging before deletion
  const proposalCode = proposal.proposalCode;
  const proposalId = proposal._id;

  // Hard delete - permanently remove from database
  // Delete any associated versions first
  await ProposalVersion.deleteMany({ proposalId: proposal._id });
  
  // Delete the proposal itself
  await Proposal.deleteOne({ _id: proposal._id });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_DELETED',
    proposalId: proposalId,
    details: { proposalCode: proposalCode, deletionType: 'permanent' },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Draft proposal deleted permanently'
  });
});

/**
 * @route   POST /api/proposals/:proposalId/submit
 * @desc    Submit proposal for review
 *          For DRAFT (0.1): Creates version 1 and submits
 *          For submitted proposals with draft (x.1): Promotes draft to new major version (x+1)
 * @access  Private (PI only)
 */
export const submitProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { commitMessage } = req.body;
  
  let proposal;
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    proposal = await Proposal.findById(proposalId).populate('createdBy', 'fullName email');
  } else {
    proposal = await Proposal.findOne({ proposalCode: proposalId }).populate('createdBy', 'fullName email');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Only PI can submit
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');
  
  if (!isPI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can submit the proposal'
    });
  }

  // Check if version is a draft (has decimal)
  const isDraftVersion = proposal.currentVersion % 1 !== 0;

  // Handle different submission scenarios
  if (proposal.status === 'DRAFT' && proposal.currentVersion === 0.1) {
    // Initial submission from create page - promote 0.1 to version 1
    return handleInitialSubmission(proposal, req, res);
  } else if (isDraftVersion) {
    // Has a draft version (x.1) - promote to next major version
    return handleDraftPromotion(proposal, commitMessage, req, res);
  } else {
    return res.status(400).json({
      success: false,
      message: 'No draft changes to submit. Make changes first to create a draft.'
    });
  }
});

/**
 * Handle initial submission of a DRAFT proposal (0.1 -> 1)
 */
const handleInitialSubmission = async (proposal, req, res) => {
  // Validate required proposal information fields
  const validationErrors = [];
  
  if (!proposal.title || proposal.title.trim() === '') {
    validationErrors.push('Project title is required');
  }
  if (!proposal.principalAgency || proposal.principalAgency.trim() === '') {
    validationErrors.push('Principal implementing agency is required');
  }
  if (!proposal.projectLeader || proposal.projectLeader.trim() === '') {
    validationErrors.push('Project leader is required');
  }
  if (!proposal.projectCoordinator || proposal.projectCoordinator.trim() === '') {
    validationErrors.push('Project coordinator is required');
  }
  if (!proposal.durationMonths || proposal.durationMonths < 1) {
    validationErrors.push('Project duration must be at least 1 month');
  }
  if (!proposal.outlayLakhs || proposal.outlayLakhs <= 0) {
    validationErrors.push('Project outlay is required');
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Please complete all required fields: ${validationErrors.join(', ')}`
    });
  }
  
  // Validate Form I is filled (forms should contain formi with content)
  if (!proposal.forms || !proposal.forms.formi || !proposal.forms.formi.content || proposal.forms.formi.content.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please complete Form I before submitting'
    });
  }

  // Update status to AI_VALIDATION_PENDING and set version to 1 (submitted)
  proposal.status = 'AI_VALIDATION_PENDING';
  proposal.currentVersion = 1;
  await proposal.save();

  // Create version 1 - Initial Submission
  const version = await ProposalVersion.create({
    proposalId: proposal._id,
    versionNumber: 1,
    versionLabel: 'v1',
    isDraft: false,
    commitMessage: 'Initial Submission',
    forms: proposal.forms,
    proposalInfo: {
      title: proposal.title,
      fundingMethod: proposal.fundingMethod,
      principalAgency: proposal.principalAgency,
      subAgencies: proposal.subAgencies,
      projectLeader: proposal.projectLeader,
      projectCoordinator: proposal.projectCoordinator,
      durationMonths: proposal.durationMonths,
      outlayLakhs: proposal.outlayLakhs
    },
    supportingDocs: proposal.supportingDocs,
    createdBy: req.user._id
  });

  // Trigger AI validation (async) - Call Python AI backend
  processAIValidation(proposal._id, version._id, req.user._id).catch(error => {
    console.error('[AI] Validation processing error:', error);
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_SUBMITTED',
    proposalId: proposal._id,
    details: { proposalCode: proposal.proposalCode, version: 1 },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Proposal submitted successfully. AI evaluation in progress.',
    data: {
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      version: 1
    }
  });
};

/**
 * Handle promotion of draft to new major version (x.1 -> x+1)
 * E.g., 1.1 -> 2, 2.1 -> 3
 */
const handleDraftPromotion = async (proposal, commitMessage, req, res) => {
  // Calculate the new major version
  const currentDraftVersion = proposal.currentVersion;
  const newMajorVersion = Math.floor(currentDraftVersion) + 1;

  // Get the draft version from ProposalVersion collection
  const draft = await ProposalVersion.getDraft(proposal._id);
  
  if (!draft) {
    // If no draft in ProposalVersion, create version from proposal data
    await ProposalVersion.create({
      proposalId: proposal._id,
      versionNumber: newMajorVersion,
      versionLabel: `v${newMajorVersion}`,
      isDraft: false,
      commitMessage: commitMessage || `Version ${newMajorVersion}`,
      forms: proposal.forms,
      proposalInfo: {
        title: proposal.title,
        fundingMethod: proposal.fundingMethod,
        principalAgency: proposal.principalAgency,
        subAgencies: proposal.subAgencies,
        projectLeader: proposal.projectLeader,
        projectCoordinator: proposal.projectCoordinator,
        durationMonths: proposal.durationMonths,
        outlayLakhs: proposal.outlayLakhs
      },
      supportingDocs: proposal.supportingDocs,
      createdBy: req.user._id
    });
  } else {
    // Promote the draft version
    await ProposalVersion.promoteDraftToMajor(
      proposal._id,
      commitMessage || `Version ${newMajorVersion}`,
      req.user._id
    );
  }

  // Update proposal with new current version (major version)
  proposal.currentVersion = newMajorVersion;
  await proposal.save();

  // Trigger AI evaluation for the new version (async - silent background process)
  console.log('[AI] Triggering evaluation for new version', newMajorVersion, 'of proposal', proposal.proposalCode);
  processAIEvaluation(proposal._id, req.user._id).catch(error => {
    console.error('[AI] Evaluation processing error for version', newMajorVersion, ':', error);
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'VERSION_SUBMITTED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      previousVersion: currentDraftVersion,
      newVersion: newMajorVersion,
      commitMessage: commitMessage || `Version ${newMajorVersion}`
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: `Version ${newMajorVersion} submitted successfully`,
    data: {
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      version: newMajorVersion,
      commitMessage: commitMessage || `Version ${newMajorVersion}`
    }
  });
};

/**
 * @route   GET /api/proposals/:proposalId/track
 * @desc    Get proposal timeline/tracking info
 * @access  Private
 */
export const getProposalTracking = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  let proposal;
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    proposal = await Proposal.findById(proposalId)
      .populate('timeline.changedBy', 'fullName email roles')
      .select('proposalCode title status currentVersion timeline createdAt updatedAt');
  } else {
    proposal = await Proposal.findOne({ proposalCode: proposalId })
      .populate('timeline.changedBy', 'fullName email roles')
      .select('proposalCode title status currentVersion timeline createdAt updatedAt');
  }

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this proposal'
    });
  }

  // Get version history
  const versions = await ProposalVersion.find({ proposalId: proposal._id })
    .select('versionNumber commitMessage createdAt createdBy aiReportUrl')
    .populate('createdBy', 'fullName email')
    .sort({ versionNumber: 1 });

  res.json({
    success: true,
    data: {
      proposal,
      versions,
      timeline: proposal.timeline
    }
  });
});

/**
 * @route   PATCH /api/proposals/:proposalId/info
 * @desc    Update proposal information (PI only)
 * @access  Private
 */
export const updateProposalInfo = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const {
    title,
    fundingMethod,
    principalAgency,
    subAgencies,
    projectLeader,
    projectCoordinator,
    durationMonths,
    outlayLakhs
  } = req.body;

  const proposal = await findProposal(proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check if user is PI
  const createdById = proposal.createdBy?._id || proposal.createdBy;
  if (createdById.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can update proposal information'
    });
  }

  // Update fields
  if (title !== undefined) proposal.title = title;
  if (fundingMethod !== undefined) proposal.fundingMethod = fundingMethod;
  if (principalAgency !== undefined) proposal.principalAgency = principalAgency;
  if (subAgencies !== undefined) proposal.subAgencies = subAgencies;
  if (projectLeader !== undefined) proposal.projectLeader = projectLeader;
  if (projectCoordinator !== undefined) proposal.projectCoordinator = projectCoordinator;
  if (durationMonths !== undefined) proposal.durationMonths = durationMonths;
  if (outlayLakhs !== undefined) proposal.outlayLakhs = outlayLakhs;

  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'UPDATE_PROPOSAL_INFO',
    proposalId: proposal._id,
    details: { proposalCode: proposal.proposalCode }
  });

  res.json({
    success: true,
    message: 'Proposal information updated successfully',
    data: proposal
  });
});

/**
 * @route   POST /api/proposals/:proposalCode/upload-formi
 * @desc    Upload Form I PDF, extract content using AI backend, and return Slate.js content
 * @access  Private
 */
export const uploadFormI = asyncHandler(async (req, res) => {
  const { proposalCode } = req.params;

  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Validate file type
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed for Form I'
    });
  }

  // Validate file size (20MB max)
  if (req.file.size > 20 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size must be less than 20MB'
    });
  }

  // Find proposal
  const proposal = await findProposal(proposalCode);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    // Step 0: Check if there's an existing Form I PDF and delete it
    const existingDoc = proposal.supportingDocs.find(
      doc => doc.formName === 'formIPdf'
    );

    if (existingDoc && existingDoc.s3Key) {
      console.log(`Deleting old Form I PDF: ${existingDoc.s3Key}`);
      const deleteResult = await storageService.deleteFile(
        storageService.buckets.proposalFiles,
        existingDoc.s3Key
      );
      
      if (deleteResult.success) {
        console.log('Old Form I PDF deleted successfully');
      } else {
        console.warn('Failed to delete old Form I PDF:', deleteResult.error);
        // Continue anyway - we'll replace the DB entry
      }
    }

    // Step 1: Upload PDF to S3 (Supabase Storage)
    console.log(`Uploading Form I PDF for proposal: ${proposalCode}`);
    const uploadResult = await storageService.uploadProposalFile(
      req.file,
      proposalCode,
      'formi-pdf'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload PDF to storage',
        error: uploadResult.error
      });
    }

    const fileUrl = uploadResult.url;
    const s3Key = uploadResult.path;

    // Step 2: Extract content using AI backend
    console.log('=== [EXTRACTION START] ===');
    console.log(`[EXTRACTION] Processing file: ${req.file.originalname}`);
    console.log(`[EXTRACTION] File size: ${req.file.size} bytes`);
    console.log(`[EXTRACTION] Proposal code: ${proposalCode}`);
    console.log(`[EXTRACTION] File URL: ${fileUrl}`);
    
    const extractionStartTime = Date.now();
    const extractionResult = await formExtractionService.extractFormI(
      fileUrl,
      req.file.originalname
    );
    const extractionDuration = Date.now() - extractionStartTime;
    
    console.log(`[EXTRACTION] Completed in ${extractionDuration}ms (${(extractionDuration/1000).toFixed(2)}s)`);
    console.log(`[EXTRACTION] Success: ${extractionResult.success}`);

    if (!extractionResult.success) {
      console.error('[EXTRACTION] Failed:', extractionResult.error);
      // Even if extraction fails, we keep the uploaded file
      return res.status(500).json({
        success: false,
        message: 'PDF uploaded but content extraction failed',
        error: extractionResult.error,
        uploadedFile: {
          name: req.file.originalname,
          url: fileUrl,
          s3Key: s3Key,
          size: req.file.size,
          uploadedAt: new Date().toISOString()
        }
      });
    }

    // Validate and log the extracted content structure
    console.log('[EXTRACTION] Validating extracted content...');
    console.log('[EXTRACTION] Content type:', typeof extractionResult.content);
    console.log('[EXTRACTION] Is Array:', Array.isArray(extractionResult.content));
    
    if (extractionResult.content) {
      if (Array.isArray(extractionResult.content)) {
        console.log('[EXTRACTION] Content is array with', extractionResult.content.length, 'items');
        console.log('[EXTRACTION] First item type:', extractionResult.content[0]?.type);
      } else if (typeof extractionResult.content === 'object') {
        console.log('[EXTRACTION] Content keys:', Object.keys(extractionResult.content));
        if (extractionResult.content.formi?.content) {
          console.log('[EXTRACTION] Has formi.content with', extractionResult.content.formi.content.length, 'items');
        }
      }
      // Log a preview of the content
      const contentPreview = JSON.stringify(extractionResult.content).substring(0, 300);
      console.log('[EXTRACTION] Content preview:', contentPreview, '...');
    } else {
      console.error('[EXTRACTION] WARNING: Content is null or undefined!');
    }
    
    console.log('=== [EXTRACTION END] ===');

    // Step 3: Save to proposal's supportingDocs
    const existingDocIndex = proposal.supportingDocs.findIndex(
      doc => doc.formName === 'formIPdf'
    );

    const docData = {
      formName: 'formIPdf',
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      s3Key: s3Key,
      fileSize: req.file.size,
      uploadedAt: new Date()
    };

    if (existingDocIndex !== -1) {
      // Replace existing Form I PDF
      proposal.supportingDocs[existingDocIndex] = docData;
    } else {
      // Add new Form I PDF
      proposal.supportingDocs.push(docData);
    }

    // Save without validating the entire document (only update supportingDocs)
    await proposal.save({ validateModifiedOnly: true });

    // Log activity
    await activityLogger.log({
      user: req.user._id,
      action: 'UPLOAD_FORMI',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        fileName: req.file.originalname
      }
    });

    // Step 4: Return success with extracted content
    res.json({
      success: true,
      message: 'Form I uploaded and content extracted successfully',
      data: {
        uploadedFile: {
          name: req.file.originalname,
          url: fileUrl,
          s3Key: s3Key,
          size: req.file.size,
          uploadedAt: docData.uploadedAt
        },
        extractedContent: extractionResult.content
      }
    });

  } catch (error) {
    console.error('Form I upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Form I upload',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/proposals/:proposalCode/formi
 * @desc    Delete Form I PDF from storage and database
 * @access  Private
 */
export const deleteFormI = asyncHandler(async (req, res) => {
  const { proposalCode } = req.params;

  // Find proposal
  const proposal = await findProposal(proposalCode);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    // Find the Form I PDF document
    const existingDoc = proposal.supportingDocs.find(
      doc => doc.formName === 'formIPdf'
    );

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Form I PDF not found'
      });
    }

    // Delete from S3 (Supabase Storage)
    if (existingDoc.s3Key) {
      console.log(`Deleting Form I PDF: ${existingDoc.s3Key}`);
      const deleteResult = await storageService.deleteFile(
        storageService.buckets.proposalFiles,
        existingDoc.s3Key
      );
      
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error);
        // Continue to remove from DB even if storage deletion fails
      }
    }

    // Remove from database
    proposal.supportingDocs = proposal.supportingDocs.filter(
      doc => doc.formName !== 'formIPdf'
    );

    // Save without validating the entire document
    await proposal.save({ validateModifiedOnly: true });

    // Log activity
    await activityLogger.log({
      user: req.user._id,
      action: 'PROPOSAL_UPDATED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        action: 'Deleted Form I PDF'
      }
    });

    res.json({
      success: true,
      message: 'Form I PDF deleted successfully'
    });

  } catch (error) {
    console.error('Form I delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Form I PDF',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/proposals/:proposalId/beacon-save
 * @desc    Save proposal data via sendBeacon (for page close scenarios)
 *          Saves directly to proposal.forms for DRAFT proposals
 * @access  Private (via query token)
 */
export const beaconSave = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  console.log('[BEACON SAVE] Received save request for proposal:', proposalId);
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  try {
    const { forms, formi, title, fundingMethod, principalAgency, projectLeader, projectCoordinator, durationMonths, outlayLakhs } = req.body;
    
    // Update forms if provided - accept both forms and formi
    const formContent = formi || forms;
    if (formContent) {
      proposal.forms = formContent;
      console.log('[BEACON SAVE] Updated forms');
    }
    
    // Update other fields if provided
    if (title) proposal.title = title;
    if (fundingMethod) proposal.fundingMethod = fundingMethod;
    if (principalAgency) proposal.principalAgency = principalAgency;
    if (projectLeader) proposal.projectLeader = projectLeader;
    if (projectCoordinator) proposal.projectCoordinator = projectCoordinator;
    if (durationMonths !== undefined) proposal.durationMonths = durationMonths;
    if (outlayLakhs !== undefined) proposal.outlayLakhs = outlayLakhs;
    
    await proposal.save({ validateModifiedOnly: true });
    
    console.log('[BEACON SAVE] Successfully saved proposal:', proposalId, 'version:', proposal.currentVersion);
    
    res.json({
      success: true,
      message: 'Proposal saved via beacon',
      version: proposal.currentVersion
    });
  } catch (error) {
    console.error('[BEACON SAVE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save proposal',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/proposals/:proposalId/discussions
 * @desc    Get inline discussions (comments and suggestions) for a proposal
 * @access  Private
 */
export const getInlineDiscussions = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formId = 'formi' } = req.query;
  
  console.log('[getInlineDiscussions] Called with:', { proposalId, formId });
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    console.log('[getInlineDiscussions] Proposal not found:', proposalId);
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    console.log('[getInlineDiscussions] Access denied for user:', req.user?._id);
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  const discussions = proposal.inlineDiscussions?.[formId] || {
    discussions: [],
    suggestions: []
  };
  
  console.log('[getInlineDiscussions] Returning', discussions.discussions?.length, 'discussions for', proposal.proposalCode, formId);
  
  res.json({
    success: true,
    data: discussions
  });
});

/**
 * @route   POST /api/proposals/:proposalId/discussions
 * @desc    Save inline discussions (comments and suggestions) for a proposal
 * @access  Private
 */
export const saveInlineDiscussions = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formId = 'formi', discussions, suggestions } = req.body;
  
  console.log('[saveInlineDiscussions] Called with:', { proposalId, formId, discussionsCount: discussions?.length, suggestionsCount: suggestions?.length });
  console.log('[saveInlineDiscussions] User:', req.user?._id, req.user?.roles);
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    console.log('[saveInlineDiscussions] Proposal not found:', proposalId);
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  console.log('[saveInlineDiscussions] Proposal found:', proposal.proposalCode, 'status:', proposal.status);
  
  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    console.log('[saveInlineDiscussions] Access denied for user:', req.user?._id);
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  console.log('[saveInlineDiscussions] Access granted, saving discussions...');
  
  // Initialize inlineDiscussions if it doesn't exist
  if (!proposal.inlineDiscussions) {
    proposal.inlineDiscussions = {};
  }
  
  // Save discussions for the specific form
  proposal.inlineDiscussions[formId] = {
    discussions: discussions || [],
    suggestions: suggestions || [],
    lastUpdatedBy: req.user._id,
    lastUpdatedAt: new Date()
  };
  
  // Mark as modified since it's a Mixed type
  proposal.markModified('inlineDiscussions');
  await proposal.save({ validateModifiedOnly: true });
  
  console.log('[saveInlineDiscussions] Discussions saved successfully for', proposal.proposalCode, formId);
  
  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'UPDATE_DISCUSSIONS',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      formId,
      discussionsCount: discussions?.length || 0,
      suggestionsCount: suggestions?.length || 0
    },
    ipAddress: req.ip
  });
  
  res.json({
    success: true,
    message: 'Discussions saved successfully',
    data: proposal.inlineDiscussions[formId]
  });
});

/**
 * @route   POST /api/proposals/:proposalId/discussions/comment
 * @desc    Add a single comment to a discussion
 * @access  Private
 */
export const addInlineComment = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formId = 'formi', discussionId, comment } = req.body;
  
  if (!discussionId || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Discussion ID and comment are required'
    });
  }
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Initialize inlineDiscussions if it doesn't exist
  if (!proposal.inlineDiscussions) {
    proposal.inlineDiscussions = {};
  }
  if (!proposal.inlineDiscussions[formId]) {
    proposal.inlineDiscussions[formId] = { discussions: [], suggestions: [] };
  }
  
  // Find the discussion
  const discussions = proposal.inlineDiscussions[formId].discussions || [];
  const discussionIndex = discussions.findIndex(d => d.id === discussionId);
  
  if (discussionIndex === -1) {
    // Create new discussion with this comment
    const newDiscussion = {
      id: discussionId,
      comments: [{
        id: `comment-${Date.now()}`,
        contentRich: comment.contentRich || [{ type: 'p', children: [{ text: comment.text || '' }] }],
        createdAt: new Date(),
        userId: req.user._id.toString(),
        isEdited: false
      }],
      createdAt: new Date(),
      isResolved: false,
      userId: req.user._id.toString()
    };
    discussions.push(newDiscussion);
  } else {
    // Add comment to existing discussion
    const newComment = {
      id: `comment-${Date.now()}`,
      contentRich: comment.contentRich || [{ type: 'p', children: [{ text: comment.text || '' }] }],
      createdAt: new Date(),
      discussionId: discussionId,
      userId: req.user._id.toString(),
      isEdited: false
    };
    discussions[discussionIndex].comments.push(newComment);
  }
  
  proposal.inlineDiscussions[formId].discussions = discussions;
  proposal.inlineDiscussions[formId].lastUpdatedBy = req.user._id;
  proposal.inlineDiscussions[formId].lastUpdatedAt = new Date();
  
  // Mark as modified since it's a Mixed type
  proposal.markModified('inlineDiscussions');
  await proposal.save({ validateModifiedOnly: true });
  
  res.json({
    success: true,
    message: 'Comment added successfully',
    data: proposal.inlineDiscussions[formId]
  });
});

/**
 * @route   POST /api/proposals/:proposalId/discussions/resolve
 * @desc    Resolve a discussion
 * @access  Private
 */
export const resolveDiscussion = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formId = 'formi', discussionId, isResolved = true } = req.body;
  
  if (!discussionId) {
    return res.status(400).json({
      success: false,
      message: 'Discussion ID is required'
    });
  }
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Check access
  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Find and update the discussion
  const discussions = proposal.inlineDiscussions?.[formId]?.discussions || [];
  const discussionIndex = discussions.findIndex(d => d.id === discussionId);
  
  if (discussionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Discussion not found'
    });
  }
  
  discussions[discussionIndex].isResolved = isResolved;
  discussions[discussionIndex].resolvedBy = req.user._id.toString();
  discussions[discussionIndex].resolvedAt = new Date();
  
  proposal.inlineDiscussions[formId].discussions = discussions;
  proposal.inlineDiscussions[formId].lastUpdatedBy = req.user._id;
  proposal.inlineDiscussions[formId].lastUpdatedAt = new Date();
  
  // Mark as modified since it's a Mixed type
  proposal.markModified('inlineDiscussions');
  await proposal.save({ validateModifiedOnly: true });
  
  res.json({
    success: true,
    message: isResolved ? 'Discussion resolved' : 'Discussion reopened',
    data: proposal.inlineDiscussions[formId]
  });
});

/**
 * @route   GET /api/proposals/assigned-to-me
 * @desc    Get proposals assigned to current user as expert reviewer
 * @access  Private (Expert Reviewers)
 */
export const getAssignedProposals = asyncHandler(async (req, res) => {
  const user = req.user;
  const { status, page = 1, limit = 50 } = req.query;

  // Check if user is an expert reviewer
  if (!user.roles.includes('EXPERT_REVIEWER')) {
    return res.status(403).json({
      success: false,
      message: 'Only expert reviewers can access this endpoint'
    });
  }

  // Find proposals where current user is assigned as reviewer
  // Only show proposals in CMPDI_EXPERT_REVIEW status
  // Once status moves to TSSRC or SSRC, expert should not see it in their dashboard
  const query = {
    isDeleted: false,
    'assignedReviewers.reviewer': user._id,
    status: 'CMPDI_EXPERT_REVIEW' // Only show proposals currently under expert review
  };

  // Filter by assignment status if provided
  if (status) {
    query['assignedReviewers'] = {
      $elemMatch: {
        reviewer: user._id,
        status: status
      }
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [proposals, total] = await Promise.all([
    Proposal.find(query)
      .sort({ 'assignedReviewers.assignedAt': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'fullName email')
      .populate('coInvestigators', 'fullName email')
      .populate('assignedReviewers.reviewer', 'fullName email')
      .populate('assignedReviewers.assignedBy', 'fullName email')
      .select('-forms -yjsState')
      .lean(),
    Proposal.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      proposals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @route   PATCH /api/proposals/:proposalId/review-status
 * @desc    Update expert reviewer's review status on a proposal
 * @access  Private (Expert Reviewers)
 */
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { status } = req.body;
  const user = req.user;

  // Validate status
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: PENDING, IN_PROGRESS, COMPLETED'
    });
  }

  // Check if user is an expert reviewer
  if (!user.roles.includes('EXPERT_REVIEWER')) {
    return res.status(403).json({
      success: false,
      message: 'Only expert reviewers can update review status'
    });
  }

  const proposal = await findProposal(proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Find the reviewer's assignment
  const assignmentIndex = proposal.assignedReviewers.findIndex(
    ar => ar.reviewer.toString() === user._id.toString()
  );

  if (assignmentIndex === -1) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to review this proposal'
    });
  }

  // Update the status
  proposal.assignedReviewers[assignmentIndex].status = status;
  
  if (status === 'COMPLETED') {
    proposal.assignedReviewers[assignmentIndex].completedAt = new Date();
  }

  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: user._id,
    action: 'REVIEW_STATUS_UPDATED',
    details: {
      proposalId: proposal._id,
      proposalCode: proposal.proposalCode,
      newStatus: status
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: `Review status updated to ${status}`,
    data: {
      proposalId: proposal._id,
      proposalCode: proposal.proposalCode,
      reviewStatus: status
    }
  });
});

/**
 * @route   GET /api/proposals/my-review-history
 * @desc    Get all proposals assigned to expert reviewer (for My Reviews section)
 *          Includes proposals at any status - for viewing completed reviews
 * @access  Private (Expert Reviewers)
 */
export const getExpertReviewHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 50 } = req.query;

  // Check if user is an expert reviewer
  if (!user.roles.includes('EXPERT_REVIEWER')) {
    return res.status(403).json({
      success: false,
      message: 'Only expert reviewers can access this endpoint'
    });
  }

  // Find ALL proposals where current user has been assigned as reviewer
  // No status filter - includes proposals at any stage
  const query = {
    isDeleted: false,
    'assignedReviewers.reviewer': user._id
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [proposals, total] = await Promise.all([
    Proposal.find(query)
      .sort({ 'assignedReviewers.assignedAt': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'fullName email')
      .populate('coInvestigators', 'fullName email')
      .populate('assignedReviewers.reviewer', 'fullName email')
      .populate('assignedReviewers.assignedBy', 'fullName email')
      .select('-forms -yjsState')
      .lean(),
    Proposal.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      proposals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Process AI Validation (Internal async function)
 * Called after proposal submission to validate Form I using Python AI backend
 * Status remains AI_VALIDATION_PENDING until validation completes
 */
async function processAIValidation(proposalId, versionId, userId) {
  try {
    console.log('[AI] Starting validation for proposal', proposalId);
    
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      console.error('[AI] Proposal', proposalId, 'not found');
      return;
    }

    await activityLogger.log({
      user: userId,
      action: 'AI_VALIDATION_STARTED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        version: proposal.currentVersion
      }
    });

    const validationResult = await aiValidationService.validateFormI(proposal);
    console.log('[AI] Validation completed for proposal', proposal.proposalCode);
    console.log('[AI] Validation result:', JSON.stringify(validationResult).substring(0, 200));
    console.log('[AI] Overall validation:', validationResult.validation_result?.overall_validation);

    // Store validation report in aiReports array
    if (!proposal.aiReports) {
      proposal.aiReports = [];
    }
    
    proposal.aiReports.push({
      version: proposal.currentVersion,
      reportType: 'validation',
      reportData: validationResult,
      generatedAt: new Date()
    });
    
    // Mark as modified for Mixed type
    proposal.markModified('aiReports');

    const overallValidation = validationResult.validation_result?.overall_validation;
    console.log('[AI] Storing report for version', proposal.currentVersion, 'with validation:', overallValidation);

    if (overallValidation === true) {
      proposal.status = 'CMPDI_REVIEW';
      proposal.collaborators = await updateCollaboratorsForStatus(proposal, 'CMPDI_REVIEW');
      await proposal.save();
      
      console.log('[AI] Validation passed for', proposal.proposalCode, '- moved to CMPDI_REVIEW');
      console.log('[AI] aiReports stored, count:', proposal.aiReports.length);
      console.log('[AUTO-ASSIGN] Added', proposal.collaborators.filter(c => c.role === 'CMPDI').length, 'CMPDI members as collaborators');

      processAIEvaluation(proposalId, userId).catch(error => {
        console.error('[AI] Evaluation processing error:', error);
      });

    } else {
      proposal.status = 'AI_VALIDATION_FAILED';
      await proposal.save();
      console.log('[AI] Validation failed for', proposal.proposalCode, '- moved to AI_VALIDATION_FAILED');
      console.log('[AI] aiReports stored, count:', proposal.aiReports.length);
    }

    await activityLogger.log({
      user: userId,
      action: 'AI_VALIDATION_COMPLETED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        validationPassed: overallValidation,
        version: proposal.currentVersion
      }
    });

  } catch (error) {
    console.error('[AI] Validation error:', error);
    
    try {
      const proposal = await Proposal.findById(proposalId);
      if (proposal) {
        proposal.status = 'AI_VALIDATION_FAILED';
        
        if (!proposal.aiReports) {
          proposal.aiReports = [];
        }
        
        proposal.aiReports.push({
          version: proposal.currentVersion,
          reportType: 'validation',
          reportData: {
            error: true,
            message: error.message || 'AI validation service error',
            timestamp: new Date()
          },
          generatedAt: new Date()
        });
        
        proposal.markModified('aiReports');
        await proposal.save();
        console.log('[AI] Error report stored in aiReports');
      }
    } catch (saveError) {
      console.error('[AI] Failed to update proposal status after validation error:', saveError);
    }
  }
}

/**
 * Process AI Evaluation (Internal async function)
 * Called after validation passes to perform full analysis using Python AI backend
 * This is for reviewers/committee members only and does NOT affect proposal status
 */
async function processAIEvaluation(proposalId, userId) {
  try {
    console.log('[AI] Starting evaluation for proposal', proposalId);
    
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      console.error('[AI] Proposal', proposalId, 'not found');
      return;
    }

    await activityLogger.log({
      user: userId,
      action: 'AI_EVALUATION_STARTED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        version: proposal.currentVersion
      }
    });

    const evaluationResult = await aiValidationService.evaluateFormI(proposal);
    console.log('[AI] Evaluation completed for proposal', proposal.proposalCode);

    if (!proposal.aiReports) {
      proposal.aiReports = [];
    }
    
    proposal.aiReports.push({
      version: proposal.currentVersion,
      reportType: 'evaluation',
      reportData: evaluationResult,
      generatedAt: new Date()
    });
    
    proposal.markModified('aiReports');
    await proposal.save();
    console.log('[AI] Evaluation report stored for', proposal.proposalCode, '- aiReports count:', proposal.aiReports.length);

    await activityLogger.log({
      user: userId,
      action: 'AI_EVALUATION_COMPLETED',
      proposalId: proposal._id,
      details: { 
        proposalCode: proposal.proposalCode,
        version: proposal.currentVersion
      }
    });

  } catch (error) {
    console.error('[AI] Evaluation error:', error);
    
    try {
      const proposal = await Proposal.findById(proposalId);
      if (proposal) {
        if (!proposal.aiReports) {
          proposal.aiReports = [];
        }
        
        proposal.aiReports.push({
          version: proposal.currentVersion,
          reportType: 'evaluation',
          reportData: {
            error: true,
            message: error.message || 'AI evaluation service error',
            timestamp: new Date()
          },
          generatedAt: new Date()
        });
        
        proposal.markModified('aiReports');
        await proposal.save();
        console.log('[AI] Evaluation error report stored');
      }
    } catch (saveError) {
      console.error('[AI] Failed to store evaluation error:', saveError);
    }
  }
}
