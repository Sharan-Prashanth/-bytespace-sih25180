'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/ProposalEditor/editor (plate files)/editor-kit';
import { Editor, EditorContainer } from '@/components/ui (plate files)/editor';
import { FixedToolbarButtons } from '@/components/ui (plate files)/fixed-toolbar-buttons';
import { FixedToolbar } from '@/components/ui (plate files)/fixed-toolbar';
import { FloatingToolbar } from '@/components/ui (plate files)/floating-toolbar';
import { CollaborateFloatingToolbarButtons } from '@/components/ProposalEditor/editor (our files)/CollaborateFloatingToolbar';
// DISABLED: Remote cursor features - was causing maximum update depth errors
// import { RemoteCursors, useCursorBroadcast } from '@/components/ProposalEditor/editor (our files)/RemoteCursors';
import { TAB_CONFIGS, TAB_DEFAULT_CONTENT } from '@/components/ProposalEditor/proposal-tabs';
import { useToast, ToastContainer } from '@/components/ui (plate files)/toast';
import { useAuth } from '@/context/AuthContext';
// Import both collaboration hooks - Yjs is preferred, Socket.io as fallback
import { useYjsCollaboration, getUserColor } from '@/hooks/useYjsCollaboration';
import { useSocketCollaboration, getUserColor as getSocketUserColor } from '@/hooks/useSocketCollaboration';
import { createUsersData } from '@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit';
import VersionHistory from '@/components/VersionHistory';
import apiClient from '@/utils/api';
import { getInlineDiscussions, saveInlineDiscussions } from '@/utils/commentApi';
// Removed direct Supabase upload - now handled by parent component via backend API

/**
 * AdvancedProposalEditor using Plate.js
 * A modern replacement for the TipTap-based editor with enhanced features
 */
