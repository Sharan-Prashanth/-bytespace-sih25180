import User from '../models/User.js';

/**
 * Utility for auto-assigning users to proposals based on their roles.
 * This ensures all users with relevant roles (CMPDI_MEMBER, EXPERT_REVIEWER, TSSRC_MEMBER, SSRC_MEMBER)
 * are automatically included as collaborators/reviewers for proposals in relevant stages.
 */

/**
 * Get all users with a specific role
 * @param {string} role - Role to search for (e.g., 'CMPDI_MEMBER', 'EXPERT_REVIEWER')
 * @returns {Promise<Array>} Array of user objects with _id, fullName, email
 */
export const getUsersByRole = async (role) => {
  try {
    const users = await User.find({ 
      roles: role,
      isActive: true 
    }).select('_id fullName email roles');
    return users;
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    return [];
  }
};

/**
 * Get all users for each review role
 * @returns {Promise<Object>} Object containing arrays of users by role
 */
export const getAllReviewersByRole = async () => {
  try {
    const [cmpdiMembers, expertReviewers, tssrcMembers, ssrcMembers] = await Promise.all([
      getUsersByRole('CMPDI_MEMBER'),
      getUsersByRole('EXPERT_REVIEWER'),
      getUsersByRole('TSSRC_MEMBER'),
      getUsersByRole('SSRC_MEMBER')
    ]);

    return {
      cmpdi: cmpdiMembers,
      expert: expertReviewers,
      tssrc: tssrcMembers,
      ssrc: ssrcMembers
    };
  } catch (error) {
    console.error('Error fetching reviewers by role:', error);
    return {
      cmpdi: [],
      expert: [],
      tssrc: [],
      ssrc: []
    };
  }
};

/**
 * Build collaborators array based on proposal status
 * Automatically includes all users with relevant roles
 * @param {Object} options - Options for building collaborators
 * @param {string} options.status - Current proposal status
 * @param {string} options.piId - Principal Investigator user ID
 * @param {Array} options.ciIds - Co-Investigator user IDs (optional)
 * @returns {Promise<Array>} Array of collaborator objects
 */
export const buildCollaborators = async ({ status, piId, ciIds = [] }) => {
  const collaborators = [];
  
  // Always add PI
  collaborators.push({
    userId: piId,
    role: 'PI',
    addedAt: new Date()
  });

  // Add CIs if provided
  ciIds.forEach(ciId => {
    collaborators.push({
      userId: ciId,
      role: 'CI',
      addedAt: new Date()
    });
  });

  // Get all role-based users
  const roleUsers = await getAllReviewersByRole();

  // Statuses where CMPDI members should be assigned
  const cmpdiStatuses = [
    'CMPDI_REVIEW', 
    'CMPDI_EXPERT_REVIEW', 
    'CMPDI_ACCEPTED',
    'CMPDI_REJECTED',
    'TSSRC_REVIEW',
    'TSSRC_ACCEPTED',
    'TSSRC_REJECTED',
    'SSRC_REVIEW',
    'SSRC_ACCEPTED',
    'SSRC_REJECTED'
  ];

  // Statuses where Expert Reviewers should be assigned
  const expertStatuses = [
    'CMPDI_EXPERT_REVIEW',
    'CMPDI_ACCEPTED',
    'CMPDI_REJECTED',
    'TSSRC_REVIEW',
    'TSSRC_ACCEPTED',
    'TSSRC_REJECTED',
    'SSRC_REVIEW',
    'SSRC_ACCEPTED',
    'SSRC_REJECTED'
  ];

  // Statuses where TSSRC members should be assigned
  const tssrcStatuses = [
    'TSSRC_REVIEW',
    'TSSRC_ACCEPTED',
    'TSSRC_REJECTED',
    'SSRC_REVIEW',
    'SSRC_ACCEPTED',
    'SSRC_REJECTED'
  ];

  // Statuses where SSRC members should be assigned
  const ssrcStatuses = [
    'SSRC_REVIEW',
    'SSRC_ACCEPTED',
    'SSRC_REJECTED'
  ];

  // Add CMPDI members
  if (cmpdiStatuses.includes(status)) {
    roleUsers.cmpdi.forEach(user => {
      collaborators.push({
        userId: user._id,
        role: 'CMPDI',
        addedAt: new Date()
      });
    });
  }

  // Add Expert Reviewers
  if (expertStatuses.includes(status)) {
    roleUsers.expert.forEach(user => {
      collaborators.push({
        userId: user._id,
        role: 'REVIEWER',
        addedAt: new Date()
      });
    });
  }

  // Add TSSRC members
  if (tssrcStatuses.includes(status)) {
    roleUsers.tssrc.forEach(user => {
      collaborators.push({
        userId: user._id,
        role: 'TSSRC',
        addedAt: new Date()
      });
    });
  }

  // Add SSRC members
  if (ssrcStatuses.includes(status)) {
    roleUsers.ssrc.forEach(user => {
      collaborators.push({
        userId: user._id,
        role: 'SSRC',
        addedAt: new Date()
      });
    });
  }

  return collaborators;
};

