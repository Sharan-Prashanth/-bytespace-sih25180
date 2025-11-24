// TODO: Replace all mock implementations with actual API calls

export const collaborateApi = {
  // Add a co-investigator to the proposal
  addCollaborator: async (proposalId, collaboratorData) => {
    // TODO: Implement actual API call
    // const response = await fetch(`/api/proposals/${proposalId}/collaborators`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(collaboratorData)
    // });
    // return response.json();

    console.log('Adding collaborator:', collaboratorData);
    return { success: true, message: 'Invitation sent successfully' };
  },

  // Invite an expert or reviewer
  inviteExpert: async (proposalId, expertData) => {
    // TODO: Implement actual API call
    // const response = await fetch(`/api/proposals/${proposalId}/experts`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(expertData)
    // });
    // return response.json();

    console.log('Inviting expert:', expertData);
    return { success: true, message: 'Expert invitation sent successfully' };
  },

  // Respond to a suggestion
  respondToSuggestion: async (proposalId, suggestionId, response) => {
    // TODO: Implement actual API call
    // const result = await fetch(`/api/proposals/${proposalId}/suggestions/${suggestionId}/respond`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify({ response })
    // });
    // return result.json();

    console.log('Responding to suggestion:', suggestionId, response);
    return { success: true, reply: { content: response, createdAt: new Date().toISOString() } };
  },

  // Mark a suggestion as resolved
  resolveSuggestion: async (proposalId, suggestionId) => {
    // TODO: Implement actual API call
    // const response = await fetch(`/api/proposals/${proposalId}/suggestions/${suggestionId}/resolve`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
    // return response.json();

    console.log('Resolving suggestion:', suggestionId);
    return { success: true, message: 'Suggestion marked as resolved' };
  },

  // Commit current changes as a new version
  commitVersion: async (proposalId, commitMessage) => {
    // TODO: Implement actual API call
    // const response = await fetch(`/api/proposals/${proposalId}/versions`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify({ message: commitMessage })
    // });
    // return response.json();

    console.log('Committing version with message:', commitMessage);
    return { success: true, version: 4, message: 'Version committed successfully' };
  },

  // Get proposal timeline events
  getTimeline: async (proposalId) => {
    // TODO: Implement actual API call
    // const response = await fetch(`/api/proposals/${proposalId}/timeline`, {
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
    // return response.json();

    console.log('Fetching timeline for:', proposalId);
    return {
      events: [
        { type: 'created', timestamp: new Date(Date.now() - 604800000).toISOString(), user: 'Dr. John Doe' },
        { type: 'submitted', timestamp: new Date(Date.now() - 518400000).toISOString(), user: 'Dr. John Doe' },
        { type: 'review-started', timestamp: new Date(Date.now() - 259200000).toISOString(), user: 'System' }
      ]
    };
  },

  // Real-time collaboration: Join editing session
  joinSession: async (proposalId) => {
    // TODO: Implement WebSocket connection for Yjs
    // const ws = new WebSocket(`wss://your-backend/api/collaborate/${proposalId}`);
    // return ws;

    console.log('Joining collaboration session:', proposalId);
    return { success: true };
  },

  // Real-time collaboration: Leave editing session
  leaveSession: async (proposalId) => {
    // TODO: Close WebSocket connection
    console.log('Leaving collaboration session:', proposalId);
    return { success: true };
  }
};
