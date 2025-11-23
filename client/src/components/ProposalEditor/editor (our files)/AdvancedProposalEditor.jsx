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
import { useYjsCollaboration, useYjsAwareness } from '@/hooks/useYjsCollaboration';
import { createUsersData } from '@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit';
import VersionHistory from '@/components/VersionHistory';
import SignaturePad from '@/components/ProposalEditor/editor (our files)/SignaturePad';
import SealUpload from '@/components/ProposalEditor/editor (our files)/SealUpload';
// Removed direct Supabase upload - now handled by parent component via backend API

/**
 * AdvancedProposalEditor using Plate.js
 * A modern replacement for the TipTap-based editor with enhanced features
 */
const AdvancedProposalEditor = forwardRef(({ 
  proposalId = null, // MongoDB proposal ID (for collaboration mode only)
  mode = 'create', // 'create', 'edit', or 'collaborate'
  initialContent = null, // Initial content provided by parent
  signatures = {}, // Signatures object from parent
  onContentChange = () => {}, 
  onWordCountChange = () => {},
  onCharacterCountChange = () => {},
  onSignatureChange = () => {}, // Callback for signature updates
  onSealChange = () => {}, // Callback for seal updates
  onFormStatusChange = () => {}, // Callback for form completion status
  onManualSave = null, // Callback for manual save button in editor
  onAutoSave = null, // Callback for auto-save from parent
  proposalTitle = 'Research Proposal',
  showStats = true,
  showVersionHistory = false, // Control version history button externally
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

  // Yjs collaboration integration - depends on activeTab to reload for each form
  // Only enable Yjs collaboration on the collaborate page
  const enableCollaboration = mode === 'collaborate';

  const { 
    editor: yjsEditor, 
    provider, 
    connected: yjsConnected, 
    synced: yjsSynced 
  } = useYjsCollaboration({
    proposalId: enableCollaboration ? proposalId : null,
    formId: enableCollaboration ? activeTab : null,
    user: enableCollaboration ? user : null,
    token: enableCollaboration ? token : null,
    initialValue: getInitialValue()
  });

  // Get connected users for awareness
  const connectedUsers = useYjsAwareness(provider) || [];

  // Create local editor with current tab content
  const localEditor = usePlateEditor({
    plugins: EditorKit,
    value: getInitialValue(),
  }, [activeTab, formDataStore]); // Add formDataStore as dependency to recreate when data loads

  // Use Yjs editor only on collaborate page, otherwise use local editor
  const editor = useMemo(() => {
    // For edit page and create page, always use local editor
    if (!enableCollaboration) {
      console.log('📝 Using local editor (collaboration disabled)');
      return localEditor;
    }

    // For collaborate page, use Yjs collaborative editor if available
    if (yjsEditor) {
      try {
        // Configure discussion plugin with real user data
        if (user) {
          const usersData = createUsersData(user, connectedUsers);
          yjsEditor.setOption('discussion', 'currentUserId', user._id);
          yjsEditor.setOption('discussion', 'users', usersData);
        }
        console.log('🤝 Using Yjs collaborative editor');
        return yjsEditor;
      } catch (error) {
        console.error('❌ Error configuring Yjs editor, falling back to local:', error);
        return localEditor;
      }
    }

    // Fallback to local editor
    console.log('📝 Using local editor (Yjs not available)');
    return localEditor;
  }, [enableCollaboration, yjsEditor, user, connectedUsers, localEditor, activeTab]); // Add activeTab dependency

  // Save current form content to store when switching
  const saveCurrentFormToStore = useCallback(() => {
    if (editor && editor.children) {
      const currentFormId = TAB_CONFIGS[currentStep]?.id;
      if (currentFormId) {
        setFormDataStore(prev => ({
          ...prev,
          [currentFormId]: {
            content: editor.children,
            wordCount,
            characterCount,
            signature: currentFormId === 'formia' ? headSignature : undefined,
            seal: currentFormId === 'formia' ? institutionSeal : undefined,
          }
        }));
        console.log(`Saved ${currentFormId} to store`);
      }
    }
  }, [editor, currentStep, wordCount, characterCount, headSignature, institutionSeal]);

  // Load saved draft forms when component mounts
  useEffect(() => {
    const loadDraftForms = async () => {
      if (!proposalId) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/proposals/${proposalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const proposal = data.proposal;
          
          if (proposal.forms && proposal.forms.length > 0) {
            const loadedStore = {};
            proposal.forms.forEach(form => {
              loadedStore[form.formId] = {
                content: form.editorContent || [],
                wordCount: form.wordCount || 0,
                characterCount: form.characterCount || 0,
                signature: form.formData?.signature || form.headSignature,
                seal: form.formData?.seal || form.institutionSeal,
              };
            });
            setFormDataStore(loadedStore);
            console.log('Loaded draft forms:', Object.keys(loadedStore));
          }
        }
      } catch (error) {
        console.error('Error loading draft forms:', error);
      }
    };
    
    loadDraftForms();
  }, [proposalId]);

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

  // Real-time word/character count update
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
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange]);

  // Auto-save functionality - calls parent's onAutoSave callback
  useEffect(() => {
    if (!editor || !editor.children || !onAutoSave) return;

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

        // Save current form to store FIRST
        saveCurrentFormToStore();

        // IMPORTANT: Use updated formDataStore after saving current form
        // Get the updated store by reading from state after saveCurrentFormToStore
        const currentFormKey = TAB_CONFIGS[currentStep].id;
        const updatedStore = {
          ...formDataStore,
          [currentFormKey]: {
            content: currentValue,
            wordCount: words,
            characterCount: chars
          }
        };

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
  }, [editor, extractPlainText, onWordCountChange, onCharacterCountChange, onContentChange, onAutoSave, formDataStore, saveCurrentFormToStore, currentStep]);

  // Handle signature save (base64, will upload on submission)
  const handleSignatureSave = (signatureData) => {
    if (!signatureData) {
      onSignatureChange('headSignature', null);
      // Remove signature from editor
      if (editor && activeTab === 'form-ia') {
        removeSignatureAndSealFromEditor();
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
      if (editor && activeTab === 'form-ia') {
        removeSignatureAndSealFromEditor();
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
        if (node.type === 'img' && node.url && 
            (node.url === headSignature || node.url.startsWith('data:image'))) {
          signatureIndices.push(index);
        }
      });
      
      // Remove in reverse order to maintain indices
      signatureIndices.reverse().forEach(index => {
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
      let insertIndex = nodes.length - 4; // Default to before last few nodes
      
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
      insertAdditionalSignaturesIntoEditor();
    }
  }, [activeTab, projectLeaderSignature, projectCoordinatorSignature, financeOfficerSignature, insertAdditionalSignaturesIntoEditor]);

  // Insert seal into editor
  const insertSealIntoEditor = useCallback((sealUrl) => {
    if (!editor || activeTab !== 'formia' || !sealUrl) return;

    try {
      // Remove existing seal if any
      removeSealFromEditor();

      const nodes = editor.children;
      
      // Find insertion point - after signature or after "(With seal)" text
      let insertIndex = nodes.length - 4; // Default to before last few nodes
      
      // First try to find after signature
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.children && node.children.length > 0) {
          const text = node.children.map(c => c.text || '').join('');
          if (text.includes('Signature of Head')) {
            insertIndex = i + 1;
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
      saveCurrentFormToStore();
      
      // Call parent's onManualSave if provided
      if (onManualSave) {
        await onManualSave(formDataStore);
      }
      
      setLastSavedTime(new Date());
      success('Draft saved successfully');
    } catch (error) {
      console.error('Manual save error:', error);
    } finally {
      setIsManualSaving(false);
    }
  }, [isManualSaving, saveCurrentFormToStore, onManualSave, formDataStore, success]);

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

    return () => clearTimeout(timeoutId);
  }, [editor?.children, checkFormCompletion]);

  // Navigate to next step
  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    
    try {
      setIsTransitioning(true);
      // Check and update form completion status
      checkFormCompletion();
      // Save current form
      saveCurrentFormToStore();
      
      // Save draft to database before navigating
      if (onAutoSave) {
        console.log('💾 Saving draft before navigating to next form...');
        const currentValue = editor.children;
        const text = extractPlainText(currentValue);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;
        
        const currentFormKey = TAB_CONFIGS[currentStep].id;
        const updatedStore = {
          ...formDataStore,
          [currentFormKey]: {
            content: currentValue,
            wordCount: words,
            characterCount: chars
          }
        };
        
        await onAutoSave(updatedStore);
      }
      
      if (currentStep < TAB_CONFIGS.length - 1) {
        setCurrentStep(prev => prev + 1);
        success('Moving to next form...');
      }
    } catch (error) {
      console.error('❌ Error saving draft on navigation:', error);
    } finally {
      // Add small delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [currentStep, saveCurrentFormToStore, success, isTransitioning, checkFormCompletion, onAutoSave, editor, extractPlainText, formDataStore]);

  // Navigate to previous step
  const handleBack = useCallback(async () => {
    if (isTransitioning) return;
    
    try {
      setIsTransitioning(true);
      // Check and update form completion status
      checkFormCompletion();
      saveCurrentFormToStore();
      
      // Save draft to database before navigating
      if (onAutoSave) {
        console.log('💾 Saving draft before navigating to previous form...');
        const currentValue = editor.children;
        const text = extractPlainText(currentValue);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;
        
        const currentFormKey = TAB_CONFIGS[currentStep].id;
        const updatedStore = {
          ...formDataStore,
          [currentFormKey]: {
            content: currentValue,
            wordCount: words,
            characterCount: chars
          }
        };
        
        await onAutoSave(updatedStore);
      }
      
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
    } catch (error) {
      console.error('❌ Error saving draft on navigation:', error);
    } finally {
      // Add small delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentStep, saveCurrentFormToStore, isTransitioning, checkFormCompletion, onAutoSave, editor, extractPlainText, formDataStore]);

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
      const PDFLib = await import('pdf-lib');
      const jsPDF = await import('jspdf');
      
      setExportProgress(10);

      // Create PDF document
      const pdf = new jsPDF.default({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let isFirstPage = true;
      const currentTabIndex = TAB_CONFIGS.findIndex(tab => tab.id === activeTab);

      // Function to render a tab's content to PDF
      const renderTabToPDF = async (tabId, tabLabel) => {
        try {
          // Store current tab
          const originalTab = activeTab;
          
          // Switch to the tab we want to export
          if (tabId !== activeTab) {
            setActiveTab(tabId);
            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Get the editor container
          const editorContainer = document.querySelector('[contenteditable="true"]');
          if (!editorContainer) {
            console.warn(`No editor content found for ${tabLabel}`);
            return false;
          }

          // Create canvas from editor content
          const canvas = await html2canvas(editorContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            imageTimeout: 0,
            onclone: (document) => {
              const editorElement = document.querySelector('[contenteditable="true"]');
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
            
            for (let i = 0; i < pagesNeeded; i++) {
              if (i > 0) {
                pdf.addPage();
                yPosition = 15;
              }
              
              const sourceY = (canvas.height / pagesNeeded) * i;
              const sourceHeight = canvas.height / pagesNeeded;
              const pageImgHeight = (pageHeight - 25) < imgHeight ? (pageHeight - 25) : imgHeight;
              
              // Create a temporary canvas for this section
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvas.width;
              tempCanvas.height = sourceHeight;
              const tempCtx = tempCanvas.getContext('2d');
              tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
              
              pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 15, yPosition, imgWidth, pageImgHeight);
            }
          } else {
            // Fits on one page
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, yPosition, imgWidth, imgHeight);
          }

          // Restore original tab
          if (tabId !== originalTab) {
            setActiveTab(originalTab);
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          return true;
        } catch (error) {
          console.error(`Error rendering ${tabLabel}:`, error);
          return false;
        }
      };

      // Export all forms from store
      for (let i = 0; i < TAB_CONFIGS.length; i++) {
        const tab = TAB_CONFIGS[i];
        const formData = formDataStore[tab.id];
        
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
  }, [activeTab, proposalTitle, isExporting, success, info]);

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
          {proposalId && (
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                yjsConnected 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  yjsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                {yjsConnected ? 'Connected' : 'Disconnected'}
              </div>

              {/* Connected Users Count */}
              {yjsConnected && connectedUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {connectedUsers.length} online
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < currentStep
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
          >
            <FixedToolbar>
              <FixedToolbarButtons />
            </FixedToolbar>
            
            <EditorContainer className="pt-4 pb-2">
              <Editor 
                variant="default"
                className="min-h-[500px] focus:outline-none text-black leading-relaxed pb-4 px-4"
              />
            </EditorContainer>
          </Plate>
        </div>

        {/* Form IA - Signature and Seal Section */}
        {activeTab === 'formia' && (
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

        {/* Form IX & X - Project Leader and Coordinator Signatures */}
        {(activeTab === 'formix' || activeTab === 'formx') && (
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
                    <li>You can either draw directly or upload a scanned image of signatures</li>
                    <li>Signatures will be securely stored and included in PDF exports</li>
                    <li>Both signatures must be provided before final submission</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form XI & XII - Project Leader, Coordinator & Finance Officer Signatures */}
        {(activeTab === 'formxi' || activeTab === 'formxii') && (
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
            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              currentStep === 0 || isTransitioning
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
            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              currentStep === TAB_CONFIGS.length - 1 || isTransitioning
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

        {/* Status Bar with Auto-save Indicator and Manual Save */}
        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-black">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">Auto-save enabled (every 30s)</span>
            </div>
            
            {isAutoSaving ? (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                <span className="font-medium">Auto-saving...</span>
              </div>
            ) : lastSavedTime && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Last saved: {lastSavedTime.toLocaleTimeString()}</span>
              </div>
            )}
            
            {/* Manual Save Button */}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isManualSaving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isManualSaving
                  ? 'bg-gray-300 text-gray-500 cursor-wait'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow hover:shadow-lg'
              }`}
              title="Save draft manually"
            >
              <svg className={`w-4 h-4 ${isManualSaving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {isManualSaving ? 'Saving...' : 'Save Now'}
            </button>

            {/* Prominent Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-lg ${
                isExporting
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 hover:scale-105 hover:shadow-xl'
              }`}
              title="Export proposal as PDF"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                    <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                  </svg>
                  Export as PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Export Loading Modal */}
        {isExporting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn">
              <div className="text-center">
                {/* Animated Icon */}
                <div className="mb-6 relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                    </svg>
                  </div>
                  {/* Spinning Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Generating PDF
                </h3>
                <p className="text-slate-600 mb-6">
                  Please wait while we convert your proposal...
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-orange-600 mb-2 font-semibold">
                    <span>Export Progress</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                      style={{ width: `${exportProgress}%` }}
                    >
                      {/* Animated Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Loading Dots Animation */}
                <div className="flex justify-center space-x-2 mt-6">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg"></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
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
    </>
  );
});

AdvancedProposalEditor.displayName = 'AdvancedProposalEditor';

export default AdvancedProposalEditor;
