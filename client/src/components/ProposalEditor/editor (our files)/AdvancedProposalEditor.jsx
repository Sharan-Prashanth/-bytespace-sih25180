'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/ProposalEditor/editor (plate files)/editor-kit';
import { Editor, EditorContainer } from '@/components/ui (plate files)/editor';
import { FixedToolbarButtons } from '@/components/ui (plate files)/fixed-toolbar-buttons';
import { FixedToolbar } from '@/components/ui (plate files)/fixed-toolbar';
import { TAB_CONFIGS, TAB_DEFAULT_CONTENT } from '@/components/ProposalEditor/proposal-tabs';
import { useToast, ToastContainer } from '@/components/ui (plate files)/toast';
import { useAuth } from '@/context/AuthContext';
import { useSocketCollaboration, getUserColor } from '@/hooks/useSocketCollaboration';
import { createUsersData } from '@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit';
import VersionHistory from '@/components/VersionHistory';
import SignaturePad from '@/components/ProposalEditor/editor (our files)/SignaturePad';
import SealUpload from '@/components/ProposalEditor/editor (our files)/SealUpload';
import apiClient from '@/utils/api';
// Removed direct Supabase upload - now handled by parent component via backend API

/**
 * AdvancedProposalEditor using Plate.js
 * A modern replacement for the TipTap-based editor with enhanced features
 */
