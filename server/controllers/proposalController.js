import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import proposalIdGenerator from '../utils/proposalIdGenerator.js';
import emailService from '../services/emailService.js';
import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';
import activityLogger from '../utils/activityLogger.js';
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
  
  // Handle populated reviewers
  const isReviewer = proposal.assignedReviewers?.some(rev => {
    const reviewerId = rev.reviewer?._id || rev.reviewer;
    return reviewerId.toString() === user._id.toString();
  });
  
  const isAdmin = user.roles?.includes('SUPER_ADMIN');
  const isCommittee = user.roles?.some(role => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role));

  return isPI || isCI || isCollaborator || isReviewer || isAdmin || isCommittee;
};

/**
 * Helper: Process embedded images in forms
 * Replaces base64 images with S3 URLs
 */
const processFormImages = async (forms, proposalCode) => {
  const processedForms = { ...forms };
  
  for (const formKey in processedForms) {
    if (processedForms[formKey] && Array.isArray(processedForms[formKey])) {
      // Process Plate.js content structure
      for (const node of processedForms[formKey]) {
        if (node.type === 'img' && node.url && node.url.startsWith('data:')) {
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
        }
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
    // CMPDI sees proposals in their review stages
    query.status = { $in: ['SUBMITTED', 'AI_EVALUATION', 'CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW'] };
  } else if (user.roles.includes('TSSRC_MEMBER')) {
    // TSSRC sees CMPDI approved proposals
    query.status = { $in: ['CMPDI_APPROVED', 'TSSRC_REVIEW'] };
  } else if (user.roles.includes('SSRC_MEMBER')) {
    // SSRC sees TSSRC approved proposals
    query.status = { $in: ['TSSRC_APPROVED', 'SSRC_REVIEW'] };
  } else if (user.roles.includes('EXPERT_REVIEWER')) {
    // Reviewers see assigned proposals
    query['assignedReviewers.reviewer'] = user._id;
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
 * @desc    Create a new proposal
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
    forms
  } = req.body;

  // Generate unique proposal code
  const proposalCode = await proposalIdGenerator.generateProposalCode();

  // Process embedded images if any
  const processedForms = forms ? await processFormImages(forms, proposalCode) : {};

  // Create proposal
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
    currentVersion: 0.1,
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
    details: { proposalCode: proposal.proposalCode },
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

  if (!isPI && !isCI) {
    return res.status(403).json({
      success: false,
      message: 'Only PI and CI can update the proposal'
    });
  }

  // Can only update DRAFT proposals
  if (proposal.status !== 'DRAFT' && !req.body.forms) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update proposal information after submission. Use version commit for content changes.'
    });
  }

  // Update fields
  const updateableFields = [
    'title', 'fundingMethod', 'principalAgency', 'subAgencies',
    'projectLeader', 'projectCoordinator', 'durationMonths', 'outlayLakhs', 'forms'
  ];

  for (const field of updateableFields) {
    if (req.body[field] !== undefined) {
      if (field === 'forms') {
        // Process embedded images
        proposal[field] = await processFormImages(req.body[field], proposal.proposalCode);
      } else {
        proposal[field] = req.body[field];
      }
    }
  }

  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_UPDATED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      updates: Object.keys(req.body)
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    data: proposal
  });
});

/**
 * @route   DELETE /api/proposals/:proposalId
 * @desc    Delete proposal (only drafts)
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
      message: 'Cannot delete submitted proposals'
    });
  }

  // Soft delete
  proposal.isDeleted = true;
  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_DELETED',
    proposalId: proposal._id,
    details: { proposalCode: proposal.proposalCode },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
});

/**
 * @route   POST /api/proposals/:proposalId/submit
 * @desc    Submit proposal for review
 * @access  Private (PI only)
 */
export const submitProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
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
  if (!isPI) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can submit the proposal'
    });
  }

  // Check if already submitted
  if (proposal.status !== 'DRAFT') {
    return res.status(400).json({
      success: false,
      message: 'Proposal has already been submitted'
    });
  }

  // Validate all forms are filled
  const requiredForms = ['formI', 'formIA', 'formIX', 'formX', 'formXI', 'formXII'];
  const missingForms = requiredForms.filter(form => !proposal.forms[form] || proposal.forms[form].length === 0);
  
  if (missingForms.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Please complete all forms. Missing: ${missingForms.join(', ')}`
    });
  }

  // Update status to AI_EVALUATION
  proposal.status = 'AI_EVALUATION';
  proposal.currentVersion = 1;
  await proposal.save();

  // Create version 1
  const version = await ProposalVersion.create({
    proposalId: proposal._id,
    versionNumber: 1,
    commitMessage: 'Initial submission',
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
    createdBy: req.user._id
  });

  // Trigger AI evaluation (async)
  aiService.evaluateProposal({
    proposalCode: proposal.proposalCode,
    title: proposal.title,
    forms: proposal.forms,
    ...proposal.toObject()
  }).then(async (aiResult) => {
    if (aiResult.success) {
      // Upload AI report to S3
      const uploadResult = await storageService.uploadAIReport(
        aiResult.aiReport,
        proposal.proposalCode,
        1
      );

      if (uploadResult.success) {
        // Update version with AI report URL
        version.aiReportUrl = uploadResult.url;
        await version.save();

        // Add to proposal's AI reports array
        proposal.aiReports.push({
          version: 1,
          reportUrl: uploadResult.url,
          generatedAt: new Date()
        });

        // Update status to CMPDI_REVIEW
        proposal.status = 'CMPDI_REVIEW';
        await proposal.save();

        // Send notification email to PI
        await emailService.sendProposalSubmittedEmail(
          proposal.createdBy.email,
          proposal.createdBy.fullName,
          proposal.proposalCode,
          proposal.title
        );
      }
    }
  }).catch(error => {
    console.error('AI evaluation error:', error);
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROPOSAL_SUBMITTED',
    proposalId: proposal._id,
    details: { proposalCode: proposal.proposalCode },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Proposal submitted successfully. AI evaluation in progress.',
    data: {
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      version: version.versionNumber
    }
  });
});

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
  await activityLogger.logActivity({
    userId: req.user._id,
    action: 'UPDATE_PROPOSAL_INFO',
    resourceType: 'PROPOSAL',
    resourceId: proposal._id,
    details: { proposalCode: proposal.proposalCode }
  });

  res.json({
    success: true,
    message: 'Proposal information updated successfully',
    data: proposal
  });
});
