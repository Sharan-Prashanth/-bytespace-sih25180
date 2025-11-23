import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import emailService from '../services/emailService.js';
import {
  getActiveUsers,
  getRoomStatus,
  getAllActiveRooms
} from '../services/collaborationService.js';
import {
  addCollaborator,
  inviteCollaboratorByEmail,
  getCollaborators,
  updateCollaborator,
  removeCollaborator,
  getActiveCollaborators,
  updateUserStatus
} from '../controllers/collaborationController.js';

const router = express.Router();

// @desc    Send collaboration invitation
// @route   POST /api/collaboration/invite
// @access  Private
router.post('/invite', protect, async (req, res) => {
  try {
    const { proposalId, proposalTitle, email, role, message, inviterName } = req.body;

    // Validate required fields
    if (!proposalId || !proposalTitle || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: proposalId, proposalTitle, email, role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send collaboration invitation email
    const emailResult = await emailService.sendCollaborationInviteEmail(
      email,
      proposalTitle,
      proposalId,
      inviterName || req.user.name,
      role,
      message
    );

    if (emailResult.success) {
      console.log(`📧 Collaboration invitation sent to ${email} for proposal ${proposalId}`);
      res.status(200).json({
        success: true,
        message: `Collaboration invitation sent successfully to ${email}`,
        emailId: emailResult.messageId,
        mode: emailResult.mode
      });
    } else {
      console.error(`❌ Failed to send collaboration invitation to ${email}:`, emailResult.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send collaboration invitation',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error in collaboration invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending collaboration invitation',
      error: error.message
    });
  }
});

// @desc    Get collaboration invitations for a proposal
// @route   GET /api/collaboration/invitations/:proposalId
// @access  Private
router.get('/invitations/:proposalId', protect, async (req, res) => {
  try {
    const { proposalId } = req.params;

    // For now, return mock data since we don't have a database table for invitations
    // In a real implementation, you would query the database for pending invitations
    const mockInvitations = [
      {
        id: 1,
        email: 'colleague@example.com',
        role: 'Research Collaborator',
        status: 'pending',
        sentAt: new Date().toISOString(),
        sentBy: req.user.name
      }
    ];

    res.status(200).json({
      success: true,
      invitations: mockInvitations
    });
  } catch (error) {
    console.error('Error fetching collaboration invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invitations',
      error: error.message
    });
  }
});

// ========== COLLABORATION MANAGEMENT ENDPOINTS ==========

// Add collaborator to proposal
router.post('/proposals/:proposalId/collaborators', protect, addCollaborator);

// Invite collaborator by email
router.post('/proposals/:proposalId/invite', protect, inviteCollaboratorByEmail);

// Get all collaborators for a proposal
router.get('/proposals/:proposalId/collaborators', protect, getCollaborators);

// Update collaborator role/permissions
router.put('/proposals/:proposalId/collaborators/:collaboratorId', protect, updateCollaborator);

// Remove collaborator
router.delete('/proposals/:proposalId/collaborators/:collaboratorId', protect, removeCollaborator);

// Get active collaborators in real-time
router.get('/proposals/:proposalId/active', protect, getActiveCollaborators);

// Update user online status
router.put('/users/status', protect, updateUserStatus);

// ========== REAL-TIME COLLABORATION ENDPOINTS ==========

/**
 * Get active users for a specific proposal
 * GET /api/collaboration/proposals/:proposalId/users
 */
router.get("/proposals/:proposalId/users", protect, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const activeUsers = getActiveUsers(proposalId);

    res.json({
      success: true,
      proposalId,
      userCount: activeUsers.length,
      users: activeUsers
    });

  } catch (error) {
    console.error("Get active users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching active users"
    });
  }
});

/**
 * Get room status for a specific proposal
 * GET /api/collaboration/proposals/:proposalId/status
 */
router.get("/proposals/:proposalId/status", protect, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const roomStatus = getRoomStatus(proposalId);

    res.json({
      success: true,
      proposalId,
      ...roomStatus
    });

  } catch (error) {
    console.error("Get room status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching room status"
    });
  }
});

/**
 * Get all active collaboration rooms (admin/monitoring)
 * GET /api/collaboration/rooms
 */
router.get("/rooms", protect, async (req, res) => {
  try {
    const rooms = getAllActiveRooms();

    res.json({
      success: true,
      count: rooms.length,
      rooms
    });

  } catch (error) {
    console.error("Get all rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching rooms"
    });
  }
});

export default router;