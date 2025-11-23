/**
 * Collaboration API utilities
 * Centralized API calls for collaboration operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    console.warn('⚠️  No authentication token found');
  }
  return token;
};

/**
 * Create authorization headers
 */
const getHeaders = (includeContentType = true) => {
  const headers = {
    'Authorization': `Bearer ${getAuthToken()}`
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

/**
 * Get all collaborators for a proposal
 */
export const getCollaborators = async (proposalId) => {
  try {
    console.log(`👥 Fetching collaborators for proposal: ${proposalId}`);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/collaborators`, {
      headers: getHeaders(false)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch collaborators:', error);
      throw new Error(error.message || 'Failed to fetch collaborators');
    }

    const data = await response.json();
    console.log(`✅ Collaborators fetched successfully:`, data);
    return data;
  } catch (error) {
    console.error('❌ Get collaborators error:', error);
    throw error;
  }
};

/**
 * Get active collaborators currently online
 */
export const getActiveCollaborators = async (proposalId) => {
  try {
    console.log(`🟢 Fetching active collaborators for proposal: ${proposalId}`);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/active`, {
      headers: getHeaders(false)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch active collaborators:', error);
      throw new Error(error.message || 'Failed to fetch active collaborators');
    }

    const data = await response.json();
    console.log(`✅ Active collaborators fetched:`, data);
    return data;
  } catch (error) {
    console.error('❌ Get active collaborators error:', error);
    throw error;
  }
};

/**
 * Invite a collaborator by email
 */
export const inviteCollaborator = async (proposalId, inviteData) => {
  try {
    console.log(`📧 Inviting collaborator to proposal: ${proposalId}`, inviteData);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/invite`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(inviteData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to invite collaborator:', error);
      throw new Error(error.message || 'Failed to invite collaborator');
    }

    const data = await response.json();
    console.log(`✅ Collaborator invited successfully:`, data);
    return data;
  } catch (error) {
    console.error('❌ Invite collaborator error:', error);
    throw error;
  }
};

/**
 * Add an existing user as collaborator
 */
export const addCollaborator = async (proposalId, collaboratorData) => {
  try {
    console.log(`➕ Adding collaborator to proposal: ${proposalId}`, collaboratorData);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/collaborators`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(collaboratorData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to add collaborator:', error);
      throw new Error(error.message || 'Failed to add collaborator');
    }

    const data = await response.json();
    console.log(`✅ Collaborator added successfully:`, data);
    return data;
  } catch (error) {
    console.error('❌ Add collaborator error:', error);
    throw error;
  }
};

/**
 * Update collaborator role or permissions
 */
export const updateCollaborator = async (proposalId, collaboratorId, updateData) => {
  try {
    console.log(`🔄 Updating collaborator: ${collaboratorId}`, updateData);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/collaborators/${collaboratorId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to update collaborator:', error);
      throw new Error(error.message || 'Failed to update collaborator');
    }

    const data = await response.json();
    console.log(`✅ Collaborator updated successfully:`, data);
    return data;
  } catch (error) {
    console.error('❌ Update collaborator error:', error);
    throw error;
  }
};

/**
 * Remove a collaborator from proposal
 */
export const removeCollaborator = async (proposalId, collaboratorId) => {
  try {
    console.log(`❌ Removing collaborator: ${collaboratorId}`);
    
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to remove collaborator:', error);
      throw new Error(error.message || 'Failed to remove collaborator');
    }

    const data = await response.json();
    console.log(`✅ Collaborator removed successfully:`, data);
    return data;
  } catch (error) {
    console.error('❌ Remove collaborator error:', error);
    throw error;
  }
};

/**
 * Update user online status
 */
export const updateUserStatus = async (isOnline) => {
  try {
    const response = await fetch(`${API_BASE}/collaboration/users/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ isOnline })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to update user status:', error);
      throw new Error(error.message || 'Failed to update user status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Update user status error:', error);
    throw error;
  }
};

/**
 * Get room status (legacy endpoint)
 */
export const getRoomStatus = async (proposalId) => {
  try {
    const response = await fetch(`${API_BASE}/collaboration/proposals/${proposalId}/status`, {
      headers: getHeaders(false)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch room status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Get room status error:', error);
    throw error;
  }
};
