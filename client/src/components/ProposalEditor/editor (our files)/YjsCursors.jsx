'use client';

/**
 * YjsCursors - Renders remote user cursors using Yjs awareness
 * 
 * This component avoids React state updates for cursor positions to prevent
 * maximum update depth errors. Instead, it uses direct DOM manipulation
 * for cursor rendering, only using React state for user list changes.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getUserColor } from '@/hooks/useYjsCollaboration';

// Role display names mapping
const ROLE_LABELS = {
  'SUPER_ADMIN': 'Admin',
  'CMPDI_MEMBER': 'CMPDI',
  'TSSRC_MEMBER': 'TSSRC',
  'SSRC_MEMBER': 'SSRC',
  'EXPERT_REVIEWER': 'Expert',
  'PI': 'PI',
  'CI': 'CI',
  'USER': 'User',
  'Reviewer': 'Reviewer'
};

/**
 * Individual cursor element rendered via DOM manipulation
 */
const createCursorElement = (user, theme) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const color = user.color || getUserColor(user.id);
  const roleLabel = ROLE_LABELS[user.role] || user.role || 'User';
  
  // Create cursor container
  const cursor = document.createElement('div');
  cursor.className = 'yjs-remote-cursor';
  cursor.setAttribute('data-user-id', user.id);
  cursor.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 50;
    transition: opacity 0.15s ease;
  `;
  
  // Create cursor line
  const line = document.createElement('div');
  line.className = 'cursor-line';
  line.style.cssText = `
    width: 2px;
    height: 20px;
    background-color: ${color};
    border-radius: 1px;
  `;
  
  // Create name label
  const label = document.createElement('div');
  label.className = 'cursor-label';
  label.style.cssText = `
    position: absolute;
    top: -24px;
    left: 0;
    background-color: ${color};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 4px;
  `;
  
  // Add name and role
  const nameSpan = document.createElement('span');
  nameSpan.textContent = user.name || 'Anonymous';
  
  const roleSpan = document.createElement('span');
  roleSpan.style.cssText = `
    opacity: 0.8;
    font-size: 10px;
  `;
  roleSpan.textContent = `(${roleLabel})`;
  
  label.appendChild(nameSpan);
  label.appendChild(roleSpan);
  
  cursor.appendChild(label);
  cursor.appendChild(line);
  
  return cursor;
};

/**
 * Selection highlight element
 */
const createSelectionElement = (color) => {
  const selection = document.createElement('div');
  selection.className = 'yjs-remote-selection';
  selection.style.cssText = `
    position: absolute;
    pointer-events: none;
    background-color: ${color};
    opacity: 0.25;
    border-radius: 2px;
  `;
  return selection;
};

/**
 * YjsCursors component
 * Uses DOM manipulation instead of React state for cursor positions
 */
export function YjsCursors({ awareness, editorRef, theme = 'light', currentUserId }) {
  const containerRef = useRef(null);
  const cursorsRef = useRef(new Map()); // Map of userId -> cursor DOM element
  const selectionsRef = useRef(new Map()); // Map of userId -> selection DOM elements
  const animationFrameRef = useRef(null);
  
  // Only track user list changes in React state (for cleanup)
  const [userIds, setUserIds] = useState([]);
  
  // Update cursor position directly in DOM (no React state)
  const updateCursorPosition = useCallback((userId, cursorData, userData) => {
    if (!containerRef.current || !editorRef?.current || userId === currentUserId) return;
    
    let cursorEl = cursorsRef.current.get(userId);
    
    // Create cursor if it doesn't exist
    if (!cursorEl && userData) {
      cursorEl = createCursorElement(userData, theme);
      containerRef.current.appendChild(cursorEl);
      cursorsRef.current.set(userId, cursorEl);
    }
    
    if (!cursorEl) return;
    
    // Update position using absolute document coordinates
    if (cursorData && cursorData.absoluteX !== undefined && cursorData.absoluteY !== undefined) {
      try {
        const editorElement = editorRef.current.querySelector('[data-slate-editor]');
        if (!editorElement) return;
        
        // Get editor's position relative to container
        const editorRect = editorElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate position within the editor, accounting for scroll
        const x = cursorData.absoluteX + editorRect.left - containerRect.left;
        const y = cursorData.absoluteY + editorRect.top - containerRect.top;
        
        cursorEl.style.left = `${x}px`;
        cursorEl.style.top = `${y}px`;
        cursorEl.style.opacity = '1';
      } catch (e) {
        console.error('[YjsCursors] Error updating cursor position:', e);
        cursorEl.style.opacity = '0';
      }
    } else {
      // Hide cursor when no position data
      cursorEl.style.opacity = '0';
    }
  }, [currentUserId, theme, editorRef]);
  
  // Remove cursor from DOM
  const removeCursor = useCallback((userId) => {
    const cursorEl = cursorsRef.current.get(userId);
    if (cursorEl && cursorEl.parentNode) {
      cursorEl.parentNode.removeChild(cursorEl);
    }
    cursorsRef.current.delete(userId);
    
    // Also remove any selections
    const selections = selectionsRef.current.get(userId);
    if (selections) {
      selections.forEach(sel => {
        if (sel.parentNode) sel.parentNode.removeChild(sel);
      });
    }
    selectionsRef.current.delete(userId);
  }, []);
  
  // Handle awareness changes
  useEffect(() => {
    if (!awareness) return;
    
    const handleAwarenessChange = () => {
      // Cancel any pending frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const states = awareness.getStates();
        const currentUserIds = [];
        
        states.forEach((state, clientId) => {
          if (state.user && state.user.id !== currentUserId) {
            currentUserIds.push(state.user.id);
            updateCursorPosition(state.user.id, state.cursor, state.user);
          }
        });
        
        // Check for removed users (do this infrequently)
        const prevUserIds = Array.from(cursorsRef.current.keys());
        prevUserIds.forEach(userId => {
          if (!currentUserIds.includes(userId)) {
            removeCursor(userId);
          }
        });
        
        // Only update React state if user list changed (for cleanup on unmount)
        setUserIds(prev => {
          const prevStr = prev.sort().join(',');
          const newStr = currentUserIds.sort().join(',');
          return prevStr !== newStr ? currentUserIds : prev;
        });
      });
    };
    
    awareness.on('change', handleAwarenessChange);
    
    // Initial render
    handleAwarenessChange();
    
    return () => {
      awareness.off('change', handleAwarenessChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [awareness, currentUserId, updateCursorPosition, removeCursor]);
  
  // Cleanup all cursors on unmount
  useEffect(() => {
    return () => {
      cursorsRef.current.forEach((_, userId) => removeCursor(userId));
    };
  }, [removeCursor]);
  
  return (
    <div
      ref={containerRef}
      className="yjs-cursors-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 50
      }}
    />
  );
}

/**
 * Hook to broadcast local cursor position via Yjs awareness
 * Uses throttling to prevent excessive updates
 */
export function useYjsCursorBroadcast({ awareness, editorRef, enabled = true }) {
  const lastBroadcastRef = useRef(0);
  const throttleMs = 50; // Throttle to max 20 updates per second
  
  const broadcastCursor = useCallback((selection) => {
    if (!enabled || !awareness || !editorRef?.current) return;
    
    const now = Date.now();
    if (now - lastBroadcastRef.current < throttleMs) return;
    lastBroadcastRef.current = now;
    
    try {
      const currentState = awareness.getLocalState() || {};
      
      if (!selection) {
        // Clear cursor when no selection
        awareness.setLocalStateField('cursor', null);
        return;
      }
      
      // Get editor element for relative positioning
      const editorElement = editorRef.current.querySelector('[data-slate-editor]');
      if (!editorElement) return;
      
      // Get native selection for DOM coordinates
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        awareness.setLocalStateField('cursor', null);
        return;
      }
      
      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorElement.getBoundingClientRect();
      
      // Calculate absolute position within the editor (not relative to viewport)
      // This ensures cursors stay in the correct position even when scrolling
      const absoluteX = rect.left - editorRect.left;
      const absoluteY = rect.top - editorRect.top;
      
      awareness.setLocalStateField('cursor', {
        anchor: selection.anchor,
        focus: selection.focus,
        absoluteX: absoluteX,
        absoluteY: absoluteY
      });
    } catch (e) {
      // Silently fail on cursor broadcast errors
    }
  }, [enabled, awareness, editorRef]);
  
  const clearCursor = useCallback(() => {
    if (!awareness) return;
    awareness.setLocalStateField('cursor', null);
  }, [awareness]);
  
  return { broadcastCursor, clearCursor };
}

export default YjsCursors;
