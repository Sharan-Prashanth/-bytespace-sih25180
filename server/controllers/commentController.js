import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
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
 * Helper: Check if user has access to proposal
 * Committee members and experts can view and comment on proposals
 */
const checkProposalAccess = (proposal, user) => {
  const createdById = proposal.createdBy?._id || proposal.createdBy;
  const isPI = createdById.toString() === user._id.toString();
  
  if (proposal.status === 'DRAFT') {
    return isPI;
  }
  
  const isCI = proposal.coInvestigators?.some(ci => {
    const ciId = ci._id || ci;
    return ciId.toString() === user._id.toString();
  });
  
  const isCollaborator = proposal.collaborators?.some(collab => {
    const userId = collab.userId?._id || collab.userId;
    return userId.toString() === user._id.toString();
  });
  
  const isAssignedReviewer = proposal.assignedReviewers?.some(rev => {
    const reviewerId = rev.reviewer?._id || rev.reviewer;
    return reviewerId.toString() === user._id.toString();
  });
  
  const isAdmin = user.roles?.includes('SUPER_ADMIN');
  const isCommittee = user.roles?.some(role => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role));
  const isExpertReviewer = user.roles?.includes('EXPERT_REVIEWER');
  
  const expertCanAccess = isExpertReviewer && (
    proposal.status === 'CMPDI_EXPERT_REVIEW' || 
    proposal.status === 'CMPDI_ACCEPTED' ||
    proposal.status === 'CMPDI_REJECTED'
  );

  return isPI || isCI || isCollaborator || isAssignedReviewer || isAdmin || isCommittee || expertCanAccess;
};

/**
 * @route   GET /api/proposals/:proposalId/comments
 * @desc    Get all comments for a proposal
 * @access  Private
 */
export const getComments = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { resolved, type } = req.query;

  // Find proposal by ObjectId or proposalCode
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const query = { 
    proposalId: proposal._id, 
    parentComment: null, // Only top-level comments
    discussionId: null  // Exclude inline comments/discussions (they're handled separately)
  };

  if (resolved !== undefined) {
    query.resolved = resolved === 'true';
  }

  if (type) {
    query.type = type;
  }

  const comments = await Comment.find(query)
    .sort({ createdAt: -1 })
    .populate('author', 'fullName email roles')
    .populate('resolvedBy', 'fullName email')
    .populate({
      path: 'readBy.user',
      select: 'fullName email'
    })
    .lean();

  // Get replies for each comment
  for (const comment of comments) {
    comment.replies = await Comment.find({ parentComment: comment._id })
      .sort({ createdAt: 1 })
      .populate('author', 'fullName email roles')
      .populate('resolvedBy', 'fullName email')
      .lean();
  }

  res.json({
    success: true,
    data: comments
  });
});

/**
 * @route   POST /api/proposals/:proposalId/comments
 * @desc    Add a new comment/suggestion
 * @access  Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { content, isInline, inlinePosition, formName, type } = req.body;

  const proposal = await findProposal(req.params.proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Populate fields after finding
  await proposal.populate('createdBy', 'fullName email');
  await proposal.populate('coInvestigators', 'fullName email');

  // Prevent inline comments (those with discussionId) from being saved as regular comments
  // Inline comments should only be created via /comments/inline endpoint
  if (isInline || req.body.discussionId) {
    return res.status(400).json({
      success: false,
      message: 'Inline comments must be created via /comments/inline endpoint'
    });
  }
  
  const comment = await Comment.create({
    proposalId: proposal._id,
    author: req.user._id,
    content,
    isInline: false,
    inlinePosition: null,
    formName: formName || null,
    type: type || 'COMMENT'
  });

  await comment.populate('author', 'fullName email roles');

  // Send email notifications to PI and CIs
  const recipients = [proposal.createdBy];
  if (proposal.coInvestigators) {
    recipients.push(...proposal.coInvestigators);
  }

  for (const recipient of recipients) {
    if (recipient._id.toString() !== req.user._id.toString()) {
      await emailService.sendNewCommentEmail(
        recipient.email,
        recipient.fullName,
        proposal.proposalCode,
        req.user.fullName,
        content.substring(0, 100)
      );
    }
  }

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'COMMENT_ADDED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      commentType: type
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: comment
  });
});

/**
 * @route   POST /api/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Private
 */
