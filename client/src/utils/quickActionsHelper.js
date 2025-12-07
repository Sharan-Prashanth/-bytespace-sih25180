/**
 * Helper utility for determining quick actions visibility based on user role and proposal status
 */

/**
 * Get which quick actions should be visible for USER role
 * @param {Object} proposal - The proposal object
 * @param {string} currentPage - Current page ('create', 'view', 'collaborate', 'track', 'review')
 * @param {Object} user - The current user object
 * @returns {Object} - Object with boolean flags for each action
 */
export const getUserQuickActions = (proposal, currentPage, user) => {
  const status = proposal?.status || 'DRAFT';
  const isDraft = status === 'DRAFT';
  const isSSRCAccepted = status === 'SSRC_ACCEPTED';
  const isSSRCRejected = status === 'SSRC_REJECTED';
  
  const actions = {
    collaborate: false,
    track: false,
    versions: false,
    review: false,
    editDraft: false,
    teamChat: false,
    view: false
  };

  switch (currentPage) {
    case 'create':
      // No quick actions on create page
      break;
      
    case 'view':
      if (isDraft) {
        // Draft: only show edit draft link
        actions.editDraft = true;
      } else if (isSSRCAccepted) {
        // SSRC Accepted: only versions and track
        actions.versions = true;
        actions.track = true;
      } else {
        // Submitted but not accepted: collaborate, track, versions
        actions.collaborate = true;
        actions.track = true;
        actions.versions = true;
      }
      break;
      
    case 'collaborate':
      if (!isDraft && !isSSRCAccepted) {
        // Only show if not draft and not SSRC accepted
        actions.versions = true;
        actions.teamChat = true;
        actions.track = true;
      }
      // If SSRC accepted, don't show collaborate page at all
      break;
      
    case 'track':
      if (!isDraft) {
        if (isSSRCAccepted) {
          // SSRC Accepted: only versions and view
          actions.versions = true;
          actions.view = true;
        } else {
          // Not accepted: versions, collaborate, view
          actions.versions = true;
          actions.collaborate = true;
          actions.view = true;
        }
      }
      // Don't show track page for draft
      break;
      
    default:
      break;
  }

  return actions;
};

/**
 * Get which quick actions should be visible for COMMITTEE members (CMPDI, TSSRC, SSRC)
 * @param {Object} proposal - The proposal object
 * @param {string} currentPage - Current page
 * @param {Object} user - The current user object
 * @returns {Object} - Object with boolean flags for each action
 */
export const getCommitteeQuickActions = (proposal, currentPage, user) => {
  const status = proposal?.status || 'DRAFT';
  const isSSRCAccepted = status === 'SSRC_ACCEPTED';
  const isSSRCRejected = status === 'SSRC_REJECTED';
  const isCMPDIRejected = status === 'CMPDI_REJECTED';
  const isTSSRCRejected = status === 'TSSRC_REJECTED';
  const isAnyRejected = isSSRCRejected || isCMPDIRejected || isTSSRCRejected;
  
  const actions = {
    collaborate: false,
    track: false,
    versions: false,
    review: false,
    editDraft: false,
    teamChat: false,
    view: false,
    canEditInCollaborate: true // Can add comments in collaborate page
  };

  // For SSRC accepted or any rejection, cannot edit in collaborate
  if (isSSRCAccepted || isAnyRejected) {
    actions.canEditInCollaborate = false;
  }

  switch (currentPage) {
    case 'dashboard':
      // Show collaborate, view, track, review for all except SSRC accepted/rejected
      if (!isSSRCAccepted && !isAnyRejected) {
        actions.collaborate = true;
        actions.view = true;
        actions.track = true;
        actions.review = true;
      } else {
        // For SSRC accepted/rejected: still show all links but no editing in collaborate
        actions.collaborate = true;
        actions.view = true;
        actions.track = true;
        actions.review = true;
      }
      break;
      
    case 'view':
      actions.collaborate = true;
      actions.versions = true;
      actions.track = true;
      actions.review = true;
      break;
      
    case 'collaborate':
      actions.teamChat = true;
      actions.view = true;
      actions.versions = true;
      actions.track = true;
      break;
      
    case 'track':
      actions.view = true;
      actions.collaborate = true;
      actions.track = true;
      // No versions in track page for committee
      break;
      
    case 'review':
      actions.collaborate = true;
      actions.track = true;
      actions.view = true;
      actions.versions = true;
      break;
      
    default:
      break;
  }

  return actions;
};

/**
 * Get which quick actions should be visible for EXPERT role
 * @param {Object} proposal - The proposal object
 * @param {string} currentPage - Current page
 * @param {Object} user - The current user object
 * @param {boolean} hasSubmittedReport - Whether expert has submitted their report
 * @returns {Object} - Object with boolean flags for each action
 */
export const getExpertQuickActions = (proposal, currentPage, user, hasSubmittedReport) => {
  const actions = {
    collaborate: false,
    track: false,
    versions: false,
    review: false,
    editDraft: false,
    teamChat: false,
    view: false,
    canEditInCollaborate: false
  };

  // If expert has submitted report, very limited access
  if (hasSubmittedReport) {
    if (currentPage === 'view') {
      // Only show in my reviews section, no quick actions on view page
      return actions;
    }
    return actions;
  }

  // If not submitted yet, show limited actions
  switch (currentPage) {
    case 'dashboard':
      // From dashboard: view and review only
      actions.view = true;
      actions.review = true;
      break;
      
    case 'view':
      actions.versions = true;
      actions.review = true;
      // No collaborate or track for experts
      break;
      
    case 'review':
      actions.versions = true;
      actions.view = true;
      // No collaborate or track for experts
      break;
      
    default:
      break;
  }

  return actions;
};

/**
 * Determine if user should see a particular page
 * @param {string} page - Page name
 * @param {Object} proposal - Proposal object
 * @param {Object} user - User object
 * @param {boolean} hasSubmittedReport - For experts only
 * @returns {boolean} - Whether user can access the page
 */
export const canAccessPage = (page, proposal, user, hasSubmittedReport = false) => {
  const userRoles = user?.roles || [];
  const isExpert = userRoles.includes('EXPERT_REVIEWER');
  const isCommittee = userRoles.some(role => 
    ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
  );
  const isRegularUser = !isExpert && !isCommittee;
  
  const status = proposal?.status || 'DRAFT';
  const isDraft = status === 'DRAFT';
  const isSSRCAccepted = status === 'SSRC_ACCEPTED';

  switch (page) {
    case 'collaborate':
      if (isExpert) {
        return false; // Experts cannot access collaborate
      }
      if (isRegularUser && isSSRCAccepted) {
        return false; // Regular users cannot collaborate on SSRC accepted
      }
      return true;
      
    case 'track':
      if (isExpert) {
        return false; // Experts cannot access track
      }
      if (isDraft) {
        return false; // No one can track drafts
      }
      return true;
      
    case 'review':
      // Only committee and experts can review
      return isExpert || isCommittee;
      
    case 'view':
      // Everyone can view
      return true;
      
    default:
      return true;
  }
};
