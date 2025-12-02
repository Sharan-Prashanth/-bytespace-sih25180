import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import emailService from '../services/emailService.js';
import activityLogger from '../utils/activityLogger.js';
import { updateCollaboratorsForStatus, updateAssignedReviewersForExpertReview } from '../utils/roleBasedAssignment.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   PUT /api/proposals/:proposalId/status
 * @desc    Update proposal status (approve/reject at each stage)
 * @access  Private (Committee only)
 */
export const updateProposalStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const proposal = await Proposal.findById(req.params.proposalId).populate('createdBy', 'fullName email');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const oldStatus = proposal.status;

  // Validate status transitions based on user role
  const isCMPDI = req.user.roles.includes('CMPDI_MEMBER');
  const isTSSRC = req.user.roles.includes('TSSRC_MEMBER');
  const isSSRC = req.user.roles.includes('SSRC_MEMBER');
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');

  // Status transition validation
  if (isCMPDI) {
    const validStatuses = ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'CMPDI_EXPERT_REVIEW', 'TSSRC_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for CMPDI member'
      });
    }
  } else if (isTSSRC) {
    const validStatuses = ['TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for TSSRC member'
      });
    }
  } else if (isSSRC) {
    const validStatuses = ['SSRC_ACCEPTED', 'SSRC_REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for SSRC member'
      });
    }
  } else if (isAdmin) {
    // Admin can set any status
  } else {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to change proposal status'
    });
  }

  // Update status
  proposal.status = status;
  proposal.timeline.push({
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    notes: notes || ''
  });

  // Auto-assign collaborators based on new status
  proposal.collaborators = await updateCollaboratorsForStatus(proposal, status);
  
  // If moving to expert review, auto-assign all expert reviewers
  if (status === 'CMPDI_EXPERT_REVIEW') {
    proposal.assignedReviewers = await updateAssignedReviewersForExpertReview(proposal, req.user._id);
    console.log(`[AUTO-ASSIGN] Added ${proposal.assignedReviewers.length} expert reviewers`);
  }

  await proposal.save();

  // Log collaborator counts
  const collaboratorCounts = {
    PI: proposal.collaborators.filter(c => c.role === 'PI').length,
    CI: proposal.collaborators.filter(c => c.role === 'CI').length,
    CMPDI: proposal.collaborators.filter(c => c.role === 'CMPDI').length,
    REVIEWER: proposal.collaborators.filter(c => c.role === 'REVIEWER').length,
    TSSRC: proposal.collaborators.filter(c => c.role === 'TSSRC').length,
    SSRC: proposal.collaborators.filter(c => c.role === 'SSRC').length
  };
  console.log(`[AUTO-ASSIGN] Collaborators for ${proposal.proposalCode}:`, collaboratorCounts);

  // Send notification email
  await emailService.sendStatusChangeEmail(
    proposal.createdBy.email,
    proposal.createdBy.fullName,
    proposal.proposalCode,
    oldStatus,
    status
  );

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: status.includes('ACCEPTED') ? 'PROPOSAL_APPROVED' : (status.includes('REJECTED') ? 'PROPOSAL_REJECTED' : 'STATUS_UPDATED'),
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      oldStatus,
      newStatus: status
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: `Proposal status updated to ${status}`,
    data: {
      proposalCode: proposal.proposalCode,
      status: proposal.status
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/assign-reviewer
 * @desc    Assign expert reviewer to a proposal
 * @access  Private (CMPDI/Admin)
 */
export const assignReviewer = asyncHandler(async (req, res) => {
  const { reviewerId, dueDate } = req.body;

  const proposal = await Proposal.findById(req.params.proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const reviewer = await User.findById(reviewerId);

  if (!reviewer) {
    return res.status(404).json({
      success: false,
      message: 'Reviewer not found'
    });
  }

  // Check if reviewer has EXPERT_REVIEWER role
  if (!reviewer.roles.includes('EXPERT_REVIEWER')) {
    return res.status(400).json({
      success: false,
      message: 'User is not an expert reviewer'
    });
  }

  // Check if already assigned
  const alreadyAssigned = proposal.assignedReviewers.some(
    ar => ar.reviewer.toString() === reviewerId
  );

  if (alreadyAssigned) {
    return res.status(400).json({
      success: false,
      message: 'Reviewer is already assigned to this proposal'
    });
  }

  // Add reviewer
  proposal.assignedReviewers.push({
    reviewer: reviewerId,
    assignedBy: req.user._id,
    assignedAt: new Date(),
    dueDate: dueDate ? new Date(dueDate) : null,
    status: 'PENDING'
  });

  // Add as collaborator
  proposal.collaborators.push({
    userId: reviewerId,
    role: 'REVIEWER',
    addedAt: new Date()
  });

  await proposal.save();

  // Send notification email
  await emailService.sendReviewerAssignmentEmail(
    reviewer.email,
    reviewer.fullName,
    proposal.proposalCode,
    proposal.title,
    dueDate
  );

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'REVIEWER_ASSIGNED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      reviewerId,
      reviewerName: reviewer.fullName
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Reviewer assigned successfully',
    data: {
      reviewer: {
        id: reviewer._id,
        fullName: reviewer.fullName,
        email: reviewer.email,
        expertiseDomains: reviewer.expertiseDomains
      }
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/request-clarification
 * @desc    Request clarification from PI
 * @access  Private (Committee/Reviewer)
 */
export const requestClarification = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const proposal = await Proposal.findById(req.params.proposalId).populate('createdBy', 'fullName email');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Create a comment with type CLARIFICATION
  const comment = await Comment.create({
    proposalId: proposal._id,
    author: req.user._id,
    content,
    type: 'CLARIFICATION'
  });

  await comment.populate('author', 'fullName email roles');

  // Send email to PI
  await emailService.sendClarificationRequestEmail(
    proposal.createdBy.email,
    proposal.createdBy.fullName,
    proposal.proposalCode,
    req.user.fullName,
    content
  );

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'CLARIFICATION_REQUESTED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Clarification request sent successfully',
    data: comment
  });
});

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics based on user role
 * @access  Private
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const user = req.user;

  let stats = {};

  if (user.roles.includes('SUPER_ADMIN')) {
    // Admin dashboard stats
    const [
      totalUsers,
      totalProposals,
      draftProposals,
      submittedProposals,
      approvedProposals,
      rejectedProposals,
      ongoingProposals
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Proposal.countDocuments({ isDeleted: false }),
      Proposal.countDocuments({ status: 'DRAFT', isDeleted: false }),
      Proposal.countDocuments({ status: { $in: ['SUBMITTED', 'AI_EVALUATION'] }, isDeleted: false }),
      Proposal.countDocuments({ status: { $regex: 'APPROVED' }, isDeleted: false }),
      Proposal.countDocuments({ status: { $regex: 'REJECTED' }, isDeleted: false }),
      Proposal.countDocuments({ status: 'ONGOING', isDeleted: false })
    ]);

    stats = {
      totalUsers,
      totalProposals,
      draftProposals,
      submittedProposals,
      approvedProposals,
      rejectedProposals,
      ongoingProposals
    };
  } else if (user.roles.includes('CMPDI_MEMBER')) {
    // CMPDI dashboard stats
    const [
      pendingReview,
      expertReview,
      approved,
      rejected
    ] = await Promise.all([
      Proposal.countDocuments({ status: 'CMPDI_REVIEW', isDeleted: false }),
      Proposal.countDocuments({ status: 'CMPDI_EXPERT_REVIEW', isDeleted: false }),
      Proposal.countDocuments({ status: 'CMPDI_APPROVED', isDeleted: false }),
      Proposal.countDocuments({ status: 'CMPDI_REJECTED', isDeleted: false })
    ]);

    stats = { pendingReview, expertReview, approved, rejected };
  } else if (user.roles.includes('TSSRC_MEMBER')) {
    // TSSRC dashboard stats
    const [
      pendingReview,
      approved,
      rejected
    ] = await Promise.all([
      Proposal.countDocuments({ status: 'TSSRC_REVIEW', isDeleted: false }),
      Proposal.countDocuments({ status: 'TSSRC_APPROVED', isDeleted: false }),
      Proposal.countDocuments({ status: 'TSSRC_REJECTED', isDeleted: false })
    ]);

    stats = { pendingReview, approved, rejected };
  } else if (user.roles.includes('SSRC_MEMBER')) {
    // SSRC dashboard stats
    const [
      pendingReview,
      approved,
      rejected
    ] = await Promise.all([
      Proposal.countDocuments({ status: 'SSRC_REVIEW', isDeleted: false }),
      Proposal.countDocuments({ status: { $in: ['SSRC_APPROVED', 'ACCEPTED', 'ONGOING'] }, isDeleted: false }),
      Proposal.countDocuments({ status: 'SSRC_REJECTED', isDeleted: false })
    ]);

    stats = { pendingReview, approved, rejected };
  } else if (user.roles.includes('EXPERT_REVIEWER')) {
    // Reviewer dashboard stats
    const [
      assignedProposals,
      pendingReviews,
      completedReviews
    ] = await Promise.all([
      Proposal.countDocuments({ 'assignedReviewers.reviewer': user._id, isDeleted: false }),
      Proposal.countDocuments({ 'assignedReviewers.reviewer': user._id, 'assignedReviewers.status': 'PENDING', isDeleted: false }),
      Proposal.countDocuments({ 'assignedReviewers.reviewer': user._id, 'assignedReviewers.status': 'COMPLETED', isDeleted: false })
    ]);

    stats = { assignedProposals, pendingReviews, completedReviews };
  } else {
    // Regular user stats
    const [
      myProposals,
      draftProposals,
      submittedProposals,
      approvedProposals
    ] = await Promise.all([
      Proposal.countDocuments({ 
        $or: [{ createdBy: user._id }, { coInvestigators: user._id }],
        isDeleted: false
      }),
      Proposal.countDocuments({ createdBy: user._id, status: 'DRAFT', isDeleted: false }),
      Proposal.countDocuments({ 
        createdBy: user._id,
        status: { $nin: ['DRAFT', 'ACCEPTED', 'ONGOING'] },
        isDeleted: false
      }),
      Proposal.countDocuments({ 
        createdBy: user._id,
        status: { $in: ['ACCEPTED', 'ONGOING'] },
        isDeleted: false
      })
    ]);

    stats = { myProposals, draftProposals, submittedProposals, approvedProposals };
  }

  res.json({
    success: true,
    data: stats
  });
});
