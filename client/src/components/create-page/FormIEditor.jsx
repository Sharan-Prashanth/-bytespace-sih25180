import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FiUpload, FiFile, FiX, FiRefreshCw, FiZap } from 'react-icons/fi';
import AdvancedProposalEditor from '../ProposalEditor/editor (our files)/AdvancedProposalEditor';
import { uploadFormI, deleteFormI } from '../../utils/proposalApi';
import AlertModal from './AlertModal';
import RemoveFormModal from './RemoveFormModal';
import { TAB_DEFAULT_CONTENT } from '../ProposalEditor/proposal-tabs';
import { fetchPDFAsFile } from '../../utils/autoFillHelpers';

const FormIEditor = forwardRef(({ 
  editorContent,
  uploadedPdf,
  onContentChange, 
  onPdfUpload,
  onPdfRemove,
  onManualSave,
  onAutoSave,
  onBeforePdfUpload,
  lastSavedTime,
  isAutoSaving,
  proposalCode,
  isNewProposal = true,
  theme = 'light'
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionError, setExtractionError] = useState(null);

  // Helper function to normalize table cells - ensures all td/th have borders
  const normalizeTableCells = (content) => {
    if (!content) return content;
    
    const processNode = (node) => {
      if (!node || typeof node !== 'object') return node;
      
      const normalized = { ...node };
      
      // If it's a table cell, ensure it has borders
      if (normalized.type === 'td' || normalized.type === 'th') {
        if (!normalized.borders) {
          normalized.borders = {
            top: { size: 1, style: 'solid', color: '#e5e7eb' },
            right: { size: 1, style: 'solid', color: '#e5e7eb' },
            bottom: { size: 1, style: 'solid', color: '#e5e7eb' },
            left: { size: 1, style: 'solid', color: '#e5e7eb' }
          };
        }
      }
      
      // Recursively process children
      if (normalized.children && Array.isArray(normalized.children)) {
        normalized.children = normalized.children.map(child => processNode(child));
      }
      
      return normalized;
    };
    
    // Handle top-level structure
    if (content.formi && content.formi.content && Array.isArray(content.formi.content)) {
      return {
        ...content,
        formi: {
          ...content.formi,
          content: content.formi.content.map(node => processNode(node))
        }
      };
    }
    
    return content;
  };
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const editorRef = useRef(null);
  
  // Key to force editor re-mount when content is replaced
  const [editorKey, setEditorKey] = useState(0);

  // Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  // Remove Modal State
  const [removeModal, setRemoveModal] = useState({
    isOpen: false,
    isLoading: false
  });

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const innerCardBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200';
  const uploadedFileBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200';
  const hoverBg = isDark ? 'hover:bg-white/5 hover:border-slate-500' : 'hover:bg-slate-100 hover:border-slate-400';
  const spinnerBorder = isDark ? 'border-blue-400/30 border-t-blue-400' : 'border-blue-200 border-t-blue-600';
  const editorHeaderBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200';

  // Helper to show alert modal
  const showAlert = useCallback((title, message, variant = 'info') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      variant
    });
  }, []);

  // Close alert modal
  const closeAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getEditorContent: () => {
      if (editorRef.current && editorRef.current.getEditorContent) {
        return editorRef.current.getEditorContent();
      }
      return null;
    },
    getFormData: () => {
      if (editorRef.current && editorRef.current.getFormData) {
        return editorRef.current.getFormData();
      }
      return null;
    }
  }));

  const handleFormUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    event.target.value = '';

    // Validate PDF format
    if (file.type !== 'application/pdf') {
      showAlert('Invalid File Type', 'Please upload a PDF file.', 'error');
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      showAlert('File Too Large', 'File size must be less than 20MB.', 'error');
      return;
    }

    // Auto-save current editor content before uploading PDF
    if (onBeforePdfUpload) {
      try {
        console.log('[UPLOAD] Auto-saving editor content before PDF upload...');
        const currentProposalCode = await onBeforePdfUpload();
        
        // If we didn't have a proposalCode before, we do now
        if (!proposalCode && currentProposalCode) {
          console.log('[UPLOAD] Proposal saved, got proposalCode:', currentProposalCode);
          // Continue with the upload using the new proposalCode
          await performUpload(file, currentProposalCode);
          return;
        }
      } catch (err) {
        console.error('Failed to save before upload:', err);
        showAlert('Save Failed', 'Failed to save current content. Please try again.', 'error');
        return;
      }
    }

    // If we still don't have proposalCode, show error
    if (!proposalCode) {
      showAlert('Save Required', 'Please fill in the proposal information first. The proposal will be saved automatically.', 'warning');
      return;
    }

    await performUpload(file, proposalCode);
  };

  const handleAutoFill = async () => {
    // Auto-save current editor content before auto-fill
    if (onBeforePdfUpload) {
      try {
        console.log('[AUTO-FILL] Auto-saving editor content before PDF upload...');
        const currentProposalCode = await onBeforePdfUpload();
        
        // If we didn't have a proposalCode before, we do now
        if (!proposalCode && currentProposalCode) {
          console.log('[AUTO-FILL] Proposal saved, got proposalCode:', currentProposalCode);
          await performAutoFill(currentProposalCode);
          return;
        }
      } catch (err) {
        console.error('Failed to save before auto-fill:', err);
        showAlert('Save Failed', 'Failed to save current content. Please try again.', 'error');
        return;
      }
    }

    // If we still don't have proposalCode, show error
    if (!proposalCode) {
      showAlert('Save Required', 'Please fill in the proposal information first. The proposal will be saved automatically.', 'warning');
      return;
    }

    await performAutoFill(proposalCode);
  };

  const performAutoFill = async (code) => {
    setIsAutoFilling(true);
    
    try {
      // Fetch the mock PDF file
      const file = await fetchPDFAsFile('FORM-I-MOCK.pdf', 'FORM-I-MOCK.pdf');
      
      // Upload and extract using the same flow as manual upload
      await performUpload(file, code);
      
    } catch (error) {
      console.error('Auto-fill error:', error);
      showAlert('Auto-Fill Failed', `Failed to auto-fill form: ${error.message || 'Sample file not available.'}`, 'error');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const performUpload = async (file, code) => {
    setIsUploading(true);
    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionError(null);

    let progressInterval = null;

    try {
      // Upload to S3 and extract content via backend API
      console.log('[UPLOAD] Starting upload and extraction process...');
      console.log('[UPLOAD] File:', file.name, 'Size:', file.size, 'bytes');
      
      // Progress animation - slower for better UX even with cached results
      progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 85) {
            return 85; // Cap at 85% until we get response
          }
          return prev + 3; // Slower increments
        });
      }, 400); // Slower interval

      const uploadStartTime = Date.now();
      const response = await uploadFormI(file, code);
      const uploadDuration = Date.now() - uploadStartTime;
      
      console.log(`[UPLOAD] Response received in ${uploadDuration}ms (${(uploadDuration/1000).toFixed(2)}s)`);
      console.log('[UPLOAD] Response:', response);
      
      // Clear interval immediately after response
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Smoothly complete the progress bar
      setExtractionProgress(90);
      await new Promise(resolve => setTimeout(resolve, 100));
      setExtractionProgress(100);

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      // Update parent state with uploaded file info
      const uploadedData = {
        name: response.data.uploadedFile.name,
        url: response.data.uploadedFile.url,
        s3Key: response.data.uploadedFile.s3Key,
        size: response.data.uploadedFile.size,
        uploadedAt: response.data.uploadedFile.uploadedAt
      };
      
      onPdfUpload(uploadedData);

      // Update editor content with extracted content
      if (response.data.extractedContent && onContentChange) {
        console.log('[CONTENT] Processing extracted content...');
        console.log('[CONTENT] Full extracted content:', response.data.extractedContent);
        console.log('[CONTENT] Content type:', Array.isArray(response.data.extractedContent) ? 'Array' : typeof response.data.extractedContent);
        
        // The AI backend returns a raw Slate.js content array like:
        // [{type: 'h1', children: [...]}, {type: 'p', children: [...]}, ...]
        // We need to wrap it in the structure the editor expects: { formi: { content: [...] } }
        
        let wrappedContent;
        
        try {
          if (Array.isArray(response.data.extractedContent)) {
            console.log('[CONTENT] Processing array format (direct Slate.js nodes)');
            console.log(`[CONTENT] Array has ${response.data.extractedContent.length} items`);
            
            // Validate array has proper Slate.js structure
            if (response.data.extractedContent.length > 0) {
              const firstItem = response.data.extractedContent[0];
              console.log('[CONTENT] First item type:', firstItem?.type);
              console.log('[CONTENT] First item has children:', !!firstItem?.children);
              
              // Check if it's a valid Slate.js node
              if (!firstItem?.type || !Array.isArray(firstItem?.children)) {
                throw new Error('Invalid Slate.js node structure in array');
              }
            }
            
            // Ensure the array is valid and has content
            const validContent = response.data.extractedContent.length > 0 
              ? response.data.extractedContent 
              : [{ type: 'p', children: [{ text: '' }] }];
            
            wrappedContent = {
              formi: {
                content: validContent
              }
            };
            console.log('[CONTENT] Wrapped array in formi structure');
            
          } else if (response.data.extractedContent?.formi?.content) {
            console.log('[CONTENT] Using existing formi.content structure');
            // Validate the content exists and is an array
            const content = response.data.extractedContent.formi.content;
            console.log('[CONTENT] formi.content length:', content?.length);
            
            if (!Array.isArray(content) || content.length === 0) {
              throw new Error('Invalid content structure in formi.content');
            }
            wrappedContent = response.data.extractedContent;
            
          } else if (response.data.extractedContent?.content && Array.isArray(response.data.extractedContent.content)) {
            console.log('[CONTENT] Using content property from extraction');
            console.log('[CONTENT] content length:', response.data.extractedContent.content.length);
            
            const validContent = response.data.extractedContent.content.length > 0 
              ? response.data.extractedContent.content 
              : [{ type: 'p', children: [{ text: '' }] }];
            
            wrappedContent = {
              formi: {
                content: validContent
              }
            };
            
          } else if (typeof response.data.extractedContent === 'object') {
            console.log('[CONTENT] Converting unknown object format');
            console.log('[CONTENT] Object keys:', Object.keys(response.data.extractedContent));
            // Try to extract any valid content or create default
            wrappedContent = {
              formi: {
                content: [{ type: 'p', children: [{ text: JSON.stringify(response.data.extractedContent, null, 2) }] }]
              }
            };
          } else {
            throw new Error('Unsupported extraction format');
          }
          
          console.log('[CONTENT] Final wrapped content structure:');
          console.log('[CONTENT] - Has formi:', !!wrappedContent?.formi);
          console.log('[CONTENT] - Has formi.content:', !!wrappedContent?.formi?.content);
          console.log('[CONTENT] - formi.content is array:', Array.isArray(wrappedContent?.formi?.content));
          console.log('[CONTENT] - formi.content length:', wrappedContent?.formi?.content?.length);
          
          // Validate the final structure before passing to editor
          if (!wrappedContent?.formi?.content || !Array.isArray(wrappedContent.formi.content)) {
            console.error('[CONTENT] ERROR: Invalid final structure!');
            throw new Error('Failed to create valid content structure');
          }
          
          if (wrappedContent.formi.content.length === 0) {
            console.error('[CONTENT] WARNING: Content array is empty!');
            throw new Error('Extracted content is empty');
          }
          
          console.log('[CONTENT] Validation passed, normalizing content...');
          
          // Additional normalization: ensure all table cells have borders property
          const normalizedContent = normalizeTableCells(wrappedContent);
          console.log('[CONTENT] Content normalized, updating editor...');
          
          // Update parent state
          onContentChange(normalizedContent);
          
          // Small delay before forcing re-mount to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Force editor to re-mount with new content by changing the key
          setEditorKey(prev => prev + 1);
          
          console.log('[CONTENT] Editor updated successfully');
          
          showAlert(
            'Extraction Complete', 
            'Form I content has been extracted successfully. Please review the content carefully for accuracy and make any necessary corrections. Note: Images from the PDF are not automatically extracted. To add images, use the "Insert" option in the editor toolbar.',
            'success'
          );
        } catch (contentError) {
          console.error('[CONTENT] Processing error:', contentError);
          console.error('[CONTENT] Error stack:', contentError.stack);
          showAlert(
            'Content Processing Error',
            `The PDF was uploaded successfully, but there was an error processing the extracted content: ${contentError.message}. Please fill in the form manually.`,
            'warning'
          );
        }
      } else {
        console.warn('[CONTENT] No extracted content in response or onContentChange not provided');
      }

      setTimeout(() => {
        setIsExtracting(false);
        setExtractionProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload/extraction error:', error);
      
      // Clear progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      let errorMessage = 'Failed to process document.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      setExtractionError(errorMessage);
      
      // If upload succeeded but extraction failed, we still have the file
      if (error.message?.includes('extraction failed') && error.uploadedFile) {
        onPdfUpload(error.uploadedFile);
      }
      
      setIsExtracting(false);
      setExtractionProgress(0);
    } finally {
      setIsUploading(false);
      
      // Final cleanup: ensure interval is cleared
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  };

  // Show remove confirmation modal
  const handleRemoveClick = () => {
    setRemoveModal({
      isOpen: true,
      isLoading: false
    });
  };

  // Handle actual removal after confirmation
  const handleRemoveConfirm = async () => {
    setRemoveModal(prev => ({ ...prev, isLoading: true }));

    try {
      // Call backend to delete the file from storage and DB
      if (proposalCode && uploadedPdf) {
        await deleteFormI(proposalCode);
        console.log('Form I PDF deleted from backend');
      }

      // Call parent remove handler to clear state
      onPdfRemove();
      
      // Reset editor content to default template
      if (onContentChange) {
        const defaultContent = TAB_DEFAULT_CONTENT['formi'] || [{ type: 'p', children: [{ text: '' }] }];
        onContentChange({ 
          formi: { 
            content: defaultContent 
          } 
        });
        
        // Force editor to re-mount with default content
        setEditorKey(prev => prev + 1);
      }
      
      setExtractionError(null);
      setRemoveModal({ isOpen: false, isLoading: false });
      
    } catch (error) {
      console.error('Failed to delete Form I:', error);
      setRemoveModal({ isOpen: false, isLoading: false });
      showAlert('Delete Failed', `Failed to delete file: ${error.message || 'Please try again.'}`, 'error');
    }
  };

  // Close remove modal
  const closeRemoveModal = () => {
    if (!removeModal.isLoading) {
      setRemoveModal({ isOpen: false, isLoading: false });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        theme={theme}
      />

      {/* Remove Confirmation Modal */}
      <RemoveFormModal
        isOpen={removeModal.isOpen}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveConfirm}
        title="Remove Form I PDF"
        message="Are you sure you want to remove the uploaded Form I PDF?"
        warningMessage="This will delete the file from storage and reset the editor content to the default template. Any changes made in the editor will be preserved until you save."
        isLoading={removeModal.isLoading}
        theme={theme}
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-xl font-semibold ${textColor}`}>Form I - Project Proposal</h2>
          <button
            onClick={handleAutoFill}
            disabled={isAutoFilling || isUploading || isExtracting || uploadedPdf}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed' 
                : 'border-slate-300 text-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isAutoFilling ? (
              <>
                <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
                <span className="text-sm">Auto-filling...</span>
              </>
            ) : (
              <>
                <FiZap className="w-4 h-4" />
                <span className="text-sm">Auto-Fill Sample</span>
              </>
            )}
          </button>
        </div>
        <p className={`${mutedText} text-sm mb-4`}>
          You can upload a pre-filled PDF form (the content will be extracted and loaded into the editor) or fill the form directly in the editor below. 
          If you upload a document, you can make minor corrections afterward. 
          <span className="font-medium"> Note: Please upload any images in your document separately and directly into the editor.</span>
        </p>

        {/* Upload Section */}
        <div className={`${innerCardBg} border rounded-lg p-4 mb-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${textColor}`}>Upload Pre-filled Form (Optional)</h3>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/files/proposal-template.docx';
                link.download = 'proposal-template.docx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${isDark ? 'border-slate-600 text-white hover:bg-white/5' : 'border-black text-black hover:bg-black/5'}`}
            >
              <FiFile className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>
          
          {uploadedPdf ? (
            <div className={`flex items-center justify-between ${uploadedFileBg} p-3 rounded-lg border`}>
              <div className="flex items-center gap-3">
                <FiFile className={`w-5 h-5 ${textColor}`} />
                <div>
                  <p className={`text-sm font-medium ${textColor}`}>{uploadedPdf.name}</p>
                  <p className={`text-xs ${mutedText}`}>
                    {formatFileSize(uploadedPdf.size)} - Uploaded
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}>
                    <FiRefreshCw className="w-4 h-4" />
                    <span className="text-sm">Re-upload</span>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFormUpload}
                    className="hidden"
                    disabled={isUploading || isExtracting}
                  />
                </label>
                <button
                  onClick={handleRemoveClick}
                  disabled={isUploading || isExtracting}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'} disabled:opacity-50`}
                  title="Remove form"
                >
                  <FiX className={`w-4 h-4 ${textColor}`} />
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDark ? 'border-slate-600' : 'border-slate-300'} ${hoverBg} ${(isUploading || isAutoFilling) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading || isAutoFilling ? (
                <>
                  <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
                  <span className={`text-sm ${textColor}`}>{isAutoFilling ? 'Auto-filling...' : 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <FiUpload className={`w-4 h-4 ${textColor}`} />
                  <span className={`text-sm ${textColor}`}>Click to upload PDF (max 20 MB)</span>
                </>
              )}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFormUpload}
                className="hidden"
                disabled={isUploading || isExtracting || isAutoFilling}
              />
            </label>
          )}

          {/* Extraction Progress */}
          {isExtracting && (
            <div className={`mt-3 rounded-lg p-3 ${isDark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                  Extracting content from PDF...
                </span>
                <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{extractionProgress}%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-blue-900/50' : 'bg-blue-200'}`}>
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${extractionProgress}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                Please wait while we process your document using AI...
              </p>
            </div>
          )}

          {/* Extraction Error */}
          {extractionError && (
            <div className={`mt-3 rounded-lg p-3 ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-2">
                <FiX className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-red-300' : 'text-red-900'}`}>
                    Extraction Failed
                  </p>
                  <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    {extractionError}
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    The PDF was uploaded successfully. You can manually fill the form below or try uploading again.
                  </p>
                </div>
                <button
                  onClick={() => setExtractionError(null)}
                  className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Section */}
      <div className={`border ${borderColor} rounded-lg overflow-hidden`}>
        <div className={`${editorHeaderBg} px-4 py-2 border-b ${borderColor}`}>
          <span className={`text-sm font-medium ${textColor}`}>Editor</span>
        </div>

        <div style={{ minHeight: '500px' }}>
          <AdvancedProposalEditor
            key={editorKey}
            ref={editorRef}
            mode="create"
            initialContent={editorContent}
            isNewProposal={isNewProposal && !uploadedPdf}
            onContentChange={(data) => {
              if (onContentChange) {
                onContentChange(data);
              }
            }}
            onManualSave={onManualSave}
            onAutoSave={onAutoSave}
            proposalTitle="Form I - Project Proposal"
            showStats={true}
            readOnly={isExtracting}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
});

FormIEditor.displayName = 'FormIEditor';

export default FormIEditor;
