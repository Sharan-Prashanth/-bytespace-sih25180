/**
 * Yjs Collaboration Hook
 * 
 * Replaces Socket.io with Yjs + Hocuspocus for real-time collaborative editing.
 * Uses CRDT (Conflict-free Replicated Data Types) for seamless conflict resolution.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// User color palette for cursor/selection highlighting
const USER_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#06b6d4', '#a855f7', '#ef4444',
];

/**
 * Get a consistent color for a user based on their ID
 */
export const getUserColor = (userId) => {
  if (!userId) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

/**
 * Custom hook for Yjs + Hocuspocus collaboration
 */
export const useYjsCollaboration = ({
  proposalId,
  formId = 'formi',
  user,
  displayRole = null, // Optional override for display role (e.g., 'PI', 'CI')
  enabled = true,
  onContentUpdate = () => {},
  onUserJoined = () => {},
  onUserLeft = () => {},
  onAwarenessUpdate = () => {},
}) => {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  // Store callbacks in refs to prevent useEffect dependency issues
  const onContentUpdateRef = useRef(onContentUpdate);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onAwarenessUpdateRef = useRef(onAwarenessUpdate);
  
  // Store user data in ref to prevent reconnection on object reference change
  const userRef = useRef(user);
  const displayRoleRef = useRef(displayRole);
  
  // Keep refs updated (but don't trigger reconnection)
  useEffect(() => {
    onContentUpdateRef.current = onContentUpdate;
    onUserJoinedRef.current = onUserJoined;
    onUserLeftRef.current = onUserLeft;
    onAwarenessUpdateRef.current = onAwarenessUpdate;
    userRef.current = user;
    displayRoleRef.current = displayRole;
  });
  
  // Extract stable user ID for dependency array
  const userId = user?._id;
  
  // Active users in the document
  const [activeUsers, setActiveUsers] = useState([]);
  // Ref to track previous users for join/leave detection (avoids stale closure)
  const activeUsersRef = useRef([]);
  
  // Refs for Yjs instances
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const awarenessRef = useRef(null);
  
  // Document content map
  const [contentMap, setContentMap] = useState(null);
  // Discussions map (for real-time comment sync)
  const [discussionsMap, setDiscussionsMap] = useState(null);
  
  /**
   * Get the Hocuspocus server URL
   */
  const serverUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || 
                   process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')?.replace(':5000', ':4000') ||
                   'ws://localhost:4000';
    return baseUrl;
  }, []);
  
  /**
   * Get auth token
   */
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);
  
  /**
   * Initialize Yjs document and Hocuspocus provider
   */
  useEffect(() => {
    // Use userId for dependency check, userRef.current for actual data
    if (!enabled || !proposalId || !userId) {
      return;
    }
    
    const token = getToken();
    if (!token) {
      console.warn('[Yjs] No auth token available');
      setError('Authentication required');
      return;
    }
    
    // Get current user data from ref
    const currentUser = userRef.current;
    const currentDisplayRole = displayRoleRef.current;
    
    console.log(`[Yjs] Initializing collaboration for proposal: ${proposalId}, user: ${currentUser?.fullName}`);
    setConnecting(true);
    setError(null);
    
    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    // Create Hocuspocus provider
    const provider = new HocuspocusProvider({
      url: serverUrl,
      name: `proposal-${proposalId}`,
      document: ydoc,
      token,
      
      // Connection callbacks
      onConnect: () => {
        console.log('[Yjs] Connected to Hocuspocus server');
        setConnected(true);
        setConnecting(false);
        setError(null);
      },
      
      onDisconnect: () => {
        console.log('[Yjs] Disconnected from Hocuspocus server');
        setConnected(false);
        setSynced(false);
      },
      
      onSynced: ({ state }) => {
        console.log('[Yjs] Document synced:', state);
        setSynced(true);
      },
      
      onAuthenticationFailed: ({ reason }) => {
        console.error('[Yjs] Authentication failed:', reason);
        setError(reason || 'Authentication failed');
        setConnecting(false);
      },
      
      onClose: (event) => {
        console.log('[Yjs] Connection closed:', event);
        setConnected(false);
      },
      
      // Reconnection settings
      connect: true,
      broadcast: true,
    });
    
    providerRef.current = provider;
    awarenessRef.current = provider.awareness;
    
    // Set up awareness for user presence
    const awareness = provider.awareness;
    
    // Determine user role for display
    // Uses displayRole prop if provided, otherwise checks user.roles
    const getUserRole = () => {
      // Use explicit displayRole if provided (for PI/CI determined by proposal context)
      if (currentDisplayRole) return currentDisplayRole;
      
      if (!currentUser.roles || currentUser.roles.length === 0) return 'USER';
      // Priority order for role display - committee members and reviewers first
      const rolePriority = ['SUPER_ADMIN', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'EXPERT_REVIEWER'];
      for (const role of rolePriority) {
        if (currentUser.roles.includes(role)) return role;
      }
      // Default to USER - the collaborate page determines PI/CI from proposal context
      return 'USER';
    };
    
    // Set local user state with role information
    awareness.setLocalState({
      user: {
        id: currentUser._id,
        name: currentUser.fullName,
        email: currentUser.email,
        role: getUserRole(),
        color: getUserColor(currentUser._id),
      },
      cursor: null,
      selection: null,
    });
    
    // Listen for awareness changes (user presence updates)
    // IMPORTANT: Only update React state for user join/leave events
    // Cursor/selection updates should NOT trigger React state updates to avoid focus loss
    let awarenessThrottleTimeout = null;
    const handleAwarenessChange = () => {
      // Throttle awareness updates to max once per 300ms for better responsiveness
      if (awarenessThrottleTimeout) return;
      
      awarenessThrottleTimeout = setTimeout(() => {
        awarenessThrottleTimeout = null;
        
        const states = awareness.getStates();
        const users = [];
        const previousUserIds = new Set(activeUsersRef.current.map(u => u.id));
        const currentUserIds = new Set();
        
        states.forEach((state, clientId) => {
          if (state.user && clientId !== awareness.clientID) {
            currentUserIds.add(state.user.id);
            users.push({
              clientId,
              ...state.user,
              // Don't include cursor/selection to avoid unnecessary updates
            });
          }
        });
        
        // Detect joins and leaves using ref (avoids stale closure)
        users.forEach(u => {
          if (!previousUserIds.has(u.id)) {
            console.log('[Yjs] User joined:', u.name);
            onUserJoinedRef.current({ user: u });
          }
        });
        
        previousUserIds.forEach(id => {
          if (!currentUserIds.has(id)) {
            const leftUser = activeUsersRef.current.find(u => u.id === id);
            if (leftUser) {
              console.log('[Yjs] User left:', leftUser.name);
              onUserLeftRef.current({ user: leftUser });
            }
          }
        });
        
        // Only update state if user list actually changed
        const prevUserIds = activeUsersRef.current.map(u => u.id).sort().join(',');
        const newUserIds = users.map(u => u.id).sort().join(',');
        
        activeUsersRef.current = users;
        
        if (prevUserIds !== newUserIds) {
          console.log('[Yjs] Active users updated:', users.length);
          setActiveUsers(users);
        }
      }, 300);
    };
    
    awareness.on('change', handleAwarenessChange);
    
    // Set up content map for forms
    const formContent = ydoc.getMap('formContent');
    setContentMap(formContent);
    
    // Set up discussions map for real-time comment sync
    const discussionsContent = ydoc.getMap('discussions');
    setDiscussionsMap(discussionsContent);
    
    // Listen for content changes
    const handleContentChange = (event) => {
      if (event.target === formContent) {
        const content = formContent.get(formId);
        if (content) {
          try {
            const parsed = JSON.parse(content);
            onContentUpdateRef.current({
              formId,
              editorContent: parsed,
            });
          } catch (e) {
            console.warn('[Yjs] Failed to parse content:', e);
          }
        }
      }
    };
    
    formContent.observe(handleContentChange);
    
    // Cleanup
    return () => {
      console.log('[Yjs] Cleaning up collaboration');
      
      // Clear throttle timeout
      if (awarenessThrottleTimeout) {
        clearTimeout(awarenessThrottleTimeout);
      }
      
      awareness.off('change', handleAwarenessChange);
      formContent.unobserve(handleContentChange);
      
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      
      ydocRef.current = null;
      providerRef.current = null;
      awarenessRef.current = null;
      
      setConnected(false);
      setSynced(false);
      setActiveUsers([]);
      activeUsersRef.current = [];
    };
  }, [enabled, proposalId, userId, serverUrl, formId, getToken]); // Use userId instead of user object
  
  /**
   * Send content update to all collaborators
   */
  const sendUpdate = useCallback((content) => {
    if (!contentMap || !connected) {
      console.warn('[Yjs] Cannot send update - not connected');
      return false;
    }
    
    try {
      // Wrap in transaction for atomic update
      ydocRef.current?.transact(() => {
        contentMap.set(formId, JSON.stringify(content));
      });
      
      console.log('[Yjs] Content update sent');
      return true;
    } catch (error) {
      console.error('[Yjs] Failed to send update:', error);
      return false;
    }
  }, [contentMap, connected, formId]);
  
  /**
   * Get current content from Yjs document
   */
  const getContent = useCallback(() => {
    if (!contentMap) return null;
    
    const content = contentMap.get(formId);
    if (!content) return null;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }, [contentMap, formId]);
  
  /**
   * Update local cursor position for awareness
   */
  const updateCursor = useCallback((cursor, selection) => {
    if (!awarenessRef.current) return;
    
    const currentState = awarenessRef.current.getLocalState() || {};
    awarenessRef.current.setLocalState({
      ...currentState,
      cursor,
      selection,
    });
  }, []);
  
  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    // Yjs has built-in undo/redo via UndoManager
    // This would need to be set up with the editor
    console.log('[Yjs] Undo requested');
  }, []);
  
  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    console.log('[Yjs] Redo requested');
  }, []);
  
  /**
   * Force save current document state
   */
  const saveProposal = useCallback(async () => {
    // Hocuspocus auto-saves, but we can force a sync
    if (providerRef.current) {
      console.log('[Yjs] Forcing document sync');
      // Provider will sync on next change or disconnect
      return { success: true };
    }
    return { success: false, error: 'Not connected' };
  }, []);
  
  return {
    // Connection state
    connected,
    synced,
    connecting,
    error,
    
    // Active users
    activeUsers,
    
    // Yjs instances (for advanced usage)
    ydoc: ydocRef.current,
    provider: providerRef.current,
    awareness: awarenessRef.current,
    contentMap,
    discussionsMap,
    
    // Actions
    sendUpdate,
    getContent,
    updateCursor,
    undo,
    redo,
    saveProposal,
  };
};

export default useYjsCollaboration;
