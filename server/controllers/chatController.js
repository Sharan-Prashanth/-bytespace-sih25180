import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';
import Proposal from '../models/Proposal.js';
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
 * @route   GET /api/proposals/:proposalId/chat
 * @desc    Get chat messages for a proposal
 * @access  Private
 */
export const getChatMessages = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { limit = 100, before } = req.query;

  // Find proposal by ObjectId or proposalCode
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const query = { proposalId: proposal._id };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('sender', 'fullName email roles')
    .populate('readBy.user', 'fullName email')
    .lean();

  // Reverse to get chronological order
  messages.reverse();

  res.json({
    success: true,
    data: messages
  });
});

/**
 * @route   POST /api/proposals/:proposalId/chat
 * @desc    Send a chat message
 * @access  Private
 */
export const sendChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  const proposal = await findProposal(req.params.proposalId);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  const chatMessage = await ChatMessage.create({
    proposalId: proposal._id,
    sender: req.user._id,
    message: message.trim()
  });

  await chatMessage.populate('sender', 'fullName email roles');

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: chatMessage
  });
});

/**
 * @route   PUT /api/chat/:messageId/read
 * @desc    Mark chat message as read
 * @access  Private
 */
export const markMessageAsRead = asyncHandler(async (req, res) => {
  const chatMessage = await ChatMessage.findById(req.params.messageId);

  if (!chatMessage) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if already read
  const alreadyRead = chatMessage.readBy.some(
    r => r.user.toString() === req.user._id.toString()
  );

  if (!alreadyRead) {
    chatMessage.readBy.push({
      user: req.user._id,
      readAt: new Date()
    });
    await chatMessage.save();
  }

  res.json({
    success: true,
    message: 'Message marked as read'
  });
});

/**
 * @route   POST /api/proposals/:proposalId/chat/mark-all-read
 * @desc    Mark all messages as read
 * @access  Private
 */
export const markAllMessagesAsRead = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  // Get all unread messages
  const messages = await ChatMessage.find({
    proposalId,
    'readBy.user': { $ne: req.user._id }
  });

  // Mark all as read
  for (const message of messages) {
    message.readBy.push({
      user: req.user._id,
      readAt: new Date()
    });
    await message.save();
  }

  res.json({
    success: true,
    message: `Marked ${messages.length} messages as read`
  });
});
