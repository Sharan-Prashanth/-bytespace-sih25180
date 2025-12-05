'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Remote Cursor Component
 * Renders a colored cursor with user name for each remote collaborator
 */
export const RemoteCursor = ({ 
  user, 
  position, 
  color,
  theme = 'light'
}) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  
  if (!position || !user) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: position.x || 0,
        top: position.y || 0,
        // No translateY - cursor position is already at the correct location
      }}
    >
      {/* User label - positioned above the cursor */}
      <div
        className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap"
        style={{ 
          backgroundColor: color,
          color: '#fff'
        }}
      >
        {user.name || 'Anonymous'}
        {user.role && user.role !== 'USER' && (
          <span className="ml-1 opacity-80">({formatRole(user.role)})</span>
        )}
      </div>
      {/* Cursor line */}
      <div 
        className="w-0.5 h-5"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

/**
 * Format role for display
 */
const formatRole = (role) => {
  const roleMap = {
    'PI': 'PI',
    'CI': 'CI',
    'EXPERT_REVIEWER': 'Expert',
    'CMPDI_MEMBER': 'CMPDI',
    'TSSRC_MEMBER': 'TSSRC',
    'SSRC_MEMBER': 'SSRC',
    'SUPER_ADMIN': 'Admin'
  };
  return roleMap[role] || role;
};

/**
 * Remote Cursors Container
 * Renders all remote cursors in the editor viewport
 */
export const RemoteCursors = ({ 
  awareness,
  editorRef,
  theme = 'light'
}) => {
  const [remoteCursors, setRemoteCursors] = useState([]);
  const containerRef = useRef(null);
  const throttleRef = useRef(null);

  useEffect(() => {
    if (!awareness) return;

    const handleAwarenessChange = () => {
      // Throttle updates to prevent excessive re-renders
      if (throttleRef.current) return;
      
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        
        const states = awareness.getStates();
        const cursors = [];

        states.forEach((state, clientId) => {
          // Skip local user
          if (clientId === awareness.clientID) return;
          
          if (state.user && state.cursor) {
            cursors.push({
              clientId,
              user: state.user,
              cursor: state.cursor,
              selection: state.selection,
              color: state.user.color || '#6366f1'
            });
          }
        });

        setRemoteCursors(cursors);
      }, 100);
    };

    awareness.on('change', handleAwarenessChange);
    handleAwarenessChange(); // Initial call

    return () => {
      awareness.off('change', handleAwarenessChange);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [awareness]);

  if (remoteCursors.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {remoteCursors.map(({ clientId, user, cursor, color }) => (
        <RemoteCursor
          key={clientId}
          user={user}
          position={cursor}
          color={color}
          theme={theme}
        />
      ))}
    </div>
  );
};

/**
 * Hook to track and broadcast cursor position
 * Call this to update awareness with local cursor position
 * Uses requestAnimationFrame to defer updates and prevent focus stealing
 */
export const useCursorBroadcast = ({ 
  awareness, 
  editorRef,
  enabled = true 
}) => {
  const lastPositionRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const rafIdRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  const broadcastCursor = useCallback((selection) => {
    if (!awareness || !enabled || !editorRef?.current) return;

    // Throttle updates - max once per 150ms
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 150) {
      return;
    }

    // Store the selection for deferred update
    pendingUpdateRef.current = selection;

    // Cancel any pending animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Defer the awareness update to next frame to prevent focus stealing
    rafIdRef.current = requestAnimationFrame(() => {
      try {
        // Get selection coordinates relative to editor
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
          // Clear cursor when no selection - only if we had a position before
          if (lastPositionRef.current !== null) {
            lastPositionRef.current = null;
            lastUpdateTimeRef.current = Date.now();
            const currentState = awareness.getLocalState() || {};
            if (currentState.cursor !== null) {
              awareness.setLocalState({
                ...currentState,
                cursor: null,
                selection: null
              });
            }
          }
          return;
        }

        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        // Calculate position relative to editor
        const cursor = {
          x: rect.left - editorRect.left,
          y: rect.top - editorRect.top
        };

        // Only update if position changed significantly (> 3px)
        if (
          lastPositionRef.current &&
          Math.abs(cursor.x - lastPositionRef.current.x) < 3 &&
          Math.abs(cursor.y - lastPositionRef.current.y) < 3
        ) {
          return;
        }

        lastPositionRef.current = cursor;
        lastUpdateTimeRef.current = Date.now();

        const currentState = awareness.getLocalState() || {};
        const storedSelection = pendingUpdateRef.current;
        awareness.setLocalState({
          ...currentState,
          cursor,
          selection: storedSelection ? {
            anchor: storedSelection.anchor,
            focus: storedSelection.focus
          } : null
        });
      } catch (e) {
        console.warn('[CursorBroadcast] Failed to update cursor:', e);
      }
    });
  }, [awareness, enabled, editorRef]);

  const clearCursor = useCallback(() => {
    if (!awareness) return;
    
    // Cancel any pending updates
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const currentState = awareness.getLocalState() || {};
    awareness.setLocalState({
      ...currentState,
      cursor: null,
      selection: null
    });
    lastPositionRef.current = null;
  }, [awareness]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { broadcastCursor, clearCursor };
};

export default RemoteCursors;