/**
 * Build assigned reviewers array with all expert reviewers
 * @param {string} assignedById - User ID of the person assigning reviewers
 * @returns {Promise<Array>} Array of assigned reviewer objects
 */
export const buildAssignedReviewers = async (assignedById) => {
  const expertReviewers = await getUsersByRole('EXPERT_REVIEWER');
  
  return expertReviewers.map(user => ({
    reviewer: user._id,
    assignedBy: assignedById,
    assignedAt: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: 'PENDING'
  }));
};

/**
 * Update proposal collaborators when status changes
 * This should be called when a proposal status is updated
 * @param {Object} proposal - Mongoose proposal document
 * @param {string} newStatus - New status being set
 * @returns {Promise<Array>} Updated collaborators array
 */
export const updateCollaboratorsForStatus = async (proposal, newStatus) => {
  const existingCollaborators = proposal.collaborators || [];
  
  // Keep PI and CIs
  const piAndCIs = existingCollaborators.filter(c => 
    c.role === 'PI' || c.role === 'CI'
  );

  // Get all role-based users
  const roleUsers = await getAllReviewersByRole();
  const newCollaborators = [...piAndCIs];

  // Helper to check if user already exists
  const userExists = (userId) => {
    return newCollaborators.some(c => 
      c.userId.toString() === userId.toString()
    );
  };

  // Add based on status progression
  const cmpdiStatuses = ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'];
  const expertStatuses = ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'];
  const tssrcStatuses = ['TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'];
  const ssrcStatuses = ['SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'];

  if (cmpdiStatuses.includes(newStatus)) {
    roleUsers.cmpdi.forEach(user => {
      if (!userExists(user._id)) {
        newCollaborators.push({
          userId: user._id,
          role: 'CMPDI',
          addedAt: new Date()
        });
      }
    });
  }

  if (expertStatuses.includes(newStatus)) {
    roleUsers.expert.forEach(user => {
      if (!userExists(user._id)) {
        newCollaborators.push({
          userId: user._id,
          role: 'REVIEWER',
          addedAt: new Date()
        });
      }
    });
  }

  if (tssrcStatuses.includes(newStatus)) {
    roleUsers.tssrc.forEach(user => {
      if (!userExists(user._id)) {
        newCollaborators.push({
          userId: user._id,
          role: 'TSSRC',
          addedAt: new Date()
        });
      }
    });
  }

  if (ssrcStatuses.includes(newStatus)) {
    roleUsers.ssrc.forEach(user => {
      if (!userExists(user._id)) {
        newCollaborators.push({
          userId: user._id,
          role: 'SSRC',
          addedAt: new Date()
        });
      }
    });
  }

  return newCollaborators;
};

/**
 * Update assigned reviewers when status changes to CMPDI_EXPERT_REVIEW
 * Automatically assigns all expert reviewers
 * @param {Object} proposal - Mongoose proposal document
 * @param {string} assignedById - User ID of who is triggering the assignment
 * @returns {Promise<Array>} Updated assigned reviewers array
 */
export const updateAssignedReviewersForExpertReview = async (proposal, assignedById) => {
  const expertReviewers = await getUsersByRole('EXPERT_REVIEWER');
  const existingReviewers = proposal.assignedReviewers || [];

  // Get existing reviewer IDs
  const existingReviewerIds = existingReviewers.map(r => 
    r.reviewer.toString()
  );

  // Add new expert reviewers that are not already assigned
  const newAssignments = expertReviewers
    .filter(user => !existingReviewerIds.includes(user._id.toString()))
    .map(user => ({
      reviewer: user._id,
      assignedBy: assignedById,
      assignedAt: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: 'PENDING'
    }));

  return [...existingReviewers, ...newAssignments];
};

export default {
  getUsersByRole,
  getAllReviewersByRole,
  buildCollaborators,
  buildAssignedReviewers,
  updateCollaboratorsForStatus,
  updateAssignedReviewersForExpertReview
};
