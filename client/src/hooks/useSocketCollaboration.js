'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, initializeSocket, disconnectSocket } from '../utils/socket';

/**
 * Socket.io Collaboration Hook for Plate.js
 * 
 * Replaces Yjs/Hocuspocus with Socket.io-based real-time collaboration
 * Integrates with the new CollaborationService backend
 * 
 * @param {Object} options
 * @param {string} options.proposalId - MongoDB proposal ID or proposalCode
 * @param {string} options.formId - Form identifier (formi, formia, etc.)
 * @param {Object} options.user - Current user object { _id, fullName, email }
 * @param {boolean} options.enabled - Enable collaboration (default: true)
 * @param {Function} options.onContentUpdate - Callback when content updates from other users
 * @param {Function} options.onUserJoined - Callback when user joins room
 * @param {Function} options.onUserLeft - Callback when user leaves room
 * @param {Function} options.onCommentAdded - Callback when new comment is added
 * @param {Function} options.onCommentReply - Callback when reply is added to comment
 * @param {Function} options.onCommentResolved - Callback when comment is resolved
 * 
 * @returns {Object} { connected, activeUsers, sendUpdate, getRoomState, addComment, replyToComment, resolveComment }
 */
export function useSocketCollaboration({
  proposalId,
  formId,
  user,
  enabled = true,
  debounceDelay = 10000, // Default 10 seconds
  onContentUpdate = () => {},
  onUserJoined = () => {},
  onUserLeft = () => {},
  onCommentAdded = () => {},
  onCommentReply = () => {},
  onCommentResolved = () => {},
  onProposalSaved = () => {}
}) {
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [roomState, setRoomState] = useState(null);
  const socketRef = useRef(null);
  const updateDebounceRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!enabled || !proposalId || !user) {
      console.warn('[Socket] Collaboration disabled:', { enabled, proposalId, hasUser: !!user });
      return;
    }

    console.log(`[Socket] Initializing for proposal ${proposalId}`);

    // Initialize socket connection
    initializeSocket();
    const socket = getSocket();
    socketRef.current = socket;

    // Join proposal room
    const joinRoom = () => {
      socket.emit('join-proposal-room', { proposalId }, (response) => {
        if (response.success) {
          console.log(`[Socket] Joined room ${proposalId}`);
          setConnected(true);
          setActiveUsers(response.activeUsers || []);
          setRoomState(response.roomState);
        } else {
          console.error('[Socket] Failed to join room:', response.error);
          setConnected(false);
        }
      });
    };

    // Handle connection
    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
      joinRoom();
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    // Listen for form content updates from other users
    socket.on('form-content-updated', (data) => {
      if (data.proposalId === proposalId) {
        // Only apply if not from current user
        if (data.updatedBy.userId !== user._id) {
          console.log(`[Socket] Content updated by ${data.updatedBy.fullName}`);
          onContentUpdate(data);
        }
      }
    });

    // Listen for proposal content updates
    socket.on('proposal-content-updated', (data) => {
      if (data.proposalId === proposalId) {
        if (data.updatedBy.userId !== user._id) {
          onContentUpdate(data);
        }
        setRoomState(data.roomState);
      }
    });

    // Listen for user joined events
    socket.on('user-joined', (data) => {
      console.log(`[Socket] User joined: ${data.user.fullName}`);
      setActiveUsers(data.activeUsers || []);
      onUserJoined(data);
    });

    // Listen for user left events
    socket.on('user-left', (data) => {
      console.log(`[Socket] User left: ${data.user.fullName}`);
      setActiveUsers(data.activeUsers || []);
      onUserLeft(data);
    });

    // Listen for proposal saved events
    socket.on('proposal-saved', (data) => {
      if (data.proposalId === proposalId) {
        console.log('[Socket] Proposal saved');
        setRoomState(data.roomState);
        onProposalSaved(data);
      }
    });

    // Listen for new comments
    socket.on('new-comment', (data) => {
      if (data.proposalId === proposalId) {
        console.log('[Socket] New comment received');
        onCommentAdded(data);
      }
    });

    // Listen for comment replies
    socket.on('comment-reply-added', (data) => {
      if (data.proposalId === proposalId) {
        console.log('[Socket] Comment reply received');
        onCommentReply(data);
      }
    });

    // Listen for comment resolved
    socket.on('comment-resolved', (data) => {
      if (data.proposalId === proposalId) {
        console.log('[Socket] Comment resolved');
        onCommentResolved(data);
      }
    });

    // Set up periodic update interval (configurable delay)
    updateIntervalRef.current = setInterval(() => {
      if (pendingUpdateRef.current && socketRef.current?.connected) {
        const { editorContent, wordCount, characterCount } = pendingUpdateRef.current;
        
        socketRef.current.emit('update-form-content', {
          proposalId,
          formId: formId || 'formi',
          editorContent,
          wordCount,
          characterCount
        }, (response) => {
          if (response?.success) {
            pendingUpdateRef.current = null;
          }
        });
      }
    }, debounceDelay);

    // Cleanup on unmount
    return () => {
      console.log(`[Socket] Leaving room ${proposalId}`);
      
      // Send any pending updates before leaving
      if (pendingUpdateRef.current && socket.connected) {
        const { editorContent, wordCount, characterCount } = pendingUpdateRef.current;
        socket.emit('update-form-content', {
          proposalId,
          formId: formId || 'formi',
          editorContent,
          wordCount,
          characterCount
        });
      }

      // Clear interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      // Leave room
      socket.emit('leave-proposal-room', { proposalId }, (response) => {
        if (response?.success) {
          console.log('[Socket] Left room successfully');
        }
      });

      // Remove event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('form-content-updated');
      socket.off('proposal-content-updated');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('proposal-saved');
      socket.off('new-comment');
      socket.off('comment-reply-added');
      socket.off('comment-resolved');
    };
  }, [proposalId, formId, user, enabled]);

  /**
   * Send form content update to server (debounced + batched)
   * Updates are batched and sent every 10 seconds
   */
  const sendUpdate = useCallback((editorContent, wordCount = 0, characterCount = 0) => {
    if (!connected || !socketRef.current || !proposalId) {
      return;
    }

    // Store the update to be sent on next interval
    pendingUpdateRef.current = { editorContent, wordCount, characterCount };
  }, [connected, proposalId]);

  /**
   * Force send update immediately (used before navigation)
   */
  const sendUpdateImmediately = useCallback((editorContent, wordCount = 0, characterCount = 0) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('update-form-content', {
        proposalId,
        formId: formId || 'formi',
        editorContent,
        wordCount,
        characterCount
      }, (response) => {
        if (response?.success) {
          pendingUpdateRef.current = null;
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Update failed'));
        }
      });
    });
  }, [connected, proposalId, formId]);

  /**
   * Force save proposal to database
   */
  const saveProposal = useCallback(() => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('save-proposal', { proposalId }, (response) => {
        if (response?.success) {
          console.log('[Socket] Proposal saved successfully');
          setRoomState(response.roomState);
          resolve(response);
        } else {
          console.error('[Socket] Failed to save proposal:', response?.error);
          reject(new Error(response?.error || 'Save failed'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Get current room state from server
   */
  const getRoomState = useCallback(() => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('get-room-state', { proposalId }, (response) => {
        if (response?.success) {
          setRoomState(response.roomState);
          setActiveUsers(response.roomState?.activeUsers || []);
          resolve(response.roomState);
        } else {
          reject(new Error(response?.error || 'Failed to get room state'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Create a major version
   */
  const createVersion = useCallback((commitMessage) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('create-version', {
        proposalId,
        commitMessage
      }, (response) => {
        if (response?.success) {
          console.log('[Socket] Version created successfully');
          setRoomState(response.roomState);
          resolve(response);
        } else {
          console.error('[Socket] Failed to create version:', response?.error);
          reject(new Error(response?.error || 'Version creation failed'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Add a comment via socket
   */
  const addComment = useCallback((comment) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('add-comment', {
        proposalId,
        comment
      }, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to add comment'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Reply to a comment via socket
   */
  const replyToComment = useCallback((commentId, content) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('reply-to-comment', {
        proposalId,
        commentId,
        content
      }, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to reply to comment'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Resolve a comment via socket
   */
  const resolveComment = useCallback((commentId) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('resolve-comment', {
        proposalId,
        commentId
      }, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to resolve comment'));
        }
      });
    });
  }, [connected, proposalId]);

  /**
   * Send chat message
   */
  const sendChatMessage = useCallback((message) => {
    if (!connected || !socketRef.current || !proposalId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('send-chat-message', {
        proposalId,
        message
      }, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }, [connected, proposalId]);

  return {
    // Connection status
    isConnected: connected,
    connected,
    // Users
    connectedUsers: activeUsers,
    activeUsers,
    // Room state
    roomState,
    // Updates
    sendUpdate,
    sendUpdateImmediately,
    updateBatch: (updates) => {
      // Send multiple updates at once
      Object.entries(updates).forEach(([field, value]) => {
        if (socketRef.current && connected) {
          socketRef.current.emit('field-update', {
            proposalId,
            field,
            value
          });
        }
      });
    },
    // Proposal actions
    saveProposal,
    getRoomState,
    createVersion,
    // Comments
    addComment,
    replyToComment,
    resolveComment,
    // Chat
    sendChatMessage,
    // Event subscriptions
    onUpdate: (callback) => {
      if (socketRef.current) {
        const handler = (data) => {
          if (data.proposalId === proposalId && data.updatedBy?.userId !== user?._id) {
            callback(data);
          }
        };
        socketRef.current.on('field-update', handler);
        return () => socketRef.current?.off('field-update', handler);
      }
      return () => {};
    },
    onCommentAdded: (callback) => {
      if (socketRef.current) {
        const handler = (data) => {
          if (data.proposalId === proposalId) {
            callback(data.comment || data);
          }
        };
        socketRef.current.on('new-comment', handler);
        return () => socketRef.current?.off('new-comment', handler);
      }
      return () => {};
    },
    onCommentResolved: (callback) => {
      if (socketRef.current) {
        const handler = (data) => {
          if (data.proposalId === proposalId) {
            callback(data);
          }
        };
        socketRef.current.on('comment-resolved', handler);
        return () => socketRef.current?.off('comment-resolved', handler);
      }
      return () => {};
    }
  };
}

/**
 * Get user color for cursor/presence
 */
export function getUserColor(userId) {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B88B', // Peach
    '#AAB7B8'  // Gray
  ];

  // Simple hash function to get consistent color for user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