export const replyToComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const parentComment = await Comment.findById(req.params.commentId)
    .populate('proposalId', 'proposalCode createdBy coInvestigators')
    .populate('author', 'fullName email');

  if (!parentComment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  const reply = await Comment.create({
    proposalId: parentComment.proposalId._id,
    author: req.user._id,
    content,
    parentComment: parentComment._id,
    isInline: parentComment.isInline,
    formName: parentComment.formName,
    type: parentComment.type
  });

  await reply.populate('author', 'fullName email roles');

  // Notify comment author if different
  if (parentComment.author._id.toString() !== req.user._id.toString()) {
    await emailService.sendNewCommentEmail(
      parentComment.author.email,
      parentComment.author.fullName,
      parentComment.proposalId.proposalCode,
      req.user.fullName,
      `Reply: ${content.substring(0, 100)}`
    );
  }

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: reply
  });
});

/**
 * @route   PUT /api/comments/:commentId/resolve
 * @desc    Mark comment as resolved (only the comment author can resolve)
 * @access  Private
 */
export const resolveComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Only the comment author can resolve the comment
  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the comment author can resolve this comment'
    });
  }

  if (comment.resolved) {
    return res.status(400).json({
      success: false,
      message: 'Comment is already resolved'
    });
  }

  comment.resolved = true;
  comment.resolvedBy = req.user._id;
  comment.resolvedAt = new Date();
  await comment.save();

  await comment.populate('resolvedBy', 'fullName email');

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'COMMENT_RESOLVED',
    proposalId: comment.proposalId,
    details: { commentId: comment._id },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Comment marked as resolved',
    data: comment
  });
});

/**
 * @route   PUT /api/comments/:commentId/unresolve
 * @desc    Mark comment as unresolved
 * @access  Private
 */
export const unresolveComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  comment.resolved = false;
  comment.resolvedBy = null;
  comment.resolvedAt = null;
  await comment.save();

  res.json({
    success: true,
    message: 'Comment marked as unresolved',
    data: comment
  });
});

/**
 * @route   PUT /api/comments/:commentId/read
 * @desc    Mark comment as read
 * @access  Private
 */
export const markCommentAsRead = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Check if already read
  const alreadyRead = comment.readBy.some(
    r => r.user.toString() === req.user._id.toString()
  );

  if (!alreadyRead) {
    comment.readBy.push({
      user: req.user._id,
      readAt: new Date()
    });
    await comment.save();
  }

  res.json({
    success: true,
    message: 'Comment marked as read'
  });
});

/**
 * @route   GET /api/proposals/:proposalId/inline-comments
 * @desc    Get all inline comments for a proposal (grouped by discussion)
 * @access  Private
 */
export const getInlineComments = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formName = 'formi' } = req.query;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this proposal'
    });
  }

  // Get all inline comments for this proposal and form
  const comments = await Comment.find({
    proposalId: proposal._id,
    isInline: true,
    formName: formName,
    parentComment: null
  })
    .sort({ createdAt: 1 })
    .populate('author', 'fullName email roles')
    .populate('resolvedBy', 'fullName email')
    .lean();

  // Group comments by discussionId and get replies
  const discussions = {};
  
  for (const comment of comments) {
    const discId = comment.discussionId;
    
    if (!discId) continue;
    
    if (!discussions[discId]) {
      discussions[discId] = {
        id: discId,
        documentContent: comment.documentContent || '',
        createdAt: comment.createdAt,
        isResolved: comment.resolved,
        userId: comment.author._id.toString(),
        comments: []
      };
    }
    
    // Get replies for this comment
    const replies = await Comment.find({ parentComment: comment._id })
      .sort({ createdAt: 1 })
      .populate('author', 'fullName email roles')
      .lean();
    
    discussions[discId].comments.push({
      id: comment._id.toString(),
      userId: comment.author._id.toString(),
      contentRich: comment.contentRich || [{ type: 'p', children: [{ text: comment.content }] }],
      createdAt: comment.createdAt,
      isEdited: false,
      user: {
        id: comment.author._id.toString(),
        name: comment.author.fullName,
        avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${comment.author.email || comment.author._id}`
      },
      replies: replies.map(r => ({
        id: r._id.toString(),
        userId: r.author._id.toString(),
        contentRich: r.contentRich || [{ type: 'p', children: [{ text: r.content }] }],
        createdAt: r.createdAt,
        user: {
          id: r.author._id.toString(),
          name: r.author.fullName,
          avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${r.author.email || r.author._id}`
        }
      }))
    });
  }

  res.json({
    success: true,
    data: {
      discussions: Object.values(discussions),
      suggestions: []
    }
  });
});

