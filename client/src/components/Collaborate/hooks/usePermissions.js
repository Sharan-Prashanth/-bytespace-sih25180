import { useMemo } from 'react';

export function usePermissions(currentUser, proposal) {
  const permissions = useMemo(() => {
    if (!currentUser || !proposal) {
      return {
        canEdit: false,
        canComment: false,
        canInviteCollaborators: false,
        canInviteExperts: false,
        canCommitVersion: false,
        canViewVersions: true,
        canChat: false
      };
    }

    const isPrincipalInvestigator = currentUser.role === 'Principal Investigator' || 
                                    currentUser._id === proposal.principalInvestigatorId;
    
    const isCoInvestigator = currentUser.role === 'Co-Investigator';
    
    const isCommitteeMember = currentUser.role === 'Committee Member';
    
    const isReviewer = currentUser.role === 'Reviewer' || currentUser.role === 'Expert';

    // Define permissions based on role
    return {
      // Editing proposal content
      canEdit: isPrincipalInvestigator || isCoInvestigator,
      
      // Adding comments and suggestions
      canComment: true, // Everyone can comment
      
      // Inviting team members (co-investigators)
      canInviteCollaborators: isPrincipalInvestigator,
      
      // Inviting external experts/reviewers
      canInviteExperts: isPrincipalInvestigator || isCommitteeMember,
      
      // Committing new versions
      canCommitVersion: isPrincipalInvestigator || isCoInvestigator,
      
      // Viewing version history
      canViewVersions: true, // Everyone can view versions
      
      // Accessing team chat
      canChat: isPrincipalInvestigator || isCoInvestigator,
      
      // Responding to suggestions
      canRespond: isPrincipalInvestigator || isCoInvestigator,
      
      // Resolving suggestions
      canResolve: isPrincipalInvestigator
    };
  }, [currentUser, proposal]);

  return permissions;
}
