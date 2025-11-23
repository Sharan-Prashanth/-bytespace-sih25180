import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { getActiveUsers, getRoomStatus } from '../services/collaborationService.js';

/**
 * @desc    Add collaborator to a proposal
 * @route   POST /api/collaboration/proposals/:proposalId/collaborators
 * @access  Private (Author or Admin)
 */
export const addCollaborator = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { userId, role, permissions, inviteMessage } = req.body;

    // Validate required fields
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId and role are required'
      });
    }

    // Find proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization - only author or existing admins can add collaborators
    const isAuthor = proposal.author.toString() === req.user._id.toString();
    const isAdmin = proposal.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString() && 
                collab.role === 'admin' && 
                collab.permissions.canInvite
    );

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add collaborators to this proposal'
      });
    }

    // Find the user to be added
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = proposal.collaborators?.find(
      collab => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator on this proposal'
      });
    }

    // Check maximum collaborators limit (max 5 total including author)
    if (proposal.collaborators && proposal.collaborators.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 5 collaborators allowed per proposal'
      });
    }

    // Default permissions based on role
    const defaultPermissions = {
      principal_investigator: { canEdit: true, canComment: true, canInvite: true },
      admin: { canEdit: true, canComment: true, canInvite: true },
      reviewer: { canEdit: false, canComment: true, canInvite: false },
      collaborator: { canEdit: true, canComment: true, canInvite: false },
      observer: { canEdit: false, canComment: true, canInvite: false }
    };

    // Add collaborator
    proposal.collaborators = proposal.collaborators || [];
    proposal.collaborators.push({
      user: userId,
      role: role,
      permissions: permissions || defaultPermissions[role] || { canEdit: true, canComment: true, canInvite: false },
      invitedBy: req.user._id,
      invitedAt: new Date(),
      status: 'accepted'
    });

    await proposal.save();

    // Send notification email
    try {
      await emailService.sendCollaborationInviteEmail(
        userToAdd.email,
        proposal.title,
        proposalId,
        req.user.name,
        role,
        inviteMessage || ''
      );
    } catch (emailError) {
      console.error('Failed to send collaboration email:', emailError);
      // Don't fail the request if email fails
    }

    // Populate the new collaborator data
    await proposal.populate('collaborators.user', 'name email profilePicture isOnline lastActivity');

    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      collaborators: proposal.collaborators
    });

  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding collaborator',
      error: error.message
    });
  }
};

/**
 * @desc    Invite collaborator by email (user may not exist in system yet)
 * @route   POST /api/collaboration/proposals/:proposalId/invite
 * @access  Private (Author or Admin)
 */
export const inviteCollaboratorByEmail = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { email, role, description } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'email and role are required'
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

    // Find proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization
    const isAuthor = proposal.author.toString() === req.user._id.toString();
    const isAdmin = proposal.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString() && 
                collab.role === 'admin' && 
                collab.permissions.canInvite
    );

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite collaborators to this proposal'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      // User exists - check if already a collaborator
      const isCollaborator = proposal.collaborators?.some(
        collab => collab.user.toString() === existingUser._id.toString()
      );

      if (isCollaborator) {
        return res.status(400).json({
          success: false,
          message: 'This user is already a collaborator on this proposal'
        });
      }

      // Check maximum collaborators limit (max 5 total including author)
      if (proposal.collaborators && proposal.collaborators.length >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 5 collaborators allowed per proposal'
        });
      }

      // Add as collaborator directly
      const defaultPermissions = {
        principal_investigator: { canEdit: true, canComment: true, canInvite: true },
        admin: { canEdit: true, canComment: true, canInvite: true },
        reviewer: { canEdit: false, canComment: true, canInvite: false },
        collaborator: { canEdit: true, canComment: true, canInvite: false },
        observer: { canEdit: false, canComment: true, canInvite: false }
      };

      proposal.collaborators = proposal.collaborators || [];
      proposal.collaborators.push({
        user: existingUser._id,
        role: role,
        permissions: defaultPermissions[role] || { canEdit: true, canComment: true, canInvite: false },
        invitedBy: req.user._id,
        invitedAt: new Date(),
        status: 'pending'
      });

      await proposal.save();
    }

    // Send invitation email
    const emailResult = await emailService.sendCollaborationInviteEmail(
      email,
      proposal.title,
      proposalId,
      req.user.name,
      role,
      description || ''
    );

    if (emailResult.success) {
      console.log(`📧 Collaboration invitation sent to ${email} for proposal ${proposalId}`);
      
      await proposal.populate('collaborators.user', 'name email profilePicture isOnline lastActivity');
      
      res.status(200).json({
        success: true,
        message: existingUser 
          ? `Invitation sent to ${email}. User added as pending collaborator.`
          : `Invitation sent to ${email}. They will be added once they register.`,
        emailId: emailResult.messageId,
        mode: emailResult.mode,
        collaborators: proposal.collaborators
      });
    } else {
      console.error(`❌ Failed to send invitation to ${email}:`, emailResult.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email',
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('Error inviting collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while inviting collaborator',
      error: error.message
    });
  }
};

