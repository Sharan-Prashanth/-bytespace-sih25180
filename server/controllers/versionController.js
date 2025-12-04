import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Helper to find proposal by ObjectId or proposalCode
 */
const findProposal = async (proposalId) => {
  if (mongoose.Types.ObjectId.isValid(proposalId)) {
    return await Proposal.findById(proposalId);
  }
  return await Proposal.findOne({ proposalCode: proposalId });
};

/**
 * @route   GET /api/proposals/:proposalId/versions
 * @desc    Get all versions of a proposal (both major versions and drafts)
 * @access  Private
 */
export const getVersions = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { includeDraft = 'true' } = req.query;

  // Validate proposalId
  if (!proposalId) {
    return res.status(400).json({
      success: false,
      message: 'Proposal ID is required'
    });
  }

  // Find proposal by ObjectId or proposalCode
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Build query - get all versions or only major versions
  const query = { proposalId: proposal._id };
  if (includeDraft !== 'true') {
    // Only get integer versions (major versions)
    query.$expr = { $eq: [{ $mod: ['$versionNumber', 1] }, 0] };
  }

  // Get all versions for this proposal
  const versions = await ProposalVersion.find(query)
    .sort({ versionNumber: -1 }) // Latest first
    .populate('createdBy', 'fullName email')
    .populate('lastModifiedBy', 'fullName email')
    .select('versionNumber versionLabel isDraft commitMessage createdBy lastModifiedBy createdAt updatedAt aiReportUrl');

  // Check if current version is a draft (decimal)
  const isDraftVersion = proposal.currentVersion % 1 !== 0;

  res.json({
    success: true,
    data: versions,
    currentVersion: proposal.currentVersion,
    isDraft: isDraftVersion
  });
});

/**
 * @route   GET /api/proposals/:proposalId/versions/:versionNumber
 * @desc    Get specific version content for viewing (read-only)
 * @access  Private
 */
export const getVersionContent = asyncHandler(async (req, res) => {
  const { proposalId, versionNumber } = req.params;

  // Validate proposalId
  if (!proposalId) {
    return res.status(400).json({
      success: false,
      message: 'Proposal ID is required'
    });
  }

  // Validate and parse versionNumber (can be decimal like 1.1)
  const parsedVersionNumber = parseFloat(versionNumber);
  if (isNaN(parsedVersionNumber) || parsedVersionNumber < 0.1) {
    return res.status(400).json({
      success: false,
      message: 'Valid version number is required'
    });
  }

  // Find proposal by ObjectId or proposalCode
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Find the specific version
  const version = await ProposalVersion.findOne({
    proposalId: proposal._id,
    versionNumber: parsedVersionNumber
  }).populate('createdBy', 'fullName email')
    .populate('lastModifiedBy', 'fullName email');

  if (!version) {
    return res.status(404).json({
      success: false,
      message: `Version ${parsedVersionNumber} not found`
    });
  }

  // Check if this is a draft version (decimal)
  const isDraft = parsedVersionNumber % 1 !== 0;

  res.json({
    success: true,
    data: {
      versionNumber: version.versionNumber,
      versionLabel: version.versionLabel || `v${version.versionNumber}`,
      isDraft: isDraft,
      commitMessage: version.commitMessage,
      forms: version.forms,
      formi: version.forms, // Include formi for frontend compatibility
      proposalInfo: version.proposalInfo,
      supportingDocs: version.supportingDocs,
      createdBy: version.createdBy,
      lastModifiedBy: version.lastModifiedBy,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      aiReportUrl: version.aiReportUrl,
      // Include proposal metadata
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      isCurrentVersion: proposal.currentVersion === version.versionNumber
    }
  });
});

/**
 * @route   GET /api/proposals/:proposalId/draft
 * @desc    Get the current draft version for editing
 *          For DRAFT status (0.1): Returns proposal data directly
 *          For submitted proposals (x.1): Returns draft version from ProposalVersion
 * @access  Private (PI and CI only)
 */
