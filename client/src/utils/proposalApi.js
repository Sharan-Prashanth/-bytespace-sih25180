import apiClient from './api';

/**
 * Proposal API utilities
 * All endpoints for proposal management
 */

// Get all proposals (filtered by user role)
export const getProposals = async (params = {}) => {
  try {
    const { status, page = 1, limit = 20, search } = params;
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(search && { search })
    });
    
    const response = await apiClient.get(`/api/proposals?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create a new proposal
export const createProposal = async (proposalData) => {
  try {
    const response = await apiClient.post('/api/proposals', proposalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get proposal by ID
export const getProposalById = async (proposalId) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update proposal
export const updateProposal = async (proposalId, proposalData) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}`, proposalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete proposal (drafts only)
export const deleteProposal = async (proposalId) => {
  try {
    const response = await apiClient.delete(`/api/proposals/${proposalId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Submit proposal
export const submitProposal = async (proposalId, submissionData) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get proposal tracking (timeline + versions)
export const getProposalTracking = async (proposalId) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/track`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Version-related APIs

// Get all versions of a proposal
export const getProposalVersions = async (proposalId) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/versions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get specific version content
export const getVersionContent = async (proposalId, versionNumber) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/versions/${versionNumber}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create a new version (commit)
export const createVersion = async (proposalId, versionData) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/versions`, versionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Revert to a previous version
export const revertToVersion = async (proposalId, versionNumber) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/versions/${versionNumber}/revert`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Collaboration APIs

// Invite co-investigator
export const inviteCoInvestigator = async (proposalId, email) => {
  try {
    const response = await apiClient.post(`/api/collaboration/${proposalId}/invite-ci`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add collaborator (admin/committee)
export const addCollaborator = async (proposalId, collaboratorData) => {
  try {
    const response = await apiClient.post(`/api/collaboration/${proposalId}/add-collaborator`, collaboratorData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Upload image
export const uploadImage = async (file, folder = 'misc') => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    
    const response = await apiClient.post('/api/collaboration/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Upload document
export const uploadDocument = async (file, proposalCode) => {
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('proposalCode', proposalCode);
    
    const response = await apiClient.post('/api/collaboration/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Comment APIs

// Get all comments for a proposal
export const getComments = async (proposalId, params = {}) => {
  try {
    const { formName } = params;
    const queryParams = new URLSearchParams({
      ...(formName && { formName })
    });
    
    const response = await apiClient.get(`/api/proposals/${proposalId}/comments?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add a comment
export const addComment = async (proposalId, commentData) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/comments`, commentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Reply to a comment
export const replyToComment = async (proposalId, commentId, replyData) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/comments/${commentId}/reply`, replyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Resolve comment
export const resolveComment = async (proposalId, commentId) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/comments/${commentId}/resolve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Unresolve comment
export const unresolveComment = async (proposalId, commentId) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/comments/${commentId}/unresolve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Mark comment as read
export const markCommentAsRead = async (proposalId, commentId) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/comments/${commentId}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Chat APIs

// Get chat messages
export const getChatMessages = async (proposalId, params = {}) => {
  try {
    const { page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams({ page, limit });
    
    const response = await apiClient.get(`/api/proposals/${proposalId}/chat?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Send chat message
export const sendChatMessage = async (proposalId, message) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/chat`, { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Mark message as read
export const markChatMessageAsRead = async (proposalId, messageId) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/chat/${messageId}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Mark all messages as read
export const markAllMessagesAsRead = async (proposalId) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/chat/mark-all-read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Report APIs

// Get all reports for a proposal
export const getReports = async (proposalId) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/reports`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get report by ID
export const getReportById = async (proposalId, reportId) => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create a report
export const createReport = async (proposalId, reportData) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/reports`, reportData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update report
export const updateReport = async (proposalId, reportId, reportData) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/reports/${reportId}`, reportData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Submit report
export const submitReport = async (proposalId, reportId) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/reports/${reportId}/submit`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete report
export const deleteReport = async (proposalId, reportId) => {
  try {
    const response = await apiClient.delete(`/api/proposals/${proposalId}/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,
  submitProposal,
  getProposalTracking,
  getProposalVersions,
  getVersionContent,
  createVersion,
  revertToVersion,
  inviteCoInvestigator,
  addCollaborator,
  uploadImage,
  uploadDocument,
  getComments,
  addComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  markCommentAsRead,
  getChatMessages,
  sendChatMessage,
  markChatMessageAsRead,
  markAllMessagesAsRead,
  getReports,
  getReportById,
  createReport,
  updateReport,
  submitReport,
  deleteReport
};
