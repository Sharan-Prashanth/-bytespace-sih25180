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
  const [formDataStore, setFormDataStore] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);

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

  // Get initial value from formDataStore or use default (only Form I)
  const getInitialValue = useCallback(() => {
    const storedData = formDataStore['formi'];
    if (storedData && storedData.content && storedData.content.length > 0) {
      return storedData.content;
    }
    return TAB_DEFAULT_CONTENT['formi'] || [{ type: 'p', children: [{ text: '' }] }];
  }, [formDataStore]);

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
    formId: enableCollaboration ? 'formi' : null,
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

  // Create Plate.js editor with Form I content
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: getInitialValue(),
  }, [formDataStore]); // Recreate when data changes

  // Save current form content to store
  const saveCurrentFormToStore = useCallback(() => {
    if (editor && editor.children) {
      setFormDataStore(prev => {
        const words = wordCount;
        const chars = characterCount;

        return {
          ...prev,
          'formi': {
            content: editor.children,
            wordCount: words,
            characterCount: chars,
            signature: headSignature,
            seal: institutionSeal,
          }
        };
      });
      console.log('Saved Form I to store');
    }
  }, [editor, wordCount, characterCount, headSignature, institutionSeal]);

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
    getFormData: () => formDataStore,
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
    if (isManualSaving) return;

    try {
      setIsManualSaving(true);
      // Ensure current form is saved to store before calling parent save
      saveCurrentFormToStore();

      // Get the updated state
      let latestFormDataStore = {};
      setFormDataStore(prev => {
        latestFormDataStore = {
          ...prev,
          'formi': {
            content: editor.children,
            wordCount: wordCount,
            characterCount: characterCount,
            signature: headSignature,
            seal: institutionSeal,
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
  }, [isManualSaving, saveCurrentFormToStore, onManualSave, success, editor?.children, wordCount, characterCount, headSignature, institutionSeal]);


  // Check if current form has content
  const checkFormCompletion = useCallback(() => {
    if (!editor || !editor.children) return false;

    const text = extractPlainText(editor.children);
    const hasContent = text.trim().length > 50; // At least 50 characters

    // Notify parent about form status
    if (onFormStatusChange) {
      onFormStatusChange('formi', hasContent);
    }

    return hasContent;
  }, [editor, extractPlainText, onFormStatusChange]);

  // Auto-check form completion on content change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkFormCompletion();
    }, 1000); // Debounce by 1 second

    // Use editor as a dependency if Plate's children aren't directly available outside
    if (!editor) return;

    return () => clearTimeout(timeoutId);
  }, [editor?.children, checkFormCompletion, editor]);

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

      // Get the editor container
      const editorContainer = document.querySelector('.slate-Editor');
      if (!editorContainer) {
        throw new Error('Editor content not found');
      }

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
          const editorElement = document.querySelector('.slate-Editor');
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

          {/* Plate.js Editor */}
          <div className="border border-gray-200 rounded-xl min-h-[600px] bg-white shadow-inner">
            <Plate
              key="formi"
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

          {/* Action Bar with Save and Export - Hidden in view mode */}
          {!isViewMode && (
            <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isManualSaving}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isManualSaving
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
                  {isManualSaving ? 'Saving...' : 'Save'}
                </button>

                {/* PDF Export Button */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isExporting
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
                      Export as PDF
                    </>
                  )}
                </button>

              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Words: {wordCount} | Chars: {characterCount}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto-save enabled
                  </span>
                  <span>•</span>
                  <span>Last saved: {lastSavedTime ? lastSavedTime.toLocaleTimeString() : 'Not saved yet'}</span>
                </div>
              </div>
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