export const getDraft = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  await proposal.populate('createdBy', 'fullName email');

  // Check permissions
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isCI = proposal.coInvestigators.some(ci => ci.toString() === req.user._id.toString());
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isCI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI, CI, or Admin can access draft versions'
    });
  }

  // Check if current version is a draft (decimal)
  const isDraftVersion = proposal.currentVersion % 1 !== 0;

  if (!isDraftVersion) {
    return res.json({
      success: true,
      data: null,
      message: 'No draft version exists',
      isDraft: false,
      currentVersion: proposal.currentVersion
    });
  }

  // For initial draft (0.1), return proposal data
  if (proposal.currentVersion === 0.1) {
    return res.json({
      success: true,
      data: {
        versionNumber: 0.1,
        versionLabel: 'v0.1',
        isDraft: true,
        forms: proposal.forms,
        formi: proposal.forms, // Include formi for frontend compatibility
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
        createdBy: proposal.createdBy
      },
      isDraft: true,
      currentVersion: 0.1
    });
  }

  // For collaborate drafts (x.1), get from ProposalVersion
  const draft = await ProposalVersion.getDraft(proposal._id);

  if (!draft) {
    return res.json({
      success: true,
      data: null,
      message: 'No draft version found',
      isDraft: false,
      currentVersion: proposal.currentVersion
    });
  }

  await draft.populate('createdBy', 'fullName email');
  await draft.populate('lastModifiedBy', 'fullName email');

  res.json({
    success: true,
    data: draft,
    isDraft: true,
    currentVersion: proposal.currentVersion
  });
});

/**
 * @route   POST /api/proposals/:proposalId/draft
 * @desc    Create or update draft version (saves working changes)
 *          For DRAFT status: Saves directly to proposal (version 0.1)
 *          For submitted proposals: Creates/updates version x.1 in ProposalVersion
 * @access  Private (PI and CI only)
 */
export const saveAsDraft = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { forms, formi, proposalInfo, supportingDocs } = req.body;
  
  // Accept either formi or forms from frontend
  const formContent = formi || forms;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  await proposal.populate('createdBy', 'fullName email');

  // Check permissions
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isCI = proposal.coInvestigators.some(ci => ci.toString() === req.user._id.toString());
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isCI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI, CI, or Admin can save draft versions'
    });
  }

  // Check if proposal can be edited (not in final rejected state)
  const finalStates = ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'];
  if (finalStates.includes(proposal.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot edit a rejected proposal'
    });
  }

  // For DRAFT proposals (version 0.1), save directly to proposal
  if (proposal.status === 'DRAFT') {
    if (formContent) proposal.forms = formContent;
    if (proposalInfo) {
      if (proposalInfo.title) proposal.title = proposalInfo.title;
      if (proposalInfo.fundingMethod) proposal.fundingMethod = proposalInfo.fundingMethod;
      if (proposalInfo.principalAgency) proposal.principalAgency = proposalInfo.principalAgency;
      if (proposalInfo.subAgencies) proposal.subAgencies = proposalInfo.subAgencies;
      if (proposalInfo.projectLeader) proposal.projectLeader = proposalInfo.projectLeader;
      if (proposalInfo.projectCoordinator) proposal.projectCoordinator = proposalInfo.projectCoordinator;
      if (proposalInfo.durationMonths) proposal.durationMonths = proposalInfo.durationMonths;
      if (proposalInfo.outlayLakhs) proposal.outlayLakhs = proposalInfo.outlayLakhs;
    }
    if (supportingDocs) proposal.supportingDocs = supportingDocs;
    
    proposal.currentVersion = 0.1;
    await proposal.save();

    // Log activity
    await activityLogger.log({
      user: req.user._id,
      action: 'DRAFT_UPDATED',
      proposalId: proposal._id,
      details: {
        proposalCode: proposal.proposalCode,
        version: 0.1
      },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Draft updated successfully',
      data: {
        currentVersion: 0.1,
        updatedAt: proposal.updatedAt
      }
    });
  }

  // For submitted proposals, create/update draft version (x.1)
  const currentMajorVersion = Math.floor(proposal.currentVersion);
  const draftVersionNumber = currentMajorVersion + 0.1;

  // Get or create draft
  const { draft, created } = await ProposalVersion.getOrCreateDraft(
    proposal._id,
    req.user._id,
    {
      forms: formContent || proposal.forms,
      proposalInfo: proposalInfo || {
        title: proposal.title,
        fundingMethod: proposal.fundingMethod,
        principalAgency: proposal.principalAgency,
        subAgencies: proposal.subAgencies,
        projectLeader: proposal.projectLeader,
        projectCoordinator: proposal.projectCoordinator,
        durationMonths: proposal.durationMonths,
        outlayLakhs: proposal.outlayLakhs
      },
      supportingDocs: supportingDocs || proposal.supportingDocs
    },
    currentMajorVersion
  );

  // If draft already exists, update it with new data
  if (!created) {
    if (formContent) draft.forms = formContent;
    if (proposalInfo) draft.proposalInfo = proposalInfo;
    if (supportingDocs) draft.supportingDocs = supportingDocs;
    draft.lastModifiedBy = req.user._id;
    await draft.save();
  }

  // Update proposal's current version to draft version
  proposal.currentVersion = draftVersionNumber;
  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: created ? 'DRAFT_CREATED' : 'DRAFT_UPDATED',
    proposalId: proposal._id,
    details: {
      proposalCode: proposal.proposalCode,
      draftVersion: draftVersionNumber
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: created ? `Draft version ${draftVersionNumber} created` : `Draft version ${draftVersionNumber} updated`,
    data: {
      currentVersion: draftVersionNumber,
      updatedAt: draft.updatedAt
    }
  });
});

