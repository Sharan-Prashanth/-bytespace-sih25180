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

  // Track if expert review was skipped during CMPDI stage
  // When CMPDI directly accepts or rejects without going to expert review
  if (isCMPDI && (status === 'CMPDI_ACCEPTED' || status === 'CMPDI_REJECTED')) {
    // Check if expert review was ever initiated (CMPDI_EXPERT_REVIEW status in timeline)
    const hadExpertReview = proposal.timeline.some(t => t.status === 'CMPDI_EXPERT_REVIEW');
    
    if (!hadExpertReview && proposal.expertReviewSkipped === null) {
      // Expert review was skipped - CMPDI made direct decision
      proposal.expertReviewSkipped = true;
    } else if (hadExpertReview) {
      // Expert review was conducted
      proposal.expertReviewSkipped = false;
    }
  }

  // Update status
  proposal.status = status;
  proposal.timeline.push({
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    notes: notes || ''
  });

  // Auto-transition: CMPDI_ACCEPTED -> TSSRC_REVIEW and TSSRC_ACCEPTED -> SSRC_REVIEW
  // This ensures the next committee can immediately review after acceptance
  if (status === 'CMPDI_ACCEPTED') {
    proposal.status = 'TSSRC_REVIEW';
    proposal.timeline.push({
      status: 'TSSRC_REVIEW',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: 'Auto-transitioned from CMPDI acceptance for TSSRC review'
    });
  } else if (status === 'TSSRC_ACCEPTED') {
    proposal.status = 'SSRC_REVIEW';
    proposal.timeline.push({
      status: 'SSRC_REVIEW',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: 'Auto-transitioned from TSSRC acceptance for SSRC final review'
    });
  }

  // Auto-assign collaborators based on new status (use final status after auto-transition)
  proposal.collaborators = await updateCollaboratorsForStatus(proposal, proposal.status);
  
  // Note: Expert reviewers are NOT auto-assigned when moving to CMPDI_EXPERT_REVIEW
  // CMPDI must explicitly select expert reviewers via the selectExpertReviewers endpoint

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

  // Send notification email (use final status after any auto-transition)
  try {
    await emailService.sendStatusUpdateEmail(
      proposal.createdBy.email,
      proposal.createdBy.fullName,
      {
        proposalCode: proposal.proposalCode,
        title: proposal.title,
        projectArea: proposal.projectArea,
        submittedDate: proposal.createdAt
      },
      oldStatus,
      proposal.status,
      notes || 'Status updated by committee'
    );
  } catch (emailError) {
    console.error('[EMAIL ERROR] Failed to send status update email:', emailError);
    // Don't fail the request if email fails
  }

  // Log activity (use the original decision status for logging)
  await activityLogger.log({
    user: req.user._id,
    action: status.includes('ACCEPTED') ? 'PROPOSAL_APPROVED' : (status.includes('REJECTED') ? 'PROPOSAL_REJECTED' : 'STATUS_UPDATED'),
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      oldStatus,
      decisionStatus: status,
      newStatus: proposal.status
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
 * @route   POST /api/proposals/:proposalId/select-expert-reviewers
 * @desc    CMPDI selects expert reviewers and sends for expert review
 * @access  Private (CMPDI only)
 */
export const selectExpertReviewers = asyncHandler(async (req, res) => {
  const { reviewerIds, dueDate, notes } = req.body;

  // Validate CMPDI member
  const isCMPDI = req.user.roles.includes('CMPDI_MEMBER');
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  
  if (!isCMPDI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only CMPDI members can select expert reviewers'
    });
  }

  if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one expert reviewer must be selected'
    });
  }
  
  if (!dueDate) {
    return res.status(400).json({
      success: false,
      message: 'Due date is required for expert review'
    });
  }
  
  // Validate due date is within 30 days
  const dueDateObj = new Date(dueDate);
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (dueDateObj <= today || dueDateObj > maxDate) {
    return res.status(400).json({
      success: false,
      message: 'Due date must be between tomorrow and 30 days from today'
    });
  }

  const proposal = await Proposal.findById(req.params.proposalId).populate('createdBy', 'fullName email');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Validate proposal is in CMPDI_REVIEW status
  if (proposal.status !== 'CMPDI_REVIEW') {
    return res.status(400).json({
      success: false,
      message: 'Proposal must be in CMPDI_REVIEW status to send for expert review'
    });
  }

  // Validate all selected users are expert reviewers
  const reviewers = await User.find({ 
    _id: { $in: reviewerIds },
    roles: 'EXPERT_REVIEWER',
    isActive: true
  });

  if (reviewers.length !== reviewerIds.length) {
    return res.status(400).json({
      success: false,
      message: 'All selected users must be active expert reviewers'
    });
  }

  const oldStatus = proposal.status;

  // Mark that expert review was NOT skipped since CMPDI is sending for expert review
  proposal.expertReviewSkipped = false;

  // Update status to CMPDI_EXPERT_REVIEW
  proposal.status = 'CMPDI_EXPERT_REVIEW';
  proposal.timeline.push({
    status: 'CMPDI_EXPERT_REVIEW',
    changedBy: req.user._id,
    changedAt: new Date(),
    notes: notes || 'Sent for expert review'
  });

  // Assign the selected expert reviewers with due date
  proposal.assignedReviewers = await updateAssignedReviewersForExpertReview(proposal, req.user._id, reviewerIds, dueDateObj);
  console.log(`[EXPERT-ASSIGN] Added ${proposal.assignedReviewers.length} expert reviewers selected by CMPDI with due date ${dueDateObj}`);

  // Add expert reviewers as collaborators
  for (const reviewer of reviewers) {
    const existingCollaborator = proposal.collaborators.find(
      c => c.userId.toString() === reviewer._id.toString()
    );
    if (!existingCollaborator) {
      proposal.collaborators.push({
        userId: reviewer._id,
        role: 'REVIEWER',
        addedAt: new Date()
      });
    }
  }

  await proposal.save();

  // Send notification emails to selected reviewers
  for (const reviewer of reviewers) {
    await emailService.sendReviewerAssignmentEmail(
      reviewer.email,
      reviewer.fullName,
      proposal.proposalCode,
      proposal.title,
      null // No due date specified
    );
  }

  // Send notification email to PI
  try {
    await emailService.sendStatusUpdateEmail(
      proposal.createdBy.email,
      proposal.createdBy.fullName,
      {
        proposalCode: proposal.proposalCode,
        title: proposal.title,
        projectArea: proposal.projectArea,
        submittedDate: proposal.createdAt
      },
      oldStatus,
      'CMPDI_EXPERT_REVIEW',
      notes || `Sent for expert review with ${reviewers.length} reviewer(s)`
    );
  } catch (emailError) {
    console.error('[EMAIL ERROR] Failed to send status update email:', emailError);
    // Don't fail the request if email fails
  }

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'EXPERT_REVIEWERS_ASSIGNED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      reviewerCount: reviewers.length,
      reviewerNames: reviewers.map(r => r.fullName)
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: `Proposal sent for expert review with ${reviewers.length} reviewer(s)`,
    data: {
      proposalCode: proposal.proposalCode,
      status: proposal.status,
      assignedReviewers: reviewers.map(r => ({
        id: r._id,
        fullName: r.fullName,
        email: r.email,
        expertiseDomains: r.expertiseDomains
      }))
    }
  });
});

/**
 * @route   GET /api/users/expert-reviewers
 * @desc    Get list of all expert reviewers (for CMPDI selection modal)
 * @access  Private (CMPDI/Admin)
 */
export const getExpertReviewers = asyncHandler(async (req, res) => {
  const isCMPDI = req.user.roles.includes('CMPDI_MEMBER');
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  
  if (!isCMPDI && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only CMPDI members can view expert reviewers list'
    });
  }

  const expertReviewers = await User.find({
    roles: 'EXPERT_REVIEWER',
    isActive: true
  }).select('_id fullName email expertiseDomains organization');

  res.json({
    success: true,
    data: expertReviewers
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
