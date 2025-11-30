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
 * @desc    Get all versions of a proposal (major versions only: 1, 2, 3, etc.)
 * @access  Private
 */
export const getVersions = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

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

  // Get all versions for this proposal (all are integers now)
  const versions = await ProposalVersion.find({ 
    proposalId: proposal._id
  })
    .sort({ versionNumber: -1 })
    .populate('createdBy', 'fullName email')
    .select('versionNumber commitMessage createdBy createdAt aiReportUrl');

  // Filter to only include valid integer versions (safety check)
  const majorVersions = versions.filter(v => 
    v.versionNumber !== null && 
    v.versionNumber !== undefined && 
    Number.isInteger(v.versionNumber) && 
    v.versionNumber >= 1
  );

  res.json({
    success: true,
    data: majorVersions,
    currentVersion: proposal.currentVersion
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

  // Validate and parse versionNumber
  const parsedVersionNumber = parseInt(versionNumber, 10);
  if (isNaN(parsedVersionNumber) || parsedVersionNumber < 1) {
    return res.status(400).json({
      success: false,
      message: 'Valid version number is required (must be a positive integer)'
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

  const version = await ProposalVersion.findOne({
    proposalId: proposal._id,
    versionNumber: parsedVersionNumber
  }).populate('createdBy', 'fullName email');

  if (!version) {
    return res.status(404).json({
      success: false,
      message: `Version ${parsedVersionNumber} not found`
    });
  }

  res.json({
    success: true,
    data: {
      versionNumber: version.versionNumber,
      commitMessage: version.commitMessage,
      forms: version.forms,
      proposalInfo: version.proposalInfo,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      aiReportUrl: version.aiReportUrl,
      // Include proposal metadata
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      isCurrentVersion: proposal.currentVersion === version.versionNumber
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/versions
 * @desc    Create a new major version (integer versions only: 2, 3, 4, etc.)
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

  // Proposal must be submitted (version >= 1) to create new versions
  if (proposal.currentVersion < 1) {
    return res.status(400).json({
      success: false,
      message: 'Proposal must be submitted first before creating new versions'
    });
  }

  // Get current highest version and increment by 1
  const newVersionNumber = proposal.currentVersion + 1;

  // Create new version
  const version = await ProposalVersion.create({
    proposalId: proposal._id,
    versionNumber: newVersionNumber,
    commitMessage: commitMessage || `Version ${newVersionNumber}`,
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

  // Update proposal current version
  proposal.currentVersion = newVersionNumber;
  await proposal.save();

  // Trigger AI evaluation for the new version
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
        newVersionNumber
      );

      if (uploadResult.success) {
        version.aiReportUrl = uploadResult.url;
        await version.save();

        proposal.aiReports.push({
          version: newVersionNumber,
          reportUrl: uploadResult.url,
          generatedAt: new Date()
        });
        await proposal.save();
      }
    }
  }).catch(error => {
    console.error('AI evaluation error:', error);
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'VERSION_CREATED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      versionNumber: newVersionNumber,
      commitMessage: version.commitMessage
    },
    ipAddress: req.ip
  });

  // Populate createdBy for response
  await version.populate('createdBy', 'fullName email');

  res.status(201).json({
    success: true,
    message: `Version ${newVersionNumber} created successfully`,
    data: {
      versionNumber: version.versionNumber,
      commitMessage: version.commitMessage,
      createdBy: version.createdBy,
      createdAt: version.createdAt
    }
  });
});