/**
 * @route   DELETE /api/proposals/:proposalId/draft
 * @desc    Discard the current draft version (x.1) and revert to major version
 * @access  Private (PI only)
 */
export const discardDraft = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  await proposal.populate('createdBy', 'fullName email');

  // Only PI or Admin can discard draft
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');

  if (!isPI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only PI or Admin can discard draft versions'
    });
  }

  // Check if current version is a draft (decimal)
  const isDraftVersion = proposal.currentVersion % 1 !== 0;

  if (!isDraftVersion) {
    return res.status(400).json({
      success: false,
      message: 'No draft version to discard'
    });
  }

  // Can't discard initial draft (0.1) - that would delete the proposal
  if (proposal.currentVersion === 0.1) {
    return res.status(400).json({
      success: false,
      message: 'Cannot discard initial draft. Use delete proposal instead.'
    });
  }

  // Delete the draft version from ProposalVersion
  const result = await ProposalVersion.deleteOne({
    proposalId: proposal._id,
    versionNumber: proposal.currentVersion
  });

  // Revert to major version
  const majorVersion = Math.floor(proposal.currentVersion);
  proposal.currentVersion = majorVersion;
  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'DRAFT_DISCARDED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      discardedVersion: proposal.currentVersion + 0.1,
      revertedTo: majorVersion
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Draft discarded successfully',
    data: {
      currentVersion: majorVersion
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/versions
 * @desc    Create a new major version by promoting the draft (x.1 -> x+1)
 * @access  Private (PI and CI only)
 */
export const createVersion = asyncHandler(async (req, res) => {
  const { commitMessage } = req.body;

  const proposal = await findProposal(req.params.proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Populate createdBy after finding
  await proposal.populate('createdBy', 'fullName email');

  // Check permissions - only PI and CI can create new versions
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isCI = proposal.coInvestigators.some(ci => ci.toString() === req.user._id.toString());
  const isAdmin = req.user.roles?.includes('SUPER_ADMIN');
  
  if (!isPI && !isCI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator and Co-Investigators can create new versions'
    });
  }

  // Check if current version is a draft (decimal)
  const isDraftVersion = proposal.currentVersion % 1 !== 0;

  if (!isDraftVersion) {
    return res.status(400).json({
      success: false,
      message: 'No draft version found. Make changes first to create a draft.'
    });
  }

  // Calculate new major version
  const newMajorVersion = Math.floor(proposal.currentVersion) + 1;

  // Check if there's a draft in ProposalVersion (for collaborate drafts)
  const draft = await ProposalVersion.getDraft(proposal._id);

  let newVersion;
  if (draft) {
    // Promote the draft version
    newVersion = await ProposalVersion.promoteDraftToMajor(
      proposal._id,
      commitMessage || `Version ${newMajorVersion}`,
      req.user._id
    );
  } else {
    // Create from proposal data (for initial draft 0.1)
    newVersion = await ProposalVersion.create({
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
  }

  // Update proposal with new current version (major version)
  proposal.currentVersion = newMajorVersion;
  await proposal.save();

  // Trigger AI evaluation for the new version (async)
  aiService.evaluateProposal({
    proposalCode: proposal.proposalCode,
    title: proposal.title,
    forms: proposal.forms,
    ...proposal.toObject()
  }).then(async (aiResult) => {
    if (aiResult.success) {
      const uploadResult = await storageService.uploadAIReport(
        aiResult.aiReport,
        proposal.proposalCode,
        newMajorVersion
      );

      if (uploadResult.success) {
        newVersion.aiReportUrl = uploadResult.url;
        await newVersion.save();

        proposal.aiReports.push({
          version: newMajorVersion,
          reportUrl: uploadResult.url,
          generatedAt: new Date()
        });
        await proposal.save();
      }
    }
  }).catch(error => {
    console.error('[AI] Evaluation error:', error);
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'VERSION_CREATED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      versionNumber: newMajorVersion,
      commitMessage: newVersion.commitMessage
    },
    ipAddress: req.ip
  });

  // Populate createdBy for response
  await newVersion.populate('createdBy', 'fullName email');

  res.status(201).json({
    success: true,
    message: `Version ${newMajorVersion} created successfully`,
    data: {
      versionNumber: newVersion.versionNumber,
      commitMessage: newVersion.commitMessage,
      createdBy: newVersion.createdBy,
      createdAt: newVersion.createdAt
    }
  });
});
