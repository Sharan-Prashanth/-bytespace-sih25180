'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, initializeSocket } from '../utils/socket';

/**
 * Socket.io Collaboration Hook for Plate.js
 * 
 * Replaces Yjs/Hocuspocus with Socket.io-based real-time collaboration
 * Integrates with the new CollaborationService backend
 * 
 * @param {Object} options
 * @param {string} options.proposalId - MongoDB proposal ID
 * @param {string} options.formId - Form identifier (formia, formib, etc.)
 * @param {Object} options.user - Current user object { _id, fullName, email }
 * @param {boolean} options.enabled - Enable collaboration (default: true)
 * @param {Function} options.onContentUpdate - Callback when content updates from other users
 * @param {Function} options.onUserJoined - Callback when user joins room
 * @param {Function} options.onUserLeft - Callback when user leaves room
 * 
 * @returns {Object} { connected, activeUsers, sendUpdate, getRoomState }
 */
export function useSocketCollaboration({
  proposalId,
  formId,
  user,
  enabled = true,
  onContentUpdate = () => {},
  onUserJoined = () => {},
  onUserLeft = () => {}
}) {
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [roomState, setRoomState] = useState(null);
  const socketRef = useRef(null);
  const updateDebounceRef = useRef(null);
  const lastUpdateRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!enabled || !proposalId || !user) {
      console.warn('⚠️ Socket collaboration disabled:', { enabled, proposalId, hasUser: !!user });
      return;
    }

    console.log(`🔌 Initializing socket collaboration for proposal ${proposalId}, form ${formId}`);

    // Initialize socket connection
    initializeSocket();
    const socket = getSocket();
    socketRef.current = socket;

    // Join proposal room
    const joinRoom = () => {
      socket.emit('join-proposal-room', { proposalId }, (response) => {
        if (response.success) {
          console.log(`✅ Joined room ${proposalId}`);
          setConnected(true);
          setActiveUsers(response.activeUsers || []);
          setRoomState(response.roomState);
        } else {
          console.error('❌ Failed to join room:', response.error);
          setConnected(false);
        }
      });
    };

    // Handle connection
    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setConnected(true);
      joinRoom();
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    // Listen for form content updates from other users
    socket.on('form-content-updated', (data) => {
      if (data.proposalId === proposalId && data.formId === formId) {
        console.log(`📝 Form ${formId} updated by ${data.updatedBy.fullName}`);
        
        // Only apply if not from current user
        if (data.updatedBy.userId !== user._id) {
          onContentUpdate(data);
        }
      }
    });

    // Listen for user joined events
    socket.on('user-joined', (data) => {
      console.log(`👋 User joined: ${data.user.fullName}`);
      setActiveUsers(data.activeUsers || []);
      onUserJoined(data);
    });

    // Listen for user left events
    socket.on('user-left', (data) => {
      console.log(`👋 User left: ${data.user.fullName}`);
      setActiveUsers(data.activeUsers || []);
      onUserLeft(data);
    });

    // Listen for proposal saved events
    socket.on('proposal-saved', (data) => {
      if (data.proposalId === proposalId) {
        console.log('💾 Proposal saved');
        setRoomState(data.roomState);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log(`🔌 Leaving room ${proposalId}`);
      
      // Leave room
      socket.emit('leave-proposal-room', { proposalId }, (response) => {
        if (response?.success) {
          console.log('✅ Left room successfully');
        }
      });

      // Remove event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('form-content-updated');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('proposal-saved');
    };
  }, [proposalId, formId, user, enabled]);

  /**
   * Send form content update to server (debounced)
   */
  const sendUpdate = useCallback((editorContent, wordCount = 0, characterCount = 0) => {
    if (!connected || !socketRef.current || !proposalId || !formId) {
      return;
    }

    // Clear existing debounce timer
    if (updateDebounceRef.current) {
      clearTimeout(updateDebounceRef.current);
    }

    // Store current update
    lastUpdateRef.current = { editorContent, wordCount, characterCount };

    // Debounce updates (send after 500ms of no changes)
    updateDebounceRef.current = setTimeout(() => {
      const socket = socketRef.current;
      const update = lastUpdateRef.current;

      console.log(`📤 Sending form update for ${formId}`);

      socket.emit('update-form-content', {
        proposalId,
        formId,
        editorContent: update.editorContent,
        wordCount: update.wordCount,
        characterCount: update.characterCount
      }, (response) => {
        if (!response?.success) {
          console.error('❌ Failed to send update:', response?.error);
        }
      });
    }, 500); // 500ms debounce
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
          console.log('✅ Proposal saved successfully');
          resolve(response);
        } else {
          console.error('❌ Failed to save proposal:', response?.error);
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
          console.log('✅ Version created successfully');
          resolve(response);
        } else {
          console.error('❌ Failed to create version:', response?.error);
          reject(new Error(response?.error || 'Version creation failed'));
        }
      });
    });
  }, [connected, proposalId]);

  return {
    connected,
    activeUsers,
    roomState,
    sendUpdate,
    saveProposal,
    getRoomState,
    createVersion
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
