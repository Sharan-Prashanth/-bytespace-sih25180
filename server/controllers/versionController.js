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
 * @desc    Get all versions of a proposal
 * @access  Private
 */
export const getVersions = asyncHandler(async (req, res) => {
  // Find proposal by ObjectId or proposalCode
  const proposal = await findProposal(req.params.proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const versions = await ProposalVersion.find({ proposalId: proposal._id })
    .sort({ versionNumber: -1 })
    .populate('createdBy', 'fullName email')
    .select('-forms'); // Exclude full form content for list view

  res.json({
    success: true,
    data: versions
  });
});

/**
 * @route   GET /api/proposals/:proposalId/versions/:versionNumber
 * @desc    Get specific version content
 * @access  Private
 */
export const getVersionContent = asyncHandler(async (req, res) => {
  const { proposalId, versionNumber } = req.params;

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
    versionNumber: parseFloat(versionNumber)
  }).populate('createdBy', 'fullName email');

  if (!version) {
    return res.status(404).json({
      success: false,
      message: 'Version not found'
    });
  }

  res.json({
    success: true,
    data: version
  });
});

/**
 * @route   POST /api/proposals/:proposalId/versions
 * @desc    Create a new version (major or minor)
 * @access  Private (PI/CI for auto-save, PI only for major version)
 */
export const createVersion = asyncHandler(async (req, res) => {
  const { commitMessage, isAutoSave = false } = req.body;

  const proposal = await findProposal(req.params.proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Populate createdBy after finding
  await proposal.populate('createdBy', 'fullName email');

  // Check permissions
  const isPI = proposal.createdBy._id.toString() === req.user._id.toString();
  const isCI = proposal.coInvestigators.some(ci => ci.toString() === req.user._id.toString());
  
  // For major versions (commits), only PI can create
  if (!isAutoSave && !isPI) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can create new versions'
    });
  }
  
  // For auto-save, both PI and CI can save
  if (isAutoSave && !isPI && !isCI) {
    return res.status(403).json({
      success: false,
      message: 'Only PI and CI can save changes'
    });
  }

  // Get current highest version
  const latestVersion = await ProposalVersion.findOne({ proposalId: proposal._id })
    .sort({ versionNumber: -1 });

  let newVersionNumber;
  
  if (isAutoSave) {
    // Create or update minor version (x.1)
    const baseVersion = latestVersion ? Math.floor(latestVersion.versionNumber) : 0;
    newVersionNumber = baseVersion + 0.1;
    
    // Delete existing x.1 version if it exists
    await ProposalVersion.deleteOne({ 
      proposalId: proposal._id, 
      versionNumber: newVersionNumber 
    });
  } else {
    // Create major version (x+1)
    newVersionNumber = latestVersion 
      ? Math.floor(latestVersion.versionNumber) + 1
      : 1;
  }

  // Create new version
  const version = await ProposalVersion.create({
    proposalId: proposal._id,
    versionNumber: newVersionNumber,
    commitMessage: isAutoSave 
      ? `Auto-save at ${new Date().toLocaleString()}` 
      : (commitMessage || `Version ${newVersionNumber}`),
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

  // Update proposal current version (only for major versions)
  if (!isAutoSave) {
    proposal.currentVersion = newVersionNumber;
    await proposal.save();
  }

  // Trigger AI evaluation only for major versions (not auto-save)
  if (!isAutoSave) {
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
  }

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'VERSION_CREATED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      versionNumber: newVersionNumber,
      isAutoSave
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: isAutoSave ? 'Auto-save successful' : 'New version created successfully',
    data: version
  });
});

/**
 * @route   PUT /api/proposals/:proposalId/versions/:versionNumber/revert
 * @desc    Revert to an old version
 * @access  Private (PI only)
 */
export const revertToVersion = asyncHandler(async (req, res) => {
  const { proposalId, versionNumber } = req.params;

  const proposal = await findProposal(proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Only PI can revert
  const isPI = proposal.createdBy.toString() === req.user._id.toString();
  if (!isPI) {
    return res.status(403).json({
      success: false,
      message: 'Only Principal Investigator can revert versions'
    });
  }

  // Get the version to revert to
  const versionToRevert = await ProposalVersion.findOne({
    proposalId: proposal._id,
    versionNumber: parseFloat(versionNumber)
  });

  if (!versionToRevert) {
    return res.status(404).json({
      success: false,
      message: 'Version not found'
    });
  }

  // Update proposal with old version content
  proposal.forms = versionToRevert.forms;
  proposal.title = versionToRevert.proposalInfo.title;
  proposal.fundingMethod = versionToRevert.proposalInfo.fundingMethod;
  proposal.principalAgency = versionToRevert.proposalInfo.principalAgency;
  proposal.subAgencies = versionToRevert.proposalInfo.subAgencies;
  proposal.projectLeader = versionToRevert.proposalInfo.projectLeader;
  proposal.projectCoordinator = versionToRevert.proposalInfo.projectCoordinator;
  proposal.durationMonths = versionToRevert.proposalInfo.durationMonths;
  proposal.outlayLakhs = versionToRevert.proposalInfo.outlayLakhs;
  await proposal.save();

  // Create a new version with revert message
  const latestVersion = await ProposalVersion.findOne({ proposalId })
    .sort({ versionNumber: -1 });

  const newVersionNumber = Math.floor(latestVersion.versionNumber) + 1;

  await ProposalVersion.create({
    proposalId: proposal._id,
    versionNumber: newVersionNumber,
    commitMessage: `Reverted to version ${versionNumber}`,
    forms: proposal.forms,
    proposalInfo: versionToRevert.proposalInfo,
    createdBy: req.user._id
  });

  proposal.currentVersion = newVersionNumber;
  await proposal.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'VERSION_REVERTED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      revertedTo: versionNumber,
      newVersion: newVersionNumber
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: `Successfully reverted to version ${versionNumber}`,
    data: {
      currentVersion: newVersionNumber
    }
  });
});