const AdvancedProposalEditor = forwardRef(({
  proposalId = null, // MongoDB proposal ID (for collaboration mode only)
  mode = 'create', // 'create', 'edit', 'collaborate', or 'view'
  initialContent = null, // Initial content provided by parent
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
  readOnly = false, // Force read-only mode
  className = '',
}, ref) => {
  const { user } = useAuth(); // Get current logged-in user
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState(TAB_CONFIGS[0].id);
  const [formDataStore, setFormDataStore] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use signatures from props (parent manages state)
  const headSignature = signatures?.headSignature || null;
  const institutionSeal = signatures?.institutionSeal || null;
  const projectLeaderSignature = signatures?.projectLeaderSignature || null;
  const projectCoordinatorSignature = signatures?.projectCoordinatorSignature || null;
  const financeOfficerSignature = signatures?.financeOfficerSignature || null;

  // Upload states for UI feedback
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingSeal, setIsUploadingSeal] = useState(false);
  const [isUploadingProjectLeaderSignature, setIsUploadingProjectLeaderSignature] = useState(false);
  const [isUploadingProjectCoordinatorSignature, setIsUploadingProjectCoordinatorSignature] = useState(false);
  const [isUploadingFinanceOfficerSignature, setIsUploadingFinanceOfficerSignature] = useState(false);

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

  // Get initial value from formDataStore or use default
  const getInitialValue = useCallback(() => {
    const storedData = formDataStore[activeTab];
    if (storedData && storedData.content && storedData.content.length > 0) {
      return storedData.content;
    }
    return TAB_DEFAULT_CONTENT[activeTab] || [{ type: 'p', children: [{ text: '' }] }];
  }, [activeTab, formDataStore]);

  // Determine editor behavior based on mode
  const isViewMode = mode === 'view' || readOnly;
  const enableCollaboration = mode === 'collaborate' && !isViewMode;

  const {
    connected: socketConnected,
    activeUsers: collaborationUsers,
    sendUpdate: sendCollaborationUpdate,
    saveProposal: saveCollaborationProposal
  } = useSocketCollaboration({
    proposalId: enableCollaboration ? proposalId : null,
    formId: enableCollaboration ? activeTab : null,
    user: enableCollaboration ? user : null,
    enabled: enableCollaboration,
    onContentUpdate: (data) => {
      // Handle incoming content updates from other users
      console.log(`📥 Received content update for form ${data.formId}`);

      // Update form data store with remote changes
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
      console.log(`👋 User joined: ${data.user.fullName}`);
    },
    onUserLeft: (data) => {
      console.log(`👋 User left: ${data.user.fullName}`);
    }
  });

  // Create Plate.js editor with current tab content
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: getInitialValue(),
  }, [activeTab, formDataStore]); // Recreate when tab or data changes

  // Save current form content to store when switching
  const saveCurrentFormToStore = useCallback(() => {
    if (editor && editor.children) {
      const currentFormId = TAB_CONFIGS[currentStep]?.id;
      if (currentFormId) {
        setFormDataStore(prev => {
          // Use current word/char count from state, not editor.children directly
          const words = wordCount;
          const chars = characterCount;

          return {
            ...prev,
            [currentFormId]: {
              content: editor.children,
              wordCount: words,
              characterCount: chars,
              signature: currentFormId === 'formia' ? headSignature : undefined,
              seal: currentFormId === 'formia' ? institutionSeal : undefined,
            }
          };
        });
        console.log(`Saved ${currentFormId} to store`);
      }
    }
    // Dependency list needs to include states that contribute to the saved data
  }, [editor, currentStep, wordCount, characterCount, headSignature, institutionSeal]);

  // Load saved draft forms when component mounts or initialContent changes
  useEffect(() => {
    const loadDraftForms = async () => {
      // First, try to use initialContent if provided (from collaborate page)
      if (initialContent && typeof initialContent === 'object') {
        console.log('🔍 Loading forms from initialContent prop');
        console.log('📋 Available form keys:', Object.keys(initialContent));

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

  // Load form content from store when step changes
  useEffect(() => {
    const currentFormId = TAB_CONFIGS[currentStep]?.id;
    setActiveTab(currentFormId);

    // Load data from store if it exists
    const storedData = formDataStore[currentFormId];
    if (storedData) {
      setWordCount(storedData.wordCount || 0);
      setCharacterCount(storedData.characterCount || 0);
      console.log(`Loaded ${currentFormId} from store`);
    } else {
      // Reset stats for new form
      setWordCount(0);
      setCharacterCount(0);
    }
    setLastSavedTime(null);
  }, [currentStep, formDataStore]);

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

        setWordCount(words);
        setCharacterCount(chars);
        onWordCountChange(words);
        onCharacterCountChange(chars);

        // Send real-time update to other collaborators (debounced in hook)
        if (enableCollaboration && socketConnected && sendCollaborationUpdate) {
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
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange, enableCollaboration, socketConnected, sendCollaborationUpdate]);

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

        // Save current form content and use the functional form of setFormDataStore
        let updatedStore = {};
        setFormDataStore(prev => {
          const currentFormKey = TAB_CONFIGS[currentStep].id;
          updatedStore = {
            ...prev,
            [currentFormKey]: {
              content: currentValue,
              wordCount: words,
              characterCount: chars,
              signature: currentFormKey === 'formia' ? headSignature : prev[currentFormKey]?.signature,
              seal: currentFormKey === 'formia' ? institutionSeal : prev[currentFormKey]?.seal,
            }
          };
          return updatedStore;
        });

        console.log('🔄 Auto-saving draft with', Object.keys(updatedStore).length, 'forms...');

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
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange, onContentChange, onAutoSave, currentStep, headSignature, institutionSeal]);

  // Handle signature save (base64, will upload on submission)
  const handleSignatureSave = (signatureData) => {
    if (!signatureData) {
      onSignatureChange('headSignature', null);
      // Remove signature from editor
      if (editor && activeTab === 'formia') {
        removeSignatureFromEditor();
      }
      return;
    }

    // Store as base64, will upload to S3 on proposal submission
    console.log('Signature data received (base64)');
    onSignatureChange('headSignature', signatureData);

    // Insert only signature into editor (don't re-insert seal)
    if (editor && activeTab === 'formia') {
      insertSignatureIntoEditor(signatureData);
    }

    success('Signature added to document!');
  };

  // Handle seal upload (base64, will upload on submission)
  const handleSealUpload = (sealData) => {
    if (!sealData) {
      onSealChange(null);
      // Remove seal from editor
      if (editor && activeTab === 'formia') {
        removeSealFromEditor();
      }
      return;
    }

    // Store as base64, will upload to S3 on proposal submission
    console.log('Seal data received (base64)');
    onSealChange(sealData);

    // Insert only seal into editor (don't re-insert signature)
    if (editor && activeTab === 'formia') {
      insertSealIntoEditor(sealData);
    }

    success('Institution seal added to document!');
  };

  // Save draft to database
  // Draft saving now handled by parent component via onAutoSave and onManualSave callbacks

  // Expose methods to parent component
  // Image uploads now handled by parent via backend API
  useImperativeHandle(ref, () => ({
    getFormData: () => formDataStore,
    getEditorContent: () => editor?.children || []
  }));

  // Remove signature from editor
  const removeSignatureFromEditor = useCallback(() => {
    if (!editor || activeTab !== 'formia') return;

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
  }, [editor, activeTab, headSignature]);

  // Remove seal from editor
  const removeSealFromEditor = useCallback(() => {
    if (!editor || activeTab !== 'formia') return;

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
  }, [editor, activeTab, institutionSeal]);

  // Remove both signature and seal from editor
  const removeSignatureAndSealFromEditor = useCallback(() => {
    removeSignatureFromEditor();
    removeSealFromEditor();
  }, [removeSignatureFromEditor, removeSealFromEditor]);

  // Insert signature into editor
  const insertSignatureIntoEditor = useCallback((signatureUrl) => {
    if (!editor || activeTab !== 'formia' || !signatureUrl) return;

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
  }, [editor, activeTab, removeSignatureFromEditor]);

  // Insert additional signatures into editor (Forms IX, X, XI, XII)
  const insertAdditionalSignaturesIntoEditor = useCallback(() => {
    if (!editor || !editor.children) return;

    // Remove ALL existing signature-related nodes first (images and captions)
    const nodes = editor.children;
    const signatureIndices = [];

    nodes.forEach((node, index) => {
      // Check for image nodes with signature data
      if (node.type === 'img' && node.url &&
        (node.url.startsWith('data:image') || node.url.includes('signature'))) {
        signatureIndices.push(index);
      }
      // Check for caption paragraphs
      else if (node.type === 'p' && node.children && node.children.length > 0) {
        const text = node.children.map(c => c.text || '').join('');
        if (text.includes('(Project Leader)') ||
          text.includes('(Project Coordinator)') ||
          text.includes('(Finance Officer)')) {
          signatureIndices.push(index);
        }
      }
    });

    // Remove in reverse order to maintain indices
    signatureIndices.reverse().forEach(index => {
      editor.tf.removeNodes({ at: [index] });
    });

    // Prepare signature nodes to insert
    const signatureNodes = [];

    if (projectLeaderSignature) {
      signatureNodes.push(
        { type: 'p', children: [{ text: '' }] },
        {
          type: 'img',
          url: projectLeaderSignature,
          width: 200,
          height: 100,
          align: 'right',
          alt: 'Project Leader Signature',
          children: [{ text: '' }]
        },
        {
          type: 'p',
          align: 'right',
          children: [{ text: '(Project Leader)', bold: true }]
        }
      );
    }

    if (projectCoordinatorSignature) {
      signatureNodes.push(
        { type: 'p', children: [{ text: '' }] },
        {
          type: 'img',
          url: projectCoordinatorSignature,
          width: 200,
          height: 100,
          align: 'right',
          alt: 'Project Coordinator Signature',
          children: [{ text: '' }]
        },
        {
          type: 'p',
          align: 'right',
          children: [{ text: '(Project Coordinator)', bold: true }]
        }
      );
    }

    if (financeOfficerSignature && (activeTab === 'formxi' || activeTab === 'formxii')) {
      signatureNodes.push(
        { type: 'p', children: [{ text: '' }] },
        {
          type: 'img',
          url: financeOfficerSignature,
          width: 200,
          height: 100,
          align: 'right',
          alt: 'Finance Officer Signature',
          children: [{ text: '' }]
        },
        {
          type: 'p',
          align: 'right',
          children: [{ text: '(Finance Officer)', bold: true }]
        }
      );
    }

    // Insert all signatures at the end
    if (signatureNodes.length > 0) {
      // Find the last actual content node index to insert signatures after it.
      // Simply appending to the end might be appropriate for these forms.
      const endPath = [editor.children.length];
      editor.tf.insertNodes(signatureNodes, { at: endPath });
    }
  }, [editor, activeTab, projectLeaderSignature, projectCoordinatorSignature, financeOfficerSignature]);

  // Remove additional signatures from editor
  const removeAdditionalSignaturesFromEditor = useCallback(() => {
    if (!editor || !editor.children) return;

    const nodes = editor.children;
    const signatureIndices = [];

    nodes.forEach((node, index) => {
      // Check for image nodes with signature URLs
      if (node.type === 'img' && node.url &&
        (node.url.startsWith('data:image') || node.url.includes('signature'))) {
        signatureIndices.push(index);
      }
      // Check for paragraph nodes with signature captions
      else if (node.type === 'p' && node.children && node.children.length > 0) {
        const text = node.children.map(c => c.text || '').join('');
        if (text.includes('(Project Leader)') ||
          text.includes('(Project Coordinator)') ||
          text.includes('(Finance Officer)')) {
          signatureIndices.push(index);
        }
      }
    });

    // Remove in reverse order to maintain indices
    signatureIndices.reverse().forEach(index => {
      editor.tf.removeNodes({ at: [index] });
    });
  }, [editor]);

  // Auto-insert additional signatures when they change
  useEffect(() => {
    if (activeTab === 'formix' || activeTab === 'formx' || activeTab === 'formxi' || activeTab === 'formxii') {
      // Remove existing first to prevent duplicates, then insert
      removeAdditionalSignaturesFromEditor();
      insertAdditionalSignaturesIntoEditor();
    }
  }, [activeTab, projectLeaderSignature, projectCoordinatorSignature, financeOfficerSignature, insertAdditionalSignaturesIntoEditor, removeAdditionalSignaturesFromEditor]);

  // Insert seal into editor
  const insertSealIntoEditor = useCallback((sealUrl) => {
    if (!editor || activeTab !== 'formia' || !sealUrl) return;

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
  }, [editor, activeTab, removeSealFromEditor]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (isManualSaving) return;

    try {
      setIsManualSaving(true);
      // Ensure current form is saved to store before calling parent save
      saveCurrentFormToStore();

      // IMPORTANT: Get the updated state from a functional update to ensure it's fresh
      let latestFormDataStore = {};
      setFormDataStore(prev => {
        const currentFormKey = TAB_CONFIGS[currentStep].id;
        latestFormDataStore = {
          ...prev,
          [currentFormKey]: {
            content: editor.children,
            wordCount: wordCount,
            characterCount: characterCount,
            signature: currentFormKey === 'formia' ? headSignature : prev[currentFormKey]?.signature,
            seal: currentFormKey === 'formia' ? institutionSeal : prev[currentFormKey]?.seal,
          }
        };
        return latestFormDataStore;
      });


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
    // Added editor, wordCount, characterCount to dependency array to ensure the correct values are saved
  }, [isManualSaving, saveCurrentFormToStore, onManualSave, success, currentStep, editor?.children, wordCount, characterCount, headSignature, institutionSeal]);


  // Check if current form has content
  const checkFormCompletion = useCallback(() => {
    if (!editor || !editor.children) return false;

    const text = extractPlainText(editor.children);
    const hasContent = text.trim().length > 50; // At least 50 characters

    // Notify parent about form status using activeTab (not currentStep)
    if (activeTab && onFormStatusChange) {
      onFormStatusChange(activeTab, hasContent);
    }

    return hasContent;
  }, [editor, activeTab, extractPlainText, onFormStatusChange]);

  // Auto-check form completion on content change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkFormCompletion();
    }, 1000); // Debounce by 1 second

    // Use editor as a dependency if Plate's children aren't directly available outside
    if (!editor) return;

    return () => clearTimeout(timeoutId);
  }, [editor?.children, checkFormCompletion, editor]);


  // Navigation handler logic helper
  const saveDraftOnNavigation = useCallback(async () => {
    if (!editor || !onAutoSave) return;

    console.log('💾 Saving draft before navigating...');
    const currentValue = editor.children;
    const text = extractPlainText(currentValue);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = text.length;

    let updatedStore = {};
    setFormDataStore(prev => {
      const currentFormKey = TAB_CONFIGS[currentStep].id;
      updatedStore = {
        ...prev,
        [currentFormKey]: {
          content: currentValue,
          wordCount: words,
          characterCount: chars,
          signature: currentFormKey === 'formia' ? headSignature : prev[currentFormKey]?.signature,
          seal: currentFormKey === 'formia' ? institutionSeal : prev[currentFormKey]?.seal,
        }
      };
      return updatedStore;
    });

    // Await save with the synchronously calculated updatedStore
    await onAutoSave(updatedStore);
  }, [editor, onAutoSave, currentStep, extractPlainText, headSignature, institutionSeal]);


  // Navigate to next step
  const handleNext = useCallback(async () => {
    if (isTransitioning || currentStep === TAB_CONFIGS.length - 1) return;

    try {
      setIsTransitioning(true);
      // Check and update form completion status
      checkFormCompletion();

      // Save draft to database before navigating
      await saveDraftOnNavigation();


      setCurrentStep(prev => prev + 1);
      success('Moving to next form...');

    } catch (error) {
      console.error('❌ Error saving draft on navigation:', error);
    } finally {
      // Add small delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [currentStep, success, isTransitioning, checkFormCompletion, saveDraftOnNavigation]);

  // Navigate to previous step
  const handleBack = useCallback(async () => {
    if (isTransitioning || currentStep === 0) return;

    try {
      setIsTransitioning(true);
      // Check and update form completion status
      checkFormCompletion();

      // Save draft to database before navigating
      await saveDraftOnNavigation();

      setCurrentStep(prev => prev - 1);

    } catch (error) {
      console.error('❌ Error saving draft on navigation:', error);
    } finally {
      // Add small delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentStep, isTransitioning, checkFormCompletion, saveDraftOnNavigation]);

  // Export to PDF function - exports all forms from store
  const handleExportPDF = useCallback(async () => {
    if (isExporting) return;

    // Save current form before exporting
    saveCurrentFormToStore();

    setIsExporting(true);
    setExportProgress(0);

    try {
      info('Preparing all forms for PDF export...', 3000);

      // Import required libraries
      const { default: html2canvas } = await import('html2canvas-pro');
      // const PDFLib = await import('pdf-lib'); // PDFLib is not used
      const jsPDF = await import('jspdf');

      setExportProgress(10);

      // Create PDF document
      const pdf = new jsPDF.default({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let isFirstPage = true;
      const originalTab = activeTab; // Store current tab to restore later

      // Function to render a tab's content to PDF
      const renderTabToPDF = async (tabId, tabLabel) => {
        try {
          // Switch to the tab we want to export
          if (tabId !== activeTab) {
            setActiveTab(tabId);
            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Get the editor container - works for both edit and view modes
          let editorContainer = document.querySelector('.slate-Editor');
          if (!editorContainer) {
            console.warn(`No editor content found for ${tabLabel}`);
            return false;
          }
          console.log(`Found editor container for ${tabLabel}:`, editorContainer);

          // Create canvas from editor content
          const canvas = await html2canvas(editorContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            imageTimeout: 0,
            onclone: (document) => {
              let editorElement = document.querySelector('.slate-Editor');
              if (editorElement) {
                // Ensure all images are loaded
                const images = editorElement.querySelectorAll('img');
                images.forEach(img => {
                  if (img.src.startsWith('data:')) {
                    // Base64 images should work directly
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

          // Add new page if not first
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;

          // Add tab title
          pdf.setFontSize(16);
          pdf.setTextColor(0, 0, 0);
          pdf.text(tabLabel, 15, 15);

          // Add horizontal line
          pdf.setLineWidth(0.5);
          pdf.line(15, 18, 195, 18);

          // Calculate dimensions to fit A4 page
          const imgWidth = 180; // A4 width minus margins
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const pageHeight = 277; // A4 height minus margins

          let yPosition = 25; // Start below title

          // If content is larger than one page, split it
          if (imgHeight > pageHeight - 25) {
            const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 25));
            const contentHeightPerCanvas = imgHeight / pagesNeeded; // Height in mm for one page
            const canvasHeightPerSlice = canvas.height / pagesNeeded; // Height in pixels for one slice

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

          return true;
        } catch (error) {
          console.error(`Error rendering ${tabLabel}:`, error);
          return false;
        }
      };

      // Export all forms from store or initialContent (for view mode)
      for (let i = 0; i < TAB_CONFIGS.length; i++) {
        const tab = TAB_CONFIGS[i];

        // Check formDataStore first, then initialContent (for view mode)
        let formData = formDataStore[tab.id];

        // If not in store and we have initialContent, use that
        if ((!formData || !formData.content) && initialContent && initialContent[tab.id]) {
          const rawContent = initialContent[tab.id].editorContent || initialContent[tab.id].content || initialContent[tab.id];
          let parsedContent = [];
          if (Array.isArray(rawContent)) {
            parsedContent = rawContent;
          } else if (typeof rawContent === 'string') {
            try {
              parsedContent = JSON.parse(rawContent);
            } catch (e) {
              parsedContent = [];
            }
          }

          if (parsedContent.length > 0) {
            formData = { content: parsedContent };
          }
        }

        // Skip if form has no content
        if (!formData || !formData.content || formData.content.length === 0) {
          console.log(`Skipping ${tab.label} - no content`);
          continue;
        }

        setExportProgress(10 + (i / TAB_CONFIGS.length) * 80);
        info(`Exporting ${tab.label}...`, 2000);

        await renderTabToPDF(tab.id, tab.label);

        // Small delay between forms
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExportProgress(95);

      // Restore original tab
      setActiveTab(originalTab);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save the PDF
      pdf.save(`${proposalTitle.replace(/\s+/g, '_')}_Complete_Proposal.pdf`);

      setExportProgress(100);

      // Show success message
      setTimeout(() => {
        success('Complete proposal exported as PDF!', 3000);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Error exporting PDF. Please try again.');
    }
  }, [saveCurrentFormToStore, activeTab, proposalTitle, isExporting, success, info, formDataStore, initialContent]);


  return (
    <>
      <div className={`bg-white rounded-xl shadow-xl p-6 border border-orange-200 ${className}`}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-orange-600"
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

            {/* Collaboration Status */}
            {proposalId && enableCollaboration && (
              <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${socketConnected
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`} />
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </div>

                {/* Connected Users Count */}
                {socketConnected && collaborationUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {collaborationUsers.length} online
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-black">
                Step {currentStep + 1} of {TAB_CONFIGS.length}: {TAB_CONFIGS[currentStep]?.label}
              </h3>
              <span className="text-sm text-gray-600">
                {Math.round(((currentStep + 1) / TAB_CONFIGS.length) * 100)}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / TAB_CONFIGS.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {TAB_CONFIGS.map((tab, index) => (
                <div
                  key={tab.id}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / TAB_CONFIGS.length}%` }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-center font-medium text-black">
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>



          {/* Plate.js Editor */}
          <div className="border border-gray-200 rounded-xl min-h-[600px] bg-white shadow-inner">
            <Plate
              key={activeTab}
              editor={editor}
              readOnly={isViewMode}
            >
              {/* Hide toolbar in view mode */}
              {!isViewMode && (
                <FixedToolbar>
                  <FixedToolbarButtons />
                </FixedToolbar>
              )}

              <EditorContainer className="pt-4 pb-2">
                <Editor
                  variant="default"
                  className="min-h-[500px] focus:outline-none text-black leading-relaxed pb-4 px-4"
                  readOnly={isViewMode}
                />
              </EditorContainer>
            </Plate>
          </div>

          {/* Form IA - Signature and Seal Section - Hidden in view mode */}
          {activeTab === 'formia' && !isViewMode && (
            <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-black flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Official Endorsement Required
                </h3>
                <p className="text-sm text-black mt-1">
                  Please provide the signature of the Head of Institution and the official institution seal as required for Form IA.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Signature Section */}
                <div className="relative">
                  <SignaturePad
                    label="Head of Institution Signature"
                    onSave={handleSignatureSave}
                    value={headSignature}
                    required={true}
                    width={400}
                    height={200}
                  />
                  {isUploadingSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading signature...
                      </div>
                    </div>
                  )}
                </div>

                {/* Seal Section */}
                <div className="relative">
                  <SealUpload
                    label="Institution Seal/Stamp"
                    onUpload={handleSealUpload}
                    value={institutionSeal}
                    required={true}
                    recommendedDimensions={{ width: 200, height: 200 }}
                  />
                  {isUploadingSeal && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading seal...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-black">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>For signature: You can either draw directly or upload a scanned image of your signature on white paper</li>
                      <li>For seal: Upload a clear image of your institution official seal (preferably with transparent background)</li>
                      <li>Once uploaded, signature and seal will automatically appear in the document editor at the correct position</li>
                      <li>Both documents will be securely stored in cloud storage and included in PDF exports</li>
                      <li>You can re-upload or remove signature/seal at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form IX & X - Project Leader and Coordinator Signatures - Hidden in view mode */}
          {(activeTab === 'formix' || activeTab === 'formx') && !isViewMode && (
            <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-black flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Required Signatures
                </h3>
                <p className="text-sm text-black mt-1">
                  This form must be signed by the Project Leader and Project Coordinator.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Project Leader Signature */}
                <div className="relative">
                  <SignaturePad
                    label="Project Leader Signature"
                    onSave={(data) => {
                      setIsUploadingProjectLeaderSignature(true);
                      onSignatureChange('projectLeaderSignature', data);
                      setTimeout(() => setIsUploadingProjectLeaderSignature(false), 1000);
                    }}
                    onRemove={() => {
                      onSignatureChange('projectLeaderSignature', null);
                    }}
                    value={projectLeaderSignature}
                    required={true}
                    width={400}
                    height={200}
                  />
                  {isUploadingProjectLeaderSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading signature...
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Coordinator Signature */}
                <div className="relative">
                  <SignaturePad
                    label="Project Coordinator Signature"
                    onSave={(data) => {
                      setIsUploadingProjectCoordinatorSignature(true);
                      onSignatureChange('projectCoordinatorSignature', data);
                      setTimeout(() => setIsUploadingProjectCoordinatorSignature(false), 1000);
                    }}
                    onRemove={() => {
                      onSignatureChange('projectCoordinatorSignature', null);
                    }}
                    value={projectCoordinatorSignature}
                    required={true}
                    width={400}
                    height={200}
                  />
                  {isUploadingProjectCoordinatorSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading signature...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-black">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>You can either draw directly or upload scanned images of signatures</li>
                      <li>Signatures will be securely stored and included in PDF exports</li>
                      <li>Both signatures must be provided before final submission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form XI & XII - Project Leader, Coordinator & Finance Officer Signatures - Hidden in view mode */}
          {(activeTab === 'formxi' || activeTab === 'formxii') && !isViewMode && (
            <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-black flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Required Signatures
                </h3>
                <p className="text-sm text-black mt-1">
                  This form must be signed by the Project Leader, Project Coordinator, and Finance Officer.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Project Leader Signature */}
                <div className="relative">
                  <SignaturePad
                    label="Project Leader Signature"
                    onSave={(data) => {
                      setIsUploadingProjectLeaderSignature(true);
                      onSignatureChange('projectLeaderSignature', data);
                      setTimeout(() => setIsUploadingProjectLeaderSignature(false), 1000);
                    }}
                    onRemove={() => {
                      onSignatureChange('projectLeaderSignature', null);
                    }}
                    value={projectLeaderSignature}
                    required={true}
                    width={350}
                    height={180}
                  />
                  {isUploadingProjectLeaderSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Coordinator Signature */}
                <div className="relative">
                  <SignaturePad
                    label="Project Coordinator Signature"
                    onSave={(data) => {
                      setIsUploadingProjectCoordinatorSignature(true);
                      onSignatureChange('projectCoordinatorSignature', data);
                      setTimeout(() => setIsUploadingProjectCoordinatorSignature(false), 1000);
                    }}
                    onRemove={() => {
                      onSignatureChange('projectCoordinatorSignature', null);
                    }}
                    value={projectCoordinatorSignature}
                    required={true}
                    width={350}
                    height={180}
                  />
                  {isUploadingProjectCoordinatorSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    </div>
                  )}
                </div>

                {/* Finance Officer Signature */}
                <div className="relative">
                  <SignaturePad
                    label="Finance Officer Signature"
                    onSave={(data) => {
                      setIsUploadingFinanceOfficerSignature(true);
                      onSignatureChange('financeOfficerSignature', data);
                      setTimeout(() => setIsUploadingFinanceOfficerSignature(false), 1000);
                    }}
                    onRemove={() => {
                      onSignatureChange('financeOfficerSignature', null);
                    }}
                    value={financeOfficerSignature}
                    required={true}
                    width={350}
                    height={180}
                  />
                  {isUploadingFinanceOfficerSignature && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-black">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>You can either draw directly or upload scanned images of signatures</li>
                      <li>All three signatures will be securely stored and included in PDF exports</li>
                      <li>All signatures must be provided before final submission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isTransitioning}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${currentStep === 0 || isTransitioning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white text-black border-2 border-orange-500 hover:bg-orange-50 shadow hover:shadow-lg'
                }`}
            >
              {isTransitioning && currentStep > 0 ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
              Back
            </button>

            <div className="flex items-center gap-3">
              {(isSavingDraft || isTransitioning) && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  <span className="font-medium">
                    {isTransitioning ? 'Loading form...' : 'Saving draft...'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep === TAB_CONFIGS.length - 1 || isTransitioning}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${currentStep === TAB_CONFIGS.length - 1 || isTransitioning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                }`}
            >
              {isTransitioning ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Status Bar with Auto-save Indicator, Manual Save, and Export - Hidden in view mode */}
          {!isViewMode && (
            <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                {/* Manual Save Button */}
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isManualSaving || isTransitioning}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isManualSaving || isTransitioning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
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
                  {isManualSaving ? 'Saving...' : 'Manual Save'}
                </button>

                {/* PDF Export Button */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting || isTransitioning}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isExporting || isTransitioning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                      Export PDF
                    </>
                  )}
                </button>

              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span className="font-medium">
                  Words: **{wordCount}** | Chars: **{characterCount}**
                </span>
                <span className="text-xs text-gray-500">
                  Last Saved: **{lastSavedTime ? lastSavedTime.toLocaleTimeString() : 'N/A'}**
                </span>
              </div>
            </div>
          )}

          {/* Statistics - Simplified visibility, kept original style for context if needed elsewhere */}
          {showStats && (
            <div className="mt-8 space-y-6">

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-black mb-2 flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Essential Sections for Coal R&D Proposals
                </h4>
                <div className="grid md:grid-cols-2 gap-2 text-xs text-black">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Title & Abstract
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Funding Method & Scheme
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Principal Implementing Agency
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Sub-Implementing Agency
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Project Leader & Coordinator
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Problem Statement & Research Gap
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Research Objectives & Expected Outcomes
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Research Methodology & Work Plan
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Project Duration & Milestones
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Project Outlay (Rs. in Lakhs) & Budget Breakdown
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Team, Facilities & Collaborations
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Technical Specifications & Data Management
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Risk Assessment & Mitigation
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Dissemination & Impact Plan
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>


      {/* Version History Component - Only show if enabled externally */}
      {proposalId && showVersionHistory && (
        <VersionHistory
          proposalId={proposalId}
          formId={activeTab}
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