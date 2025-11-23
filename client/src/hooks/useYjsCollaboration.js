'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { withYjs, YjsEditor } from '@slate-yjs/core';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withPlate } from 'platejs/react';
import { EditorKit } from '@/components/ProposalEditor/editor (plate files)/editor-kit';

/**
 * Yjs Collaboration Hook for Plate.js
 * 
 * Connects to Hocuspocus WebSocket server for real-time CRDT collaboration
 * 
 * @param {Object} options
 * @param {string} options.proposalId - MongoDB proposal ID
 * @param {string} options.formId - Form identifier (main, form-ia, etc.)
 * @param {Object} options.user - Current user object { _id, name, email }
 * @param {string} options.token - JWT authentication token
 * @param {Array} options.initialValue - Initial Plate.js content (optional)
 * 
 * @returns {Object} { editor, provider, connected, synced }
 */
export function useYjsCollaboration({ 
  proposalId, 
  formId, 
  user, 
  token,
  initialValue = [{ type: 'p', children: [{ text: '' }] }]
}) {
  const [provider, setProvider] = useState(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [ydoc] = useState(() => new Y.Doc());

  // Create Yjs provider and connect to Hocuspocus
  useEffect(() => {
    if (!proposalId || !formId || !token) {
      console.warn('⚠️ Yjs disabled: Missing required params', { proposalId, formId, hasToken: !!token });
      // Set mock connected state so editor can still work without collaboration
      setConnected(true);
      setSynced(true);
      return;
    }

    const documentName = `${proposalId}:${formId}`;
    
    // Determine WebSocket URL based on environment
    const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || 'ws://localhost:1234';
    
    console.log(`🔌 Attempting to connect to Yjs: ${documentName} at ${wsUrl}`);

    try {
      const hocuspocusProvider = new HocuspocusProvider({
        url: wsUrl,
        name: documentName,
        document: ydoc,
        token: token,
        
        onStatus: ({ status }) => {
          console.log(`📡 Yjs status: ${status}`);
          setConnected(status === 'connected');
        },

        onSynced: ({ state }) => {
          console.log(`✅ Yjs synced: ${state}`);
          setSynced(state);
        },

        onAuthenticationFailed: ({ reason }) => {
          console.error('❌ Yjs authentication failed:', reason);
          setConnected(false);
        },
      });

      // Set awareness data (user info for cursors/presence)
      if (hocuspocusProvider.awareness) {
        hocuspocusProvider.awareness.setLocalStateField('user', {
          name: user?.name || 'Anonymous',
          email: user?.email || '',
          color: getUserColor(user?._id || 'default'),
        });
      }

      setProvider(hocuspocusProvider);

      // Cleanup on unmount
      return () => {
        console.log(`🔌 Destroying Yjs provider: ${documentName}`);
        hocuspocusProvider.destroy();
      };
    } catch (error) {
      console.error('❌ Failed to initialize Yjs provider:', error);
      // Set mock connected state so editor can still work without collaboration
      setConnected(true);
      setSynced(true);
    }
  }, [proposalId, formId, token, user, ydoc]);

  // Create Plate.js editor with Yjs integration
  const editor = useMemo(() => {
    if (!provider || !ydoc) return null;

    // Get shared Yjs type for collaborative content
    const sharedType = ydoc.get('content', Y.XmlText);

    // Create base Slate editor
    let slateEditor = createEditor();

    // Apply Plate.js plugins
    slateEditor = withPlate(slateEditor, {
      plugins: EditorKit,
      value: initialValue
    });

    // Apply React
    slateEditor = withReact(slateEditor);

    // Apply Yjs collaboration
    slateEditor = withYjs(slateEditor, sharedType, {
      autoConnect: true
    });

    // Connect Yjs editor
    YjsEditor.connect(slateEditor);

    console.log('✅ Plate.js editor created with Yjs');

    return slateEditor;
  }, [provider, ydoc, initialValue]);

  return {
    editor,
    provider,
    connected,
    synced,
    ydoc
  };
}

/**
 * Generate a consistent color for each user based on their ID
 */
function getUserColor(userId) {
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

/**
 * Get awareness state (connected users)
 */
export function useYjsAwareness(provider) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!provider?.awareness) {
      setUsers([]);
      return;
    }

    const updateUsers = () => {
      try {
        const states = Array.from(provider.awareness.getStates().entries());
        const connectedUsers = states
          .filter(([clientId, state]) => clientId !== provider.awareness.clientID)
          .map(([clientId, state]) => ({
            clientId,
            ...state.user
          }));
        
        setUsers(connectedUsers);
      } catch (error) {
        console.error('Error updating awareness users:', error);
        setUsers([]);
      }
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      provider.awareness.off('change', updateUsers);
    };
  }, [provider]);

  return users;
}
