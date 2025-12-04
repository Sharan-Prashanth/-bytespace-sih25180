import User from '../models/User.js';

/**
 * Utility for auto-assigning users to proposals based on their roles.
 * 
 * Assignment Rules:
 * - PI is always a collaborator (added on proposal creation)
 * - CIs can be added by PI (max 5)
 * - CMPDI members are added when status changes to CMPDI_REVIEW (after AI passes)
 * - Expert reviewers are added ONLY when CMPDI explicitly assigns them (not automatically)
 * - TSSRC members are added when CMPDI accepts (status changes to TSSRC_REVIEW)
 * - SSRC members are added when TSSRC accepts (status changes to SSRC_REVIEW)
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
 * Used when creating a new proposal or resetting collaborators
 * 
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

  // NOTE: Expert reviewers are NOT added here
  // They are added only when CMPDI explicitly selects "Send for Expert Review"

  return collaborators;
};

/**
 * Update collaborators progressively based on new status
 * Only adds users relevant to the new status, doesn't rebuild the entire list
 * 
 * @param {Object} proposal - Mongoose proposal document with existing collaborators
 * @param {string} newStatus - The new status being set
 * @returns {Promise<Array>} Updated collaborators array
 */
export const updateCollaboratorsForStatus = async (proposal, newStatus) => {
  const existingCollaborators = proposal.collaborators || [];
  const existingUserIds = existingCollaborators.map(c => c.userId?.toString());
  const newCollaborators = [...existingCollaborators];

  // Get role-based users
  const roleUsers = await getAllReviewersByRole();

  // Add CMPDI members when status changes to CMPDI_REVIEW
  if (newStatus === 'CMPDI_REVIEW' || newStatus === 'CMPDI_EXPERT_REVIEW') {
    roleUsers.cmpdi.forEach(user => {
      if (!existingUserIds.includes(user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'CMPDI',
          addedAt: new Date()
        });
      }
    });
  }

  // Add TSSRC members when CMPDI accepts (status changes to TSSRC_REVIEW or CMPDI_ACCEPTED)
  if (newStatus === 'CMPDI_ACCEPTED' || newStatus === 'TSSRC_REVIEW') {
    // Ensure CMPDI members are present
    roleUsers.cmpdi.forEach(user => {
      if (!existingUserIds.includes(user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'CMPDI',
          addedAt: new Date()
        });
      }
    });
    // Add TSSRC members
    roleUsers.tssrc.forEach(user => {
      if (!existingUserIds.includes(user._id.toString()) && 
          !newCollaborators.some(c => c.userId?.toString() === user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'TSSRC',
          addedAt: new Date()
        });
      }
    });
  }

  // Add SSRC members when TSSRC accepts (status changes to SSRC_REVIEW or TSSRC_ACCEPTED)
  if (newStatus === 'TSSRC_ACCEPTED' || newStatus === 'SSRC_REVIEW') {
    // Ensure CMPDI members are present
    roleUsers.cmpdi.forEach(user => {
      if (!existingUserIds.includes(user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'CMPDI',
          addedAt: new Date()
        });
      }
    });
    // Ensure TSSRC members are present
    roleUsers.tssrc.forEach(user => {
      if (!existingUserIds.includes(user._id.toString()) && 
          !newCollaborators.some(c => c.userId?.toString() === user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'TSSRC',
          addedAt: new Date()
        });
      }
    });
    // Add SSRC members
    roleUsers.ssrc.forEach(user => {
      if (!existingUserIds.includes(user._id.toString()) && 
          !newCollaborators.some(c => c.userId?.toString() === user._id.toString())) {
        newCollaborators.push({
          userId: user._id,
          role: 'SSRC',
          addedAt: new Date()
        });
      }
    });
  }

  // NOTE: Expert reviewers are NOT added here
  // They are added only when CMPDI explicitly selects "Send for Expert Review"
  // via the assignExpertReviewers function

  return newCollaborators;
};

/**
 * Build assigned reviewers array with specified expert reviewers
 * Used when CMPDI explicitly selects "Send for Expert Review"
 * 
 * @param {Array} reviewerIds - Array of user IDs to assign as reviewers
 * @param {string} assignedById - User ID of the person assigning reviewers
 * @returns {Promise<Array>} Array of assigned reviewer objects
 */
export const buildAssignedReviewers = async (reviewerIds, assignedById) => {
  return reviewerIds.map(reviewerId => ({
    reviewer: reviewerId,
    assignedBy: assignedById,
    assignedAt: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: 'PENDING'
  }));
};

/**
 * Assign specific expert reviewers to a proposal
 * Called when CMPDI selects "Send for Expert Review" and chooses specific reviewers
 * 
 * @param {Object} proposal - Mongoose proposal document
 * @param {Array} reviewerIds - Array of user IDs to assign
 * @param {string} assignedById - User ID of who is triggering the assignment
 * @returns {Promise<Object>} Object containing updated assignedReviewers and collaborators
 */
export const assignExpertReviewers = async (proposal, reviewerIds, assignedById) => {
  const existingReviewers = proposal.assignedReviewers || [];
  const existingCollaborators = proposal.collaborators || [];

  // Get existing reviewer IDs
  const existingReviewerIds = existingReviewers.map(r => r.reviewer.toString());

  // Add new expert reviewers that are not already assigned
  const newAssignedReviewers = reviewerIds
    .filter(id => !existingReviewerIds.includes(id.toString()))
    .map(reviewerId => ({
      reviewer: reviewerId,
      assignedBy: assignedById,
      assignedAt: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: 'PENDING'
    }));

  // Add new reviewers to collaborators
  const existingCollabIds = existingCollaborators.map(c => c.userId.toString());
  const newCollaborators = reviewerIds
    .filter(id => !existingCollabIds.includes(id.toString()))
    .map(reviewerId => ({
      userId: reviewerId,
      role: 'REVIEWER',
      addedAt: new Date()
    }));

  return {
    assignedReviewers: [...existingReviewers, ...newAssignedReviewers],
    collaborators: [...existingCollaborators, ...newCollaborators]
  };
};

/**
 * Update assigned reviewers when status changes to CMPDI_EXPERT_REVIEW
 * This is called only when CMPDI explicitly sends for expert review
 * If no specific reviewers are provided, all expert reviewers are assigned
 * 
 * @param {Object} proposal - Mongoose proposal document
 * @param {string} assignedById - User ID of who is triggering the assignment
 * @param {Array} specificReviewerIds - Optional array of specific reviewer IDs to assign
 * @returns {Promise<Array>} Updated assigned reviewers array
 */
export const updateAssignedReviewersForExpertReview = async (proposal, assignedById, specificReviewerIds = null) => {
  // If specific reviewers are provided, use them
  // Otherwise, assign all expert reviewers (fallback for backward compatibility)
  let reviewerIds = specificReviewerIds;
  
  if (!reviewerIds || reviewerIds.length === 0) {
    const expertReviewers = await getUsersByRole('EXPERT_REVIEWER');
    reviewerIds = expertReviewers.map(u => u._id);
  }

  const existingReviewers = proposal.assignedReviewers || [];
  const existingReviewerIds = existingReviewers.map(r => r.reviewer.toString());

  // Add new expert reviewers that are not already assigned
  const newAssignments = reviewerIds
    .filter(id => !existingReviewerIds.includes(id.toString()))
    .map(reviewerId => ({
      reviewer: reviewerId,
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
  assignExpertReviewers,
  updateCollaboratorsForStatus,
  updateAssignedReviewersForExpertReview
};