/**
 * @desc    Get all collaborators for a proposal
 * @route   GET /api/collaboration/proposals/:proposalId/collaborators
 * @access  Private
 */
export const getCollaborators = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId)
      .populate('collaborators.user', 'name email profilePicture isOnline lastActivity department')
      .populate('collaborators.invitedBy', 'name email')
      .populate('author', 'name email profilePicture isOnline lastActivity');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization - must be author or collaborator
    const isAuthor = proposal.author._id.toString() === req.user._id.toString();
    const isCollaborator = proposal.collaborators?.some(
      collab => collab.user._id.toString() === req.user._id.toString()
    );

    if (!isAuthor && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view collaborators'
      });
    }

    // Get active users from Socket.IO
    const activeUsersData = getActiveUsers(proposalId);
    const activeUserIds = activeUsersData.map(u => u.userId);

    // Format collaborators with online status
    const collaborators = proposal.collaborators?.map(collab => ({
      _id: collab._id,
      user: collab.user,
      role: collab.role,
      permissions: collab.permissions,
      invitedBy: collab.invitedBy,
      invitedAt: collab.invitedAt,
      status: collab.status,
      isActiveNow: activeUserIds.includes(collab.user._id.toString()),
      color: activeUsersData.find(u => u.userId === collab.user._id.toString())?.color
    })) || [];

    // Add author as principal investigator if not in collaborators
    const authorAsCollaborator = {
      _id: 'author',
      user: proposal.author,
      role: 'principal_investigator',
      permissions: { canEdit: true, canComment: true, canInvite: true },
      isActiveNow: activeUserIds.includes(proposal.author._id.toString()),
      color: activeUsersData.find(u => u.userId === proposal.author._id.toString())?.color
    };

    res.status(200).json({
      success: true,
      author: authorAsCollaborator,
      collaborators: collaborators,
      activeCount: activeUsersData.length,
      totalCount: collaborators.length + 1 // +1 for author
    });

  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching collaborators',
      error: error.message
    });
  }
};

/**
 * @desc    Update collaborator role/permissions
 * @route   PUT /api/collaboration/proposals/:proposalId/collaborators/:collaboratorId
 * @access  Private (Author or Admin)
 */
export const updateCollaborator = async (req, res) => {
  try {
    const { proposalId, collaboratorId } = req.params;
    const { role, permissions } = req.body;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization
    const isAuthor = proposal.author.toString() === req.user._id.toString();
    const isAdmin = proposal.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString() && 
                collab.role === 'admin' && 
                collab.permissions.canInvite
    );

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update collaborators'
      });
    }

    // Find and update collaborator
    const collaborator = proposal.collaborators.id(collaboratorId);
    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
    }

    if (role) collaborator.role = role;
    if (permissions) collaborator.permissions = { ...collaborator.permissions, ...permissions };

    await proposal.save();
    await proposal.populate('collaborators.user', 'name email profilePicture isOnline lastActivity');

    res.status(200).json({
      success: true,
      message: 'Collaborator updated successfully',
      collaborators: proposal.collaborators
    });

  } catch (error) {
    console.error('Error updating collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating collaborator',
      error: error.message
    });
  }
};

/**
 * @desc    Remove collaborator from proposal
 * @route   DELETE /api/collaboration/proposals/:proposalId/collaborators/:collaboratorId
 * @access  Private (Author or Admin)
 */
export const removeCollaborator = async (req, res) => {
  try {
    const { proposalId, collaboratorId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization
    const isAuthor = proposal.author.toString() === req.user._id.toString();
    const isAdmin = proposal.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString() && 
                collab.role === 'admin' && 
                collab.permissions.canInvite
    );

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove collaborators'
      });
    }

    // Remove collaborator
    proposal.collaborators = proposal.collaborators.filter(
      collab => collab._id.toString() !== collaboratorId
    );

    await proposal.save();
    await proposal.populate('collaborators.user', 'name email profilePicture isOnline lastActivity');

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully',
      collaborators: proposal.collaborators
    });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing collaborator',
      error: error.message
    });
  }
};

/**
 * @desc    Get active users in a proposal room
 * @route   GET /api/collaboration/proposals/:proposalId/active
 * @access  Private
 */
export const getActiveCollaborators = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Get room status from Socket.IO
    const roomStatus = getRoomStatus(proposalId);

    res.status(200).json({
      success: true,
      ...roomStatus
    });

  } catch (error) {
    console.error('Error fetching active collaborators:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active collaborators',
      error: error.message
    });
  }
};

/**
 * @desc    Update user online status
 * @route   PUT /api/collaboration/users/status
 * @access  Private
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      isOnline: isOnline !== undefined ? isOnline : true,
      lastActivity: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'User status updated'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: error.message
    });
  }
};
