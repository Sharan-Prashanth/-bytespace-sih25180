/**
 * Collaboration API utilities
 * Centralized API calls for collaboration operations
 */

import apiClient from './api';

/**
 * Get all collaborators for a proposal
 */
export const getCollaborators = async (proposalId) => {
  try {
    console.log(`[CollaborationAPI] Fetching collaborators for proposal: ${proposalId}`);
    const response = await apiClient.get(`/api/collaboration/proposals/${proposalId}/collaborators`);
    console.log(`[CollaborationAPI] Collaborators fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Get collaborators error:', error);
    throw error;
  }
};

/**
 * Get active collaborators currently online
 */
export const getActiveCollaborators = async (proposalId) => {
  try {
    console.log(`[CollaborationAPI] Fetching active collaborators for proposal: ${proposalId}`);
    const response = await apiClient.get(`/api/collaboration/proposals/${proposalId}/active`);
    console.log(`[CollaborationAPI] Active collaborators fetched:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Get active collaborators error:', error);
    throw error;
  }
};

/**
 * Invite a collaborator by email
 */
export const inviteCollaborator = async (proposalId, inviteData) => {
  try {
    console.log(`[CollaborationAPI] Inviting collaborator to proposal: ${proposalId}`, inviteData);
    const response = await apiClient.post(`/api/collaboration/proposals/${proposalId}/invite`, inviteData);
    console.log(`[CollaborationAPI] Collaborator invited successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Invite collaborator error:', error);
    throw error;
  }
};

/**
 * Add an existing user as collaborator
 */
export const addCollaborator = async (proposalId, collaboratorData) => {
  try {
    console.log(`[CollaborationAPI] Adding collaborator to proposal: ${proposalId}`, collaboratorData);
    const response = await apiClient.post(`/api/collaboration/proposals/${proposalId}/collaborators`, collaboratorData);
    console.log(`[CollaborationAPI] Collaborator added successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Add collaborator error:', error);
    throw error;
  }
};

/**
 * Update collaborator role or permissions
 */
export const updateCollaborator = async (proposalId, collaboratorId, updateData) => {
  try {
    console.log(`[CollaborationAPI] Updating collaborator: ${collaboratorId}`, updateData);
    const response = await apiClient.put(`/api/collaboration/proposals/${proposalId}/collaborators/${collaboratorId}`, updateData);
    console.log(`[CollaborationAPI] Collaborator updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Update collaborator error:', error);
    throw error;
  }
};

/**
 * Remove a collaborator from proposal
 */
export const removeCollaborator = async (proposalId, collaboratorId) => {
  try {
    console.log(`[CollaborationAPI] Removing collaborator: ${collaboratorId}`);
    const response = await apiClient.delete(`/api/collaboration/proposals/${proposalId}/collaborators/${collaboratorId}`);
    console.log(`[CollaborationAPI] Collaborator removed successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Remove collaborator error:', error);
    throw error;
  }
};

/**
 * Update user online status
 */
export const updateUserStatus = async (isOnline) => {
  try {
    const response = await apiClient.put('/api/collaboration/users/status', { isOnline });
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Update user status error:', error);
    throw error;
  }
};

/**
 * Get room status (legacy endpoint)
 */
export const getRoomStatus = async (proposalId) => {
  try {
    const response = await apiClient.get(`/api/collaboration/proposals/${proposalId}/status`);
    return response.data;
  } catch (error) {
    console.error('[CollaborationAPI] Get room status error:', error);
    throw error;
  }
};