/**
 * @route   POST /api/proposals/:proposalId/inline-comments
 * @desc    Create a new inline comment/discussion
 * @access  Private
 */
export const createInlineComment = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { formName = 'formi', discussionId, documentContent, contentRich, content } = req.body;

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

  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this proposal'
    });
  }

  // Check if discussion already exists
  const existingComment = await Comment.findOne({
    proposalId: proposal._id,
    discussionId: discussionId,
    isInline: true,
    parentComment: null
  });

  if (existingComment) {
    return res.status(409).json({
      success: false,
      message: 'Discussion already exists'
    });
  }

  // Create inline comment
  const comment = await Comment.create({
    proposalId: proposal._id,
    author: req.user._id,
    content: content || 'Inline comment',
    contentRich: contentRich,
    discussionId: discussionId,
    documentContent: documentContent || '',
    isInline: true,
    formName: formName,
    type: 'COMMENT'
  });

  await comment.populate('author', 'fullName email roles');

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'INLINE_COMMENT_ADDED',
    proposalId: proposal._id,
    details: { 
      proposalCode: proposal.proposalCode,
      discussionId: discussionId
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Inline comment created successfully',
    data: comment
  });
});

/**
 * @route   POST /api/proposals/:proposalId/inline-comments/:discussionId/reply
 * @desc    Reply to an inline comment discussion
 * @access  Private
 */
export const replyToInlineComment = asyncHandler(async (req, res) => {
  const { proposalId, discussionId } = req.params;
  const { contentRich, content } = req.body;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this proposal'
    });
  }

  const parentComment = await Comment.findOne({
    proposalId: proposal._id,
    discussionId: discussionId,
    isInline: true,
    parentComment: null
  });

  if (!parentComment) {
    return res.status(404).json({
      success: false,
      message: 'Discussion not found'
    });
  }

  // Create reply
  const reply = await Comment.create({
    proposalId: proposal._id,
    author: req.user._id,
    content: content || 'Reply',
    contentRich: contentRich,
    parentComment: parentComment._id,
    discussionId: discussionId,
    isInline: true,
    formName: parentComment.formName,
    type: parentComment.type
  });

  await reply.populate('author', 'fullName email roles');

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: reply
  });
});

/**
 * @route   PUT /api/proposals/:proposalId/inline-comments/:discussionId/resolve
 * @desc    Resolve/unresolve an inline discussion (only author can resolve)
 * @access  Private
 */
export const resolveInlineComment = asyncHandler(async (req, res) => {
  const { proposalId, discussionId } = req.params;
  const { isResolved = true } = req.body;

  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (!checkProposalAccess(proposal, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this proposal'
    });
  }

  const discussion = await Comment.findOne({
    proposalId: proposal._id,
    discussionId: discussionId,
    isInline: true,
    parentComment: null
  });

  if (!discussion) {
    return res.status(404).json({
      success: false,
      message: 'Discussion not found'
    });
  }

  if (discussion.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the comment author can resolve this discussion'
    });
  }

  discussion.resolved = isResolved;
  discussion.resolvedBy = isResolved ? req.user._id : null;
  discussion.resolvedAt = isResolved ? new Date() : null;
  await discussion.save();

  await discussion.populate('author', 'fullName email roles');
  await discussion.populate('resolvedBy', 'fullName email');

  res.json({
    success: true,
    message: isResolved ? 'Discussion marked as resolved' : 'Discussion reopened',
    data: discussion
  });
});
