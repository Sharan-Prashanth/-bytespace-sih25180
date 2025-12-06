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
  console.log('[CommentAPI] getInlineDiscussions called with:', { proposalId, formId });
  try {
    // Use new inline comments endpoint that loads from database
    const response = await apiClient.get(`/api/proposals/${proposalId}/comments/inline`, {
      params: { formName: formId }
    });
    console.log('[CommentAPI] getInlineDiscussions response:', response.data);
    return response.data?.data || { discussions: [], suggestions: [] };
  } catch (error) {
    console.error('[CommentAPI] Failed to get inline discussions:', error);
    console.error('[CommentAPI] Error response:', error.response?.data);
    return { discussions: [], suggestions: [] };
  }
};

/**
 * Save inline discussions (comments + suggestions) for a proposal form
 * Now saves individual comments to database instead of bulk save
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {Array} discussions - Array of discussion objects
 * @param {Array} suggestions - Array of suggestion objects (optional)
 * @returns {Promise<boolean>} Success status
 */
export const saveInlineDiscussions = async (proposalId, formId, discussions, suggestions = []) => {
  console.log('[CommentAPI] saveInlineDiscussions called with:', { 
    proposalId, 
    formId, 
    discussionsCount: discussions?.length,
    suggestionsCount: suggestions?.length 
  });
  
  if (!discussions || discussions.length === 0) {
    console.log('[CommentAPI] No discussions to save');
    return true;
  }
  
  try {
    // First, get all existing discussions from DB to avoid duplicates
    const existingResponse = await apiClient.get(`/api/proposals/${proposalId}/comments/inline`, {
      params: { formName: formId }
    });
    const existingDiscussionIds = new Set(
      (existingResponse.data?.data?.discussions || []).map(d => d.id)
    );
    
    // Save each new discussion as a separate comment in the database
    let savedCount = 0;
    for (const discussion of discussions) {
      // Skip if discussion already exists in DB
      if (existingDiscussionIds.has(discussion.id)) {
        console.log('[CommentAPI] Skipping existing discussion:', discussion.id);
        continue;
      }
      
      const firstComment = discussion.comments?.[0];
      if (!firstComment) continue;
      
      // Create inline comment for new discussions
      try {
        const response = await apiClient.post(`/api/proposals/${proposalId}/comments/inline`, {
          formName: formId,
          discussionId: discussion.id,
          documentContent: discussion.documentContent || '',
          contentRich: firstComment.contentRich,
          content: firstComment.contentRich?.[0]?.children?.[0]?.text || 'Inline comment'
        });
        
        console.log('[CommentAPI] Created new discussion:', discussion.id);
        savedCount++;
        
        // Save any additional comments as replies
        for (let i = 1; i < discussion.comments.length; i++) {
          const comment = discussion.comments[i];
          await apiClient.post(`/api/proposals/${proposalId}/comments/inline/${discussion.id}/reply`, {
            contentRich: comment.contentRich,
            content: comment.contentRich?.[0]?.children?.[0]?.text || 'Reply'
          });
        }
      } catch (err) {
        // Check if it's a "already exists" error
        if (err.response?.status === 409 || err.response?.data?.message?.includes('already exists')) {
          console.log('[CommentAPI] Discussion already exists:', discussion.id);
        } else {
          console.error('[CommentAPI] Error saving discussion:', discussion.id, err.response?.data?.message || err.message);
        }
      }
    }
    
    console.log('[CommentAPI] saveInlineDiscussions completed. Saved', savedCount, 'new discussions');
    return true;
  } catch (error) {
    console.error('[CommentAPI] Failed to save inline discussions:', error);
    console.error('[CommentAPI] Error response:', error.response?.data);
    return false;
  }
};

/**
 * Add a new inline comment to a discussion
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {string} discussionId - Discussion ID
 * @param {Object} comment - Comment data (contentRich or text)
 * @returns {Promise<Object|null>} Updated comment or null
 */
export const addInlineComment = async (proposalId, formId, discussionId, comment) => {
  try {
    const response = await apiClient.post(`/api/proposals/${proposalId}/comments/inline/${discussionId}/reply`, {
      contentRich: comment.contentRich,
      content: comment.contentRich?.[0]?.children?.[0]?.text || comment.text || 'Reply'
    });
    return response.data?.data || null;
  } catch (error) {
    console.error('[CommentAPI] Failed to add inline comment:', error);
    return null;
  }
};

/**
 * Resolve or reopen a discussion (only author can resolve)
 * @param {string} proposalId - Proposal ID
 * @param {string} formId - Form identifier
 * @param {string} discussionId - Discussion ID
 * @param {boolean} isResolved - Whether to resolve or reopen
 * @returns {Promise<Object|null>} Updated discussion or null
 */
export const resolveDiscussion = async (proposalId, formId, discussionId, isResolved = true) => {
  try {
    const response = await apiClient.put(`/api/proposals/${proposalId}/comments/inline/${discussionId}/resolve`, {
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