const AdvancedProposalEditor = forwardRef(({
  proposalId = null, // MongoDB proposal ID (for collaboration mode only)
  mode = 'create', // 'create', 'edit', 'collaborate', or 'view'
  initialContent = null, // Initial content provided by parent
  isNewProposal = true, // Whether this is a new proposal (load template) or continuing draft (load from DB)
  signatures = {}, // Signatures object from parent
  onContentChange = () => { },
  onWordCountChange = () => { },
  onCharacterCountChange = () => { },
  onSignatureChange = () => { }, // Callback for signature updates
  onSealChange = () => { }, // Callback for seal updates
  onFormStatusChange = () => { }, // Callback for form completion status
  onManualSave = null, // Callback for manual save button in editor
  onAutoSave = null, // Callback for auto-save from parent
  proposalTitle = 'Research Proposal',
  showStats = true,
  showVersionHistory = false, // Control version history button externally
  onToggleVersionHistory = () => { }, // Callback to toggle version history
  canEdit = true, // Whether user can edit content (PI, CI, Super Admin)
  canSuggest = false, // Whether user is in suggestion mode (Reviewers, Committee Members)
  readOnly = false, // Force read-only mode
  theme = 'light', // Theme prop: 'light', 'dark', 'darkest'
  className = '',
  // Collaboration callbacks - notify parent of Yjs state changes
  onCollaborationStateChange = () => {}, // Called when connection/users change
  onUserJoined = () => {}, // Called when a user joins
  onUserLeft = () => {}, // Called when a user leaves
}, ref) => {
  const { user } = useAuth(); // Get current logged-in user
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [formDataStore, setFormDataStore] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);

  // Ref for editor container (for cursor positioning)
  const editorContainerRef = useRef(null);

  // Theme helper variables
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  // Use signatures from props (parent manages state)
  const headSignature = signatures?.headSignature || null;
  const institutionSeal = signatures?.institutionSeal || null;

  // Upload states for UI feedback
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingSeal, setIsUploadingSeal] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [internalShowVersionHistory, setInternalShowVersionHistory] = useState(false); // Internal state for version history
  const { toasts, removeToast, success, info } = useToast();

  // Extract plain text from Plate.js value - memoized for performance
  const extractPlainText = useCallback((nodes) => {
    if (!nodes || !Array.isArray(nodes)) return '';

    return nodes.map(node => {
      if (node.text !== undefined) return node.text;
      if (node.children) return extractPlainText(node.children);
      return '';
    }).join('');
  }, []);

  // Helper function to filter out invalid image nodes (images with empty URLs)
  // Creates a new array without mutating the original
  const filterInvalidImageNodes = useCallback((nodes) => {
    if (!nodes || !Array.isArray(nodes)) return nodes;
    
    return nodes
      .filter(node => {
        // Filter out image nodes with empty URLs
        if (node.type === 'img' && (!node.url || node.url === '')) {
          console.log('[Editor] Filtering out image node with empty URL');
          return false;
        }
        return true;
      })
      .map(node => {
        // Recursively filter children if they exist (create new object to avoid mutation)
        if (node.children && Array.isArray(node.children)) {
          return {
            ...node,
            children: filterInvalidImageNodes(node.children)
          };
        }
        return node;
      });
  }, []);

  // Use ref to store initial value - computed only once on mount
  const initialValueRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Compute initial value only once
  if (!hasInitializedRef.current) {
    hasInitializedRef.current = true;
    
    let content = null;
    
    // For existing drafts: initialContent comes from database
    if (initialContent) {
      // Check if initialContent has the formi structure (lowercase)
      if (initialContent.formi && initialContent.formi.content && Array.isArray(initialContent.formi.content) && initialContent.formi.content.length > 0) {
        content = initialContent.formi.content;
      }
      // Check if initialContent is the content array directly
      else if (Array.isArray(initialContent) && initialContent.length > 0) {
        content = initialContent;
      }
      // Check if initialContent has formI (uppercase I - from database format)
      else if (initialContent.formI) {
        if (initialContent.formI.editorContent && Array.isArray(initialContent.formI.editorContent) && initialContent.formI.editorContent.length > 0) {
          content = initialContent.formI.editorContent;
        } else if (initialContent.formI.content && Array.isArray(initialContent.formI.content) && initialContent.formI.content.length > 0) {
          content = initialContent.formI.content;
        } else if (Array.isArray(initialContent.formI) && initialContent.formI.length > 0) {
          content = initialContent.formI;
        }
      }
      // Check for nested object structure
      else if (initialContent.content && Array.isArray(initialContent.content) && initialContent.content.length > 0) {
        content = initialContent.content;
      }
      // Check if initialContent is an object with editorContent
      else if (initialContent.editorContent && Array.isArray(initialContent.editorContent) && initialContent.editorContent.length > 0) {
        content = initialContent.editorContent;
      }
    }
    
    // Only use default template content for NEW proposals (isNewProposal === true)
    if (!content && isNewProposal) {
      content = TAB_DEFAULT_CONTENT['formi'] || [{ type: 'p', children: [{ text: '' }] }];
    }
    
    // For existing drafts with no content, show empty editor (not template)
    if (!content) {
      content = [{ type: 'p', children: [{ text: '' }] }];
    }
    
    // Filter out invalid image nodes before storing
    initialValueRef.current = filterInvalidImageNodes(content);
  }

  // Determine editor behavior based on mode and permissions
  // isViewMode: fully read-only - can't interact at all (no selection, no comments)
  // isSuggestionModeActive: can select text and add comments, but NOT type/edit text
  const isSuggestionModeActive = canSuggest && !canEdit;
  const isViewMode = mode === 'view' || readOnly || (!canEdit && !canSuggest);
  
  // For suggestion mode: We set Plate's readOnly to FALSE so that comment/suggestion
  // transforms (setDraft, etc.) can work. But we'll block text input via onKeyDown.
  // For view mode: Full read-only (no transforms at all)
  const editorReadOnly = isViewMode;
  const enableCollaboration = mode === 'collaborate' && !isViewMode;

  // Debug logging for editor permissions
  console.log('[AdvancedProposalEditor] Permission state:', {
    mode,
    canEdit,
    canSuggest,
    readOnly,
    isViewMode,
    isSuggestionModeActive,
    editorReadOnly,
    enableCollaboration
  });

  // Determine display role for current user based on permissions
  // PI/CI is determined by proposal context (canEdit), not user.roles
  // Memoized to prevent unnecessary reconnections
  const displayRole = useMemo(() => {
    const specialRoles = ['SUPER_ADMIN', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'EXPERT_REVIEWER'];
    const userRole = user?.roles?.[0];
    if (specialRoles.includes(userRole)) return userRole;
    if (canEdit) return 'PI'; // PI or CI who can edit
    if (canSuggest) return 'Reviewer';
    return 'USER';
  }, [user?.roles, canEdit, canSuggest]);

  // TEMPORARILY DISABLED: Yjs collaboration causes focus loss issues
  // The awareness state updates trigger React re-renders that steal focus from the editor
  // TODO: Re-enable once proper Yjs-Plate integration is implemented
  const yjsConnected = false;
  const yjsSynced = false;
  const yjsUsers = [];
  const yjsAwareness = null;
  const yjsSendUpdate = useCallback(() => false, []);
  const yjsSaveProposal = useCallback(async () => ({ success: false }), []);
  const yjsError = null;
  
  /*
  const {
    connected: yjsConnected,
    synced: yjsSynced,
    activeUsers: yjsUsers,
    awareness: yjsAwareness,
    sendUpdate: yjsSendUpdate,
    saveProposal: yjsSaveProposal,
    error: yjsError
  } = useYjsCollaboration({
    proposalId: enableCollaboration ? proposalId : null,
    formId: 'formi',
    user: enableCollaboration ? user : null,
    displayRole: enableCollaboration ? displayRole : null,
    enabled: enableCollaboration,
    onContentUpdate: (data) => {
      console.log(`[Yjs] Received content update for form ${data.formId}`);
      setFormDataStore(prev => ({
        ...prev,
        [data.formId]: {
          content: data.editorContent,
          wordCount: prev[data.formId]?.wordCount || 0,
          characterCount: prev[data.formId]?.characterCount || 0
        }
      }));
    },
    onUserJoined: (data) => {
      console.log(`[Yjs] User joined:`, data);
      onUserJoined(data);
    },
    onUserLeft: (data) => {
      console.log(`[Yjs] User left:`, data);
      onUserLeft(data);
    }
  });
  */

  // Notify parent of collaboration state changes
  // Only runs when connection state or user list changes (not on every awareness update)
  useEffect(() => {
    if (enableCollaboration && onCollaborationStateChange) {
      // Include current user in the user list
      const currentUserData = user ? {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: displayRole,
        color: getUserColor(user._id)
      } : null;
      
      // Combine current user with other Yjs users (deduplicated)
      const allUsers = currentUserData 
        ? [currentUserData, ...(yjsUsers || []).filter(u => u.id !== user?._id)]
        : (yjsUsers || []);
      
      onCollaborationStateChange({
        connected: yjsConnected,
        synced: yjsSynced,
        users: allUsers,
        awareness: yjsAwareness
      });
    }
  // Note: yjsAwareness excluded from deps - object reference is stable, only connection/sync/users matter
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableCollaboration, yjsConnected, yjsSynced, yjsUsers, user?._id, onCollaborationStateChange, displayRole]);

  // Socket.io collaboration (fallback when Yjs unavailable)
  const {
    connected: socketConnected,
    activeUsers: socketUsers,
    sendUpdate: socketSendUpdate,
    saveProposal: socketSaveProposal
  } = useSocketCollaboration({
    proposalId: (enableCollaboration && !yjsConnected) ? proposalId : null,
    formId: 'formi',
    user: (enableCollaboration && !yjsConnected) ? user : null,
    enabled: enableCollaboration && !yjsConnected,
    onContentUpdate: (data) => {
      console.log(`[Socket] Received content update for form ${data.formId}`);
      setFormDataStore(prev => ({
        ...prev,
        [data.formId]: {
          content: data.editorContent,
          wordCount: data.wordCount,
          characterCount: data.characterCount
        }
      }));
    },
    onUserJoined: (data) => {
      console.log(`[Socket] User joined: ${data.user?.fullName}`);
    },
    onUserLeft: (data) => {
      console.log(`[Socket] User left: ${data.user?.fullName}`);
    }
  });

  // Unified collaboration state - prefer Yjs, fallback to Socket.io
  const collaborationConnected = yjsConnected || socketConnected;
  const collaborationUsers = yjsConnected ? yjsUsers : socketUsers;
  const sendCollaborationUpdate = yjsConnected ? yjsSendUpdate : socketSendUpdate;
  const saveCollaborationProposal = yjsConnected ? yjsSaveProposal : socketSaveProposal;

  // Create Plate.js editor with Form I content - only recreate on initialContent or isNewProposal changes
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValueRef.current,
  }, [initialContent, isNewProposal]); // Don't include formDataStore to avoid infinite loops

  // Configure discussion and suggestion plugins with current user data
  // This effect runs when the editor is ready
  useEffect(() => {
    if (!editor || !user) return;
    
    const setupPlugins = async () => {
      try {
        // Import the local plugin instances that are actually used in EditorKit
        // These must be imported synchronously at the top of the module to get the same instance
        const { suggestionPlugin } = require('@/components/ProposalEditor/editor (plate files)/plugins/suggestion-kit');
        const { discussionPlugin } = require('@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit');
        
        // Set current user ID for discussion plugin (needed for comments)
        editor.setOption(discussionPlugin, 'currentUserId', user._id);
        
        // Set users data for discussion plugin
        const usersData = {
          [user._id]: {
            id: user._id,
            avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.email || user._id}`,
            name: user.fullName || 'Anonymous',
          }
        };
        editor.setOption(discussionPlugin, 'users', usersData);
        
        // Set current user ID for suggestion plugin (needed for tracking who made suggestions)
        editor.setOption(suggestionPlugin, 'currentUserId', user._id);
        
        // Enable suggestion mode for committee members and experts
        if (isSuggestionModeActive) {
          editor.setOption(suggestionPlugin, 'isSuggesting', true);
          console.log('[Editor] Suggestion mode enabled for reviewer/committee member');
        }
        
        // Load discussions from backend if proposalId exists
        if (proposalId) {
          try {
            const discussionsData = await getInlineDiscussions(proposalId, 'formi');
            if (discussionsData && discussionsData.discussions) {
              editor.setOption(discussionPlugin, 'discussions', discussionsData.discussions);
              console.log('[Editor] Loaded', discussionsData.discussions.length, 'discussions from backend');
            }
          } catch (loadError) {
            console.warn('[Editor] Could not load discussions:', loadError);
            editor.setOption(discussionPlugin, 'discussions', []);
          }
        } else {
          // Initialize empty discussions array for new proposals
          editor.setOption(discussionPlugin, 'discussions', []);
        }
        
        console.log('[Editor] Discussion and suggestion plugins configured with user:', user._id);
      } catch (e) {
        console.warn('[Editor] Could not configure plugins:', e);
      }
    };
    
    setupPlugins();
  }, [editor, user, isSuggestionModeActive, proposalId]);

  // DISABLED: Cursor broadcasting was causing maximum update depth errors
  // The useCursorBroadcast hook and related useEffect are disabled
  // TODO: Implement cursor sync using Yjs cursor plugin instead of manual awareness broadcasting
  /*
  const { broadcastCursor, clearCursor } = useCursorBroadcast({
    awareness: yjsAwareness,
    editorRef: editorContainerRef,
    enabled: enableCollaboration && yjsConnected
  });

  useEffect(() => {
    if (!enableCollaboration || !yjsAwareness || !editorContainerRef.current) return;
    // Cursor broadcasting disabled
  }, [enableCollaboration, yjsAwareness, yjsConnected]);
  */

  // Save current form content to store
  const saveCurrentFormToStore = useCallback(() => {
    if (!editor?.children) return;
    
    const currentContent = editor.children;
    const text = extractPlainText(currentContent);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = text.length;
    
    setFormDataStore(prev => ({
      ...prev,
      'formi': {
        content: currentContent,
        wordCount: words,
        characterCount: chars,
        signature: headSignature,
        seal: institutionSeal,
      }
    }));
    console.log('Saved Form I to store');
  }, [extractPlainText, headSignature, institutionSeal]); // Removed editor, wordCount, characterCount from deps

  // Load saved draft forms when component mounts or initialContent changes
  useEffect(() => {
    const loadDraftForms = async () => {
      console.log('⚙️ AdvancedProposalEditor: loadDraftForms called');
      console.log('⚙️ initialContent:', initialContent);
      console.log('⚙️ initialContent type:', typeof initialContent);
      console.log('⚙️ proposalId:', proposalId);
      console.log('⚙️ mode:', mode);
      
      // First, try to use initialContent if provided (from collaborate page)
      if (initialContent && typeof initialContent === 'object') {
        console.log('🔍 Loading forms from initialContent prop');
        console.log('📋 Available form keys:', Object.keys(initialContent));
        console.log('📋 Full initialContent:', JSON.stringify(initialContent, null, 2));

        const loadedStore = {};

        // Convert database forms object to formDataStore format
        // Database has: { formI: { editorContent: [...], wordCount, ... }, formIA: {...}, ... }
        // We need: { 'formi': { content: [...], wordCount, ... }, 'formia': { ... }, ... }
        Object.keys(initialContent).forEach(formKey => {
          const formData = initialContent[formKey];

          // Skip if formData is null/undefined/empty
          if (!formData) {
            console.log(`⚠️ Form ${formKey} is null or undefined`);
            return;
          }

          console.log(`📄 Processing form ${formKey}:`, {
            hasEditorContent: !!formData.editorContent,
            hasContent: !!formData.content,
            editorContentType: Array.isArray(formData.editorContent) ? 'array' : typeof formData.editorContent,
            editorContentLength: formData.editorContent?.length,
            wordCount: formData.wordCount
          });

          // Convert formI -> formi, formIA -> formia, etc.
          const normalizedKey = formKey.toLowerCase();

          // Get the actual content - prioritize editorContent from database
          const actualContent = formData.editorContent || formData.content || formData;

          // If actualContent is an array (Plate.js nodes), use it directly
          // Otherwise, try to parse it or use empty array
          let parsedContent = [];
          if (Array.isArray(actualContent)) {
            parsedContent = actualContent;
          } else if (typeof actualContent === 'string') {
            try {
              parsedContent = JSON.parse(actualContent);
            } catch (e) {
              console.warn(`Failed to parse content for ${formKey}:`, e);
              parsedContent = [{ type: 'p', children: [{ text: actualContent }] }];
            }
          }

          loadedStore[normalizedKey] = {
            content: parsedContent.length > 0 ? parsedContent : [{ type: 'p', children: [{ text: '' }] }],
            wordCount: formData.wordCount || 0,
            characterCount: formData.characterCount || 0,
            signature: formData.signature || formData.headSignature,
            seal: formData.seal || formData.institutionSeal,
          };

          console.log(`✅ Loaded form ${normalizedKey}:`, {
            contentNodes: loadedStore[normalizedKey].content.length,
            wordCount: loadedStore[normalizedKey].wordCount
          });
        });

        if (Object.keys(loadedStore).length > 0) {
          setFormDataStore(loadedStore);
          console.log('✅ Successfully loaded', Object.keys(loadedStore).length, 'forms:', Object.keys(loadedStore));
          return;
        } else {
          console.warn('⚠️ No forms were loaded from initialContent');
        }
      }

      // Fallback: Load from API if proposalId is provided
      if (!proposalId) return;

      try {
        const response = await apiClient.get(`/api/proposals/${proposalId}`);

        if (response.data.success || response.data.data) {
          const proposal = response.data.data?.proposal || response.data.proposal || response.data;

          if (proposal.forms) {
            const loadedStore = {};

            // Handle forms as object (from database)
            if (typeof proposal.forms === 'object' && !Array.isArray(proposal.forms)) {
              Object.keys(proposal.forms).forEach(formKey => {
                const formData = proposal.forms[formKey];
                if (formData) {
                  const normalizedKey = formKey.toLowerCase();

                  // Get the actual content - prioritize editorContent
                  const actualContent = formData.editorContent || formData.content || formData;
                  let parsedContent = [];
                  if (Array.isArray(actualContent)) {
                    parsedContent = actualContent;
                  } else if (typeof actualContent === 'string') {
                    try {
                      parsedContent = JSON.parse(actualContent);
                    } catch (e) {
                      parsedContent = [{ type: 'p', children: [{ text: actualContent }] }];
                    }
                  }

                  loadedStore[normalizedKey] = {
                    content: parsedContent.length > 0 ? parsedContent : [{ type: 'p', children: [{ text: '' }] }],
                    wordCount: formData.wordCount || 0,
                    characterCount: formData.characterCount || 0,
                    signature: formData.signature || formData.headSignature,
                    seal: formData.seal || formData.institutionSeal,
                  };
                }
              });
            }
            // Handle forms as array (legacy format)
            else if (Array.isArray(proposal.forms)) {
              proposal.forms.forEach(form => {
                if (form.formId) {
                  loadedStore[form.formId] = {
                    content: form.editorContent || [],
                    wordCount: form.wordCount || 0,
                    characterCount: form.characterCount || 0,
                    signature: form.formData?.signature || form.headSignature,
                    seal: form.formData?.seal || form.institutionSeal,
                  };
                }
              });
            }

            if (Object.keys(loadedStore).length > 0) {
              setFormDataStore(loadedStore);
              console.log('Loaded forms from API:', Object.keys(loadedStore));
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft forms:', error);
      }
    };

    loadDraftForms();
  }, [proposalId, initialContent]);

  // Track last word/char counts to avoid unnecessary updates
  const lastStatsRef = useRef({ words: 0, chars: 0 });

  // Real-time word/character count update + collaboration sync
  useEffect(() => {
    if (!editor || !editor.children) return;

    const updateStats = () => {
      try {
        const currentValue = editor.children;
        if (!currentValue || !Array.isArray(currentValue)) return;

        const text = extractPlainText(currentValue);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;

        // Only update state if values actually changed
        if (lastStatsRef.current.words !== words || lastStatsRef.current.chars !== chars) {
          lastStatsRef.current = { words, chars };
          setWordCount(words);
          setCharacterCount(chars);
          onWordCountChange(words);
          onCharacterCountChange(chars);
        }

        // Send real-time update to other collaborators (debounced in hook)
        if (enableCollaboration && collaborationConnected && sendCollaborationUpdate) {
          sendCollaborationUpdate(currentValue, words, chars);
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange, enableCollaboration, collaborationConnected, sendCollaborationUpdate]);

  // Auto-save functionality - calls parent's onAutoSave callback
  useEffect(() => {
    if (!editor || !onAutoSave) return;

    const autoSave = async () => {
      try {
        const currentValue = editor.children;
        if (!currentValue || !Array.isArray(currentValue)) return;

        setIsAutoSaving(true);

        // Calculate word and character count
        const text = extractPlainText(currentValue);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;

        // Update local state
        setWordCount(words);
        setCharacterCount(chars);
        onWordCountChange(words);
        onCharacterCountChange(chars);
        onContentChange(currentValue);

        // Save current form content
        let updatedStore = {};
        setFormDataStore(prev => {
          updatedStore = {
            ...prev,
            'formi': {
              content: currentValue,
              wordCount: words,
              characterCount: chars,
              signature: headSignature,
              seal: institutionSeal,
            }
          };
          return updatedStore;
        });

        console.log('🔄 Auto-saving draft...');

        // Call parent's auto-save handler with updated form data
        await onAutoSave(updatedStore);

        // Update last saved time
        setLastSavedTime(new Date());

        console.log('✅ Auto-saved:', { words, chars, time: new Date().toLocaleTimeString() });
      } catch (error) {
        console.error('❌ Auto-save error:', error);
      } finally {
        setIsAutoSaving(false);
      }
    };

    // Auto-save every 30 seconds
    const interval = setInterval(autoSave, 30000);

    // Initial save after 30 seconds
    const initialTimeout = setTimeout(autoSave, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange, onContentChange, onAutoSave, headSignature, institutionSeal]);

  // Track discussions changes and save to backend
  const lastSavedDiscussionsRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Debounced save function for discussions
  const debouncedSaveDiscussions = useCallback(async () => {
    if (!proposalId || !editor) return;
    
    try {
      const { discussionPlugin } = require('@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit');
      const discussions = editor.getOption(discussionPlugin, 'discussions') || [];
      
      // Only save if discussions have changed
      const discussionsJson = JSON.stringify(discussions);
      if (discussionsJson === lastSavedDiscussionsRef.current) {
        return; // No changes, skip save
      }
      
      console.log('[Editor] Saving', discussions.length, 'discussions to backend');
      const result = await saveInlineDiscussions(proposalId, 'formi', discussions, []);
      
      if (result) {
        lastSavedDiscussionsRef.current = discussionsJson;
        console.log('[Editor] Discussions saved successfully');
      } else {
        console.warn('[Editor] Failed to save discussions - API returned false');
      }
    } catch (error) {
      console.error('[Editor] Failed to save discussions:', error);
    }
  }, [proposalId, editor]);
  
  // Schedule a debounced save when discussions change
  const scheduleSaveDiscussions = useCallback(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save after 2 second debounce
    saveTimeoutRef.current = setTimeout(debouncedSaveDiscussions, 2000);
  }, [debouncedSaveDiscussions]);
  
  // Expose save function for external triggers (like when comment is added)
  useEffect(() => {
    if (!editor) return;
    
    // Store the save function on the editor for comment.jsx to call
    editor._saveDiscussions = scheduleSaveDiscussions;
    
    return () => {
      delete editor._saveDiscussions;
    };
  }, [editor, scheduleSaveDiscussions]);
  
  // Periodically save inline discussions (comments and suggestions) to backend
  useEffect(() => {
    if (!proposalId || !editor) return;
    
    // Save discussions every 10 seconds as backup
    const interval = setInterval(debouncedSaveDiscussions, 10000);
    
    // Save before page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable saving on page close
      try {
        const { discussionPlugin } = require('@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit');
        const discussions = editor.getOption(discussionPlugin, 'discussions') || [];
        if (discussions.length > 0) {
          const token = localStorage.getItem('token');
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
          const data = JSON.stringify({ formId: 'formi', discussions, suggestions: [] });
          navigator.sendBeacon(
            `${apiBaseUrl}/api/proposals/${proposalId}/discussions?token=${token}`,
            new Blob([data], { type: 'application/json' })
          );
          console.log('[Editor] Beacon sent with', discussions.length, 'discussions');
        }
      } catch (e) {
        console.error('[Editor] Beacon save failed:', e);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Initial save after 3 seconds
    const initialSaveTimeout = setTimeout(debouncedSaveDiscussions, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialSaveTimeout);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save one last time on cleanup
      debouncedSaveDiscussions();
    };
  }, [proposalId, editor, debouncedSaveDiscussions]);

  // Handle signature save (base64, will upload on submission)
  const handleSignatureSave = (signatureData) => {
    if (!signatureData) {
      onSignatureChange('headSignature', null);
      // Remove signature from editor
      if (editor) {
        removeSignatureFromEditor();
      }
      return;
    }

    // Store as base64, will upload to S3 on proposal submission
    console.log('Signature data received (base64)');
    onSignatureChange('headSignature', signatureData);

    // Insert signature into editor
    if (editor) {
      insertSignatureIntoEditor(signatureData);
    }

    success('Signature added to document!');
  };

  // Handle seal upload (base64, will upload on submission)
  const handleSealUpload = (sealData) => {
    if (!sealData) {
      onSealChange(null);
      // Remove seal from editor
      if (editor) {
        removeSealFromEditor();
      }
      return;
    }

    // Store as base64, will upload to S3 on proposal submission
    console.log('Seal data received (base64)');
    onSealChange(sealData);

    // Insert seal into editor
    if (editor) {
      insertSealIntoEditor(sealData);
    }

    success('Institution seal added to document!');
  };

  // Save draft to database
  // Draft saving now handled by parent component via onAutoSave and onManualSave callbacks

  // Expose methods to parent component
  // Image uploads now handled by parent via backend API
  useImperativeHandle(ref, () => ({
    getFormData: () => {
      // Always return the current editor content, not just formDataStore
      // This ensures we capture unsaved changes
      if (editor && editor.children) {
        const currentContent = editor.children;
        const text = extractPlainText(currentContent);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;
        
        return {
          formi: {
            content: currentContent,
            wordCount: words,
            characterCount: chars,
            signature: headSignature,
            seal: institutionSeal,
          }
        };
      }
      return formDataStore;
    },
    getEditorContent: () => editor?.children || []
  }));

  // Remove signature from editor
  const removeSignatureFromEditor = useCallback(() => {
    if (!editor) return;

    try {
      const nodes = editor.children;
      const signatureIndices = [];

      // Find signature related nodes (image and label)
      nodes.forEach((node, index) => {
        // Check for signature label text
        if (node.type === 'p' && node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('Signature of Head of Institution') || text.includes('Signature of Head')) {
            signatureIndices.push(index);
          }
        }

        // Check for signature image (base64 or URL)
        // We check for headSignature prop value to find the specific image
        if (node.type === 'img' && node.url &&
          (node.url === headSignature || node.url.startsWith('data:image'))) {
          signatureIndices.push(index);
        }
      });

      // Remove in reverse order to maintain indices
      signatureIndices.reverse().forEach(index => {
        // Must use editor.tf.removeNodes which exists on the Plate editor object
        editor.tf.removeNodes({ at: [index] });
      });
    } catch (error) {
      console.error('Error removing signature from editor:', error);
    }
  }, [editor, headSignature]);

  // Remove seal from editor
  const removeSealFromEditor = useCallback(() => {
    if (!editor) return;

    try {
      const nodes = editor.children;
      const sealIndices = [];

      // Find seal related nodes (image and label)
      nodes.forEach((node, index) => {
        // Check for seal label text
        if (node.type === 'p' && node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('Institution Seal')) {
            sealIndices.push(index);
          }
        }

        // Check for seal image (base64 or URL)
        // We check for institutionSeal prop value to find the specific image
        if (node.type === 'img' && node.url &&
          (node.url === institutionSeal || node.url.startsWith('data:image'))) {
          sealIndices.push(index);
        }
      });

      // Remove in reverse order to maintain indices
      sealIndices.reverse().forEach(index => {
        editor.tf.removeNodes({ at: [index] });
      });
    } catch (error) {
      console.error('Error removing seal from editor:', error);
    }
  }, [editor, institutionSeal]);

  // Remove both signature and seal from editor
  const removeSignatureAndSealFromEditor = useCallback(() => {
    removeSignatureFromEditor();
    removeSealFromEditor();
  }, [removeSignatureFromEditor, removeSealFromEditor]);

  // Insert signature into editor
  const insertSignatureIntoEditor = useCallback((signatureUrl) => {
    if (!editor || !signatureUrl) return;

    try {
      // Remove existing signature if any
      removeSignatureFromEditor();

      const nodes = editor.children;

      // Find insertion point - after "(With seal)" text
      let insertIndex = nodes.length - 1; // Default to the end

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('With seal') || text.includes('(With seal)')) {
            insertIndex = i + 1;
            break;
          }
        }
      }

      const nodesToInsert = [
        {
          type: 'p',
          children: [{ text: '' }]
        },
        {
          type: 'img',
          url: signatureUrl,
          width: 200,
          align: 'right',
          children: [{ text: '' }]
        },
        {
          type: 'p',
          align: 'right',
          children: [{ text: 'Signature of Head of Institution', bold: true }]
        }
      ];

      editor.tf.insertNodes(nodesToInsert, { at: [insertIndex] });
      console.log('Inserted signature node');

    } catch (error) {
      console.error('Error inserting signature into editor:', error);
    }
  }, [editor, removeSignatureFromEditor]);

  // Insert seal into editor
  const insertSealIntoEditor = useCallback((sealUrl) => {
    if (!editor || !sealUrl) return;

    try {
      // Remove existing seal if any
      removeSealFromEditor();

      const nodes = editor.children;

      // Find insertion point - after signature or after "(With seal)" text
      let insertIndex = nodes.length - 1; // Default to the end

      // First try to find after signature or its label
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        // Check for signature label text (inserted last by insertSignatureIntoEditor)
        if (node.type === 'p' && node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('Signature of Head of Institution')) {
            insertIndex = i + 1; // Insert right after the signature label
            break;
          }
        }
        // Fallback: after "(With seal)"
        if (node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('With seal') || text.includes('(With seal)')) {
            insertIndex = i + 1;
          }
        }
      }

      const nodesToInsert = [
        {
          type: 'p',
          children: [{ text: '' }]
        },
        {
          type: 'img',
          url: sealUrl,
          width: 120,
          align: 'right',
          children: [{ text: '' }]
        },
        {
          type: 'p',
          align: 'right',
          children: [{ text: 'Institution Seal', bold: true }]
        }
      ];

      editor.tf.insertNodes(nodesToInsert, { at: [insertIndex] });
      console.log('Inserted seal node');

    } catch (error) {
      console.error('Error inserting seal into editor:', error);
    }
  }, [editor, removeSealFromEditor]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (isManualSaving || !editor?.children) return;

    try {
      setIsManualSaving(true);
      // Ensure current form is saved to store before calling parent save
      saveCurrentFormToStore();

      // Get the current editor content
      const currentContent = editor.children;
      const text = extractPlainText(currentContent);
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const chars = text.length;

      // Get the updated state
      const latestFormDataStore = {
        'formi': {
          content: currentContent,
          wordCount: words,
          characterCount: chars,
          signature: headSignature,
          seal: institutionSeal,
        }
      };

      setFormDataStore(prev => ({
        ...prev,
        ...latestFormDataStore
      }));


      // Call parent's onManualSave if provided
      if (onManualSave) {
        // Wait a tick for state update, or pass the calculated store directly
        await onManualSave(latestFormDataStore);
      }

      setLastSavedTime(new Date());
      success('Draft saved successfully');
    } catch (error) {
      console.error('Manual save error:', error);
    } finally {
      setIsManualSaving(false);
    }
  }, [isManualSaving, saveCurrentFormToStore, onManualSave, success, extractPlainText, headSignature, institutionSeal]);


  // Track last form completion status to avoid unnecessary updates
  const lastFormStatusRef = useRef(null);

  // Check if current form has content
  const checkFormCompletion = useCallback(() => {
    if (!editor || !editor.children) return false;

    const text = extractPlainText(editor.children);
    const hasContent = text.trim().length > 50; // At least 50 characters

    // Only notify parent if status actually changed
    if (onFormStatusChange && lastFormStatusRef.current !== hasContent) {
      lastFormStatusRef.current = hasContent;
      onFormStatusChange('formi', hasContent);
    }

    return hasContent;
  }, [extractPlainText, onFormStatusChange]); // Removed editor from deps - we check it inside

  // Auto-check form completion on content change - debounced
  const formCompletionTimeoutRef = useRef(null);
  useEffect(() => {
    if (!editor || !editor.children) return;

    // Clear previous timeout
    if (formCompletionTimeoutRef.current) {
      clearTimeout(formCompletionTimeoutRef.current);
    }

    formCompletionTimeoutRef.current = setTimeout(() => {
      checkFormCompletion();
    }, 1000); // Debounce by 1 second

    return () => {
      if (formCompletionTimeoutRef.current) {
        clearTimeout(formCompletionTimeoutRef.current);
      }
    };
  }, [checkFormCompletion]); // Only depend on checkFormCompletion, not editor

  // Export to PDF function - exports Form I only
  const handleExportPDF = useCallback(async () => {
    if (isExporting) return;

    // Save current form before exporting
    saveCurrentFormToStore();

    setIsExporting(true);
    setExportProgress(0);

    try {
      info('Preparing Form I for PDF export...', 3000);

      // Import required libraries
      const { default: html2canvas } = await import('html2canvas-pro');
      const jsPDF = await import('jspdf');

      setExportProgress(20);

      // Get the editor container - Plate.js uses data-slate-editor attribute
      // Try multiple selectors for compatibility
      let editorContainer = document.querySelector('[data-slate-editor]');
      if (!editorContainer) {
        editorContainer = document.querySelector('.slate-Editor');
      }
      if (!editorContainer) {
        editorContainer = document.querySelector('[data-plate-editor]');
      }
      if (!editorContainer) {
        // Try to find by class pattern
        editorContainer = document.querySelector('.group\\/editor');
      }
      if (!editorContainer) {
        console.error('Available elements:', {
          slateEditor: document.querySelector('.slate-Editor'),
          dataSlate: document.querySelector('[data-slate-editor]'),
          dataPlate: document.querySelector('[data-plate-editor]'),
          groupEditor: document.querySelector('.group\\/editor')
        });
        throw new Error('Editor content not found. Please ensure the editor is fully loaded.');
      }

      console.log('Found editor container:', editorContainer);
      setExportProgress(30);
      info('Capturing Form I content...', 2000);

      // Create canvas from editor content
      const canvas = await html2canvas(editorContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (document) => {
          const editorElement = document.querySelector('[data-slate-editor]') || document.querySelector('.slate-Editor');
          if (editorElement) {
            // Ensure all images are loaded
            const images = editorElement.querySelectorAll('img');
            images.forEach(img => {
              if (img.src.startsWith('data:')) {
                img.style.maxWidth = '100%';
              }
            });

            // Apply better styling
            Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
              const existingStyle = element.getAttribute('style') || '';
              element.setAttribute(
                'style',
                `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
              );
            });
          }
        },
      });

      setExportProgress(60);

      // Create PDF document
      const pdf = new jsPDF.default({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Form I title
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Form I', 15, 15);

      // Add horizontal line
      pdf.setLineWidth(0.5);
      pdf.line(15, 18, 195, 18);

      // Calculate dimensions to fit A4 page
      const imgWidth = 180; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277; // A4 height minus margins
      let yPosition = 25; // Start below title

      setExportProgress(75);

      // If content is larger than one page, split it
      if (imgHeight > pageHeight - 25) {
        const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 25));
        const contentHeightPerCanvas = imgHeight / pagesNeeded;
        const canvasHeightPerSlice = canvas.height / pagesNeeded;

        for (let i = 0; i < pagesNeeded; i++) {
          if (i > 0) {
            pdf.addPage();
            yPosition = 15;
          }

          const sourceY = canvasHeightPerSlice * i;
          const sourceHeight = canvasHeightPerSlice;

          // Create a temporary canvas for this section
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          // Calculate image height for this page slice in mm
          const pageImgHeight = contentHeightPerCanvas;

          pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 15, yPosition, imgWidth, pageImgHeight);
        }
      } else {
        // Fits on one page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, yPosition, imgWidth, imgHeight);
      }

      setExportProgress(90);

      // Save the PDF
      const filename = `${proposalTitle.replace(/\s+/g, '_')}_Form_I.pdf`;
      pdf.save(filename);

      setExportProgress(100);

      // Show success message
      setTimeout(() => {
        success('Form I exported as PDF!', 3000);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Error exporting PDF. Please try again.');
    }
  }, [saveCurrentFormToStore, proposalTitle, isExporting, success, info]);


  return (
    <>
      <div className={`${isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-200'} rounded-xl shadow-xl p-6 border ${className}`}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} flex items-center`}>
              <div className={`w-8 h-8 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-lg flex items-center justify-center mr-3`}>
                <svg
                  className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              Advanced Proposal Editor
            </h2>

            {/* Collaboration Status - Connection indicator only (online count shown in parent component) */}
            {proposalId && enableCollaboration && (
              <div className="flex items-center gap-3">
                {/* Connection Status - Shows Yjs or Socket.io status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${collaborationConnected
                  ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${collaborationConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`} />
                  {collaborationConnected ? (yjsConnected ? 'Synced' : 'Connected') : 'Disconnected'}
                </div>
              </div>
            )}
          </div>

          {/* Plate.js Editor */}
          <div className={`border rounded-xl min-h-[600px] shadow-inner ${isDarkest ? 'border-neutral-700 bg-neutral-900' : isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <Plate
              key="formi"
              editor={editor}
              readOnly={editorReadOnly}
            >
              {/* Hide fixed toolbar in view mode - show simplified toolbar for suggestion mode */}
              {!isViewMode && !isSuggestionModeActive && (
                <FixedToolbar theme={theme}>
                  <FixedToolbarButtons />
                </FixedToolbar>
              )}

              {/* Simplified toolbar for suggestion mode users */}
              {!isViewMode && isSuggestionModeActive && (
                <div className={`sticky top-0 z-30 px-4 py-2 border-b flex items-center justify-between ${
                  isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Comment Mode
                    </span>
                    <span className={`text-sm hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Select text to add comments
                    </span>
                  </div>
                </div>
              )}

              <EditorContainer className="pt-4 pb-2 relative" theme={theme} ref={editorContainerRef}>
                <Editor
                  variant="default"
                  theme={theme}
                  className={`min-h-[500px] focus:outline-none leading-relaxed pb-4 px-4 ${isDark ? 'text-white' : 'text-black'}`}
                  readOnly={editorReadOnly}
                  onKeyDown={isSuggestionModeActive ? (e) => {
                    // Allow navigation keys, selection keys, and comment shortcut
                    const allowedKeys = [
                      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                      'Home', 'End', 'PageUp', 'PageDown',
                      'Tab', 'Escape',
                      'Shift', 'Control', 'Alt', 'Meta',
                    ];
                    
                    // Allow Ctrl+A (select all), Ctrl+C (copy), Ctrl+Shift+M (comment)
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 'a' || e.key === 'c' || (e.shiftKey && e.key === 'm')) {
                        return; // Allow these shortcuts
                      }
                    }
                    
                    // Block all other keys that would modify content
                    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      console.log('[Editor] Input blocked for committee member - use comments instead');
                    }
                  } : undefined}
                />
                {/* DISABLED: Remote Cursors - was causing maximum update depth errors
                    The awareness listener triggers React state updates that create infinite loops
                    TODO: Re-enable once cursor sync is properly implemented with debouncing
                {enableCollaboration && yjsAwareness && (
                  <RemoteCursors
                    awareness={yjsAwareness}
                    editorRef={editorContainerRef}
                    theme={theme}
                  />
                )}
                */}
              </EditorContainer>

              {/* Floating Toolbar - Shows on text selection */}
              {/* Available for editors (PI/CI) and reviewers (for comments) */}
              {!isViewMode && (
                <FloatingToolbar>
                  <CollaborateFloatingToolbarButtons
                    userRole={user?.roles?.[0] || 'USER'}
                    canEdit={canEdit}
                    canSuggest={canSuggest}
                    theme={theme}
                  />
                </FloatingToolbar>
              )}
            </Plate>
          </div>

          {/* Action Bar with Save and Export - Hide in view mode and suggestion mode */}
          {!isViewMode && !isSuggestionModeActive && (
            <div className={`mt-4 flex items-center justify-between p-4 rounded-lg border ${isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-4">
                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isManualSaving}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isManualSaving
                    ? isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  {isManualSaving ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-4 3v4m-4-2h8m-4 6h.01" />
                    </svg>
                  )}
                  {isManualSaving ? 'Saving...' : 'Save'}
                </button>

                {/* PDF Export Button */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isExporting
                    ? isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting ({Math.round(exportProgress)}%)
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export as PDF
                    </>
                  )}
                </button>

              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-black'}`}>
                  Words: {wordCount} | Chars: {characterCount}
                </span>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-black'}`}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto-save enabled
                  </span>
                  <span>-</span>
                  <span>Last saved: {lastSavedTime ? lastSavedTime.toLocaleTimeString() : 'Not saved yet'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Export Button Only for View Mode and Suggestion Mode */}
          {(isViewMode || isSuggestionModeActive) && (
            <div className={`mt-4 flex items-center justify-center p-4 rounded-lg border ${isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isExporting
                  ? isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting ({Math.round(exportProgress)}%)
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export as PDF
                  </>
                )}
              </button>
            </div>
          )}

          {/* Statistics - Simplified visibility, kept original style for context if needed elsewhere */}


        </div>
      </div>


      {/* Version History Component - Only show if enabled externally */}
      {proposalId && showVersionHistory && (
        <VersionHistory
          proposalId={proposalId}
          formId="formi"
          showVersionHistory={internalShowVersionHistory}
          setShowVersionHistory={setInternalShowVersionHistory}
          showSaarthi={false}
        />
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
});

AdvancedProposalEditor.displayName = 'AdvancedProposalEditor';

export default AdvancedProposalEditor;