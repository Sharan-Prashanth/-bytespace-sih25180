/**
 * Collaboration API Routes
 * 
 * REST API endpoints for collaboration operations
 * These work alongside Socket.io for real-time features
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/collaboration/rooms
 * @desc    Get all active collaboration rooms (admin only)
 * @access  Private (Admin)
 */
router.get('/rooms', asyncHandler(async (req, res) => {
  const collaborationService = req.app.get('collaborationService');
  
  // Check if user is admin
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const rooms = collaborationService.getActiveRooms();

  res.json({
    success: true,
    data: {
      rooms,
      totalRooms: rooms.length
    }
  });
}));

/**
 * @route   GET /api/collaboration/room/:proposalId
 * @desc    Get room state for a specific proposal
 * @access  Private
 */
router.get('/room/:proposalId', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const collaborationService = req.app.get('collaborationService');

  const roomState = collaborationService.getRoomState(proposalId);

  if (!roomState) {
    return res.status(404).json({
      success: false,
      message: 'Room not found. Join the room first via Socket.io'
    });
  }

  res.json({
    success: true,
    data: roomState
  });
}));

/**
 * @route   POST /api/collaboration/room/:proposalId/save
 * @desc    Force save room to database
 * @access  Private
 */
router.post('/room/:proposalId/save', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const collaborationService = req.app.get('collaborationService');

  const result = await collaborationService.saveRoomToDatabase(proposalId, { force: true });

  res.json({
    success: true,
    message: 'Room saved to database',
    data: result
  });
}));

/**
 * @route   POST /api/collaboration/room/:proposalId/version
 * @desc    Create a major version (commit)
 * @access  Private (PI only)
 */
router.post('/room/:proposalId/version', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { commitMessage } = req.body;
  const collaborationService = req.app.get('collaborationService');

  const result = await collaborationService.createMajorVersion(
    proposalId,
    commitMessage,
    req.user._id
  );

  // Broadcast version creation via Socket.io
  const io = req.app.get('io');
  io.to(`proposal-${proposalId}`).emit('version-created', {
    proposalId,
    version: result.version,
    versionNumber: result.newVersionNumber,
    createdBy: {
      userId: req.user._id,
      fullName: req.user.fullName
    },
    timestamp: Date.now()
  });

  res.json({
    success: true,
    message: 'Version created successfully',
    data: result
  });
}));

/**
 * @route   GET /api/collaboration/room/:proposalId/active-users
 * @desc    Get active users in a room
 * @access  Private
 */
router.get('/room/:proposalId/active-users', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const collaborationService = req.app.get('collaborationService');

  const roomState = collaborationService.getRoomState(proposalId);

  if (!roomState) {
    return res.json({
      success: true,
      data: {
        activeUsers: [],
        count: 0
      }
    });
  }

  res.json({
    success: true,
    data: {
      activeUsers: roomState.activeUsers,
      count: roomState.activeUsers.length
    }
  });
}));

/**
 * @route   DELETE /api/collaboration/room/:proposalId
 * @desc    Force cleanup a room (admin only)
 * @access  Private (Admin)
 */
router.delete('/room/:proposalId', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const collaborationService = req.app.get('collaborationService');

  // Check if user is admin
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Save room if dirty
  const roomState = collaborationService.getRoomState(proposalId);
  if (roomState && roomState.isDirty) {
    await collaborationService.saveRoomToDatabase(proposalId, { force: true });
  }

  // Clear room
  collaborationService.rooms.delete(proposalId);

  res.json({
    success: true,
    message: 'Room cleared'
  });
}));

/**
 * @route   POST /api/collaboration/cleanup
 * @desc    Trigger cleanup of inactive rooms (admin only)
 * @access  Private (Admin)
 */
router.post('/cleanup', asyncHandler(async (req, res) => {
  const collaborationService = req.app.get('collaborationService');

  // Check if user is admin
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  collaborationService.cleanupInactiveRooms();

  res.json({
    success: true,
    message: 'Cleanup triggered'
  });
}));

/**
 * @route   GET /api/collaboration/chat/:proposalId
 * @desc    Get chat messages for a proposal
 * @access  Private
 */
router.get('/chat/:proposalId', asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { limit = 100, skip = 0 } = req.query;
  
  const ChatMessage = (await import('../models/ChatMessage.js')).default;
  
  const messages = await ChatMessage.find({ proposalId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate('sender', 'fullName email roles')
    .lean();

  // Reverse to show oldest first
  messages.reverse();

  // Transform messages for client
  const transformedMessages = messages.map(msg => ({
    _id: msg._id,
    proposalId: msg.proposalId,
    message: msg.message,
    sender: {
      userId: msg.sender._id,
      fullName: msg.sender.fullName,
      email: msg.sender.email,
      role: msg.sender.roles?.[0] || 'USER'
    },
    timestamp: new Date(msg.createdAt).getTime(),
    createdAt: msg.createdAt
  }));

  res.json({
    success: true,
    data: {
      messages: transformedMessages,
      count: messages.length
    }
  });
}));

export default router;
