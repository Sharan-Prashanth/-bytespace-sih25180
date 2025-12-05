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

  const query = { proposalId: proposal._id, parentComment: null }; // Only top-level comments

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

  const comment = await Comment.create({
    proposalId: proposal._id,
    author: req.user._id,
    content,
    isInline: isInline || false,
    inlinePosition: inlinePosition || null,
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
