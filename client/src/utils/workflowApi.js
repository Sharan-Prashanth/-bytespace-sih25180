import apiClient from './api';

/**
 * Workflow API utilities
 * All endpoints for workflow management and dashboard
 */

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/workflow/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update proposal status (committee members only)
export const updateProposalStatus = async (proposalId, statusData) => {
  try {
    const response = await apiClient.put(`/api/workflow/${proposalId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Assign reviewer to proposal
export const assignReviewer = async (proposalId, reviewerData) => {
  try {
    const response = await apiClient.post(`/api/workflow/${proposalId}/assign-reviewer`, reviewerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Request clarification from PI
export const requestClarification = async (proposalId, clarificationData) => {
  try {
    const response = await apiClient.post(`/api/workflow/${proposalId}/request-clarification`, clarificationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getDashboardStats,
  updateProposalStatus,
  assignReviewer,
  requestClarification
};
