/**
 * Comment API Utilities
 * Handles inline comments and suggestions for Plate.js editor
 */

import apiClient from './api';

/**
 * Get all inline discussions (comments + suggestions) for a proposal form
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier (e.g., 'formi', 'formia')
 * @returns {Promise<Object>} Object with discussions and suggestions arrays
 */
export const getInlineDiscussions = async (proposalId, formId = 'formi') => {
  try {
    const response = await apiClient.get(`/api/proposals/${proposalId}/discussions`, {
      params: { formId }
    });
    return response.data?.data || { discussions: [], suggestions: [] };
  } catch (error) {
    console.error('[CommentAPI] Failed to get inline discussions:', error);
    return { discussions: [], suggestions: [] };
  }
};

/**
 * Save inline discussions (comments + suggestions) for a proposal form
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {Array} discussions - Array of discussion objects
 * @param {Array} suggestions - Array of suggestion objects (optional)
 * @returns {Promise<boolean>} Success status
 */
export const saveInlineDiscussions = async (proposalId, formId, discussions, suggestions = []) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/discussions`, {
      formId,
      discussions,
      suggestions
    });
    return response.data?.success || false;
  } catch (error) {
    console.error('[CommentAPI] Failed to save inline discussions:', error);
    return false;
  }
};

/**
 * Add a new inline comment to a discussion
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {string} discussionId - Discussion ID
 * @param {Object} comment - Comment data (contentRich or text)
 * @returns {Promise<Object|null>} Updated discussions or null
 */
export const addInlineComment = async (proposalId, formId, discussionId, comment) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/discussions/comment`, {
      formId,
      discussionId,
      comment
    });
    return response.data?.data || null;
  } catch (error) {
    console.error('[CommentAPI] Failed to add inline comment:', error);
    return null;
  }
};

/**
 * Resolve or reopen a discussion
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {string} discussionId - Discussion ID
 * @param {boolean} isResolved - Whether to resolve or reopen
 * @returns {Promise<Object|null>} Updated discussions or null
 */
export const resolveDiscussion = async (proposalId, formId, discussionId, isResolved = true) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/discussions/resolve`, {
      formId,
      discussionId,
      isResolved
    });
    return response.data?.data || null;
  } catch (error) {
    console.error('[CommentAPI] Failed to resolve discussion:', error);
    return null;
  }
};

export default {
  getInlineDiscussions,
  saveInlineDiscussions,
  addInlineComment,
  resolveDiscussion
};
