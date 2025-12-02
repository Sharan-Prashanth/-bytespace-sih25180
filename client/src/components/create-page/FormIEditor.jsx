import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FiUpload, FiFile, FiX, FiRefreshCw } from 'react-icons/fi';
import AdvancedProposalEditor from '../ProposalEditor/editor (our files)/AdvancedProposalEditor';
import { uploadFormI, deleteFormI } from '../../utils/proposalApi';

const FormIEditor = forwardRef(({ 
  editorContent,
  uploadedPdf,
  onContentChange, 
  onPdfUpload,
  onPdfRemove,
  onManualSave,
  onAutoSave,
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
  const editorRef = useRef(null);

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

    // Validate PDF format
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be less than 20MB');
      return;
    }

    // Validate proposalCode
    if (!proposalCode) {
      alert('Please save the proposal first before uploading Form I');
      return;
    }

    setIsUploading(true);
    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionError(null);

    try {
      // Upload to S3 and extract content via backend API
      console.log('Uploading Form I PDF and extracting content...');
      
      // Progress animation
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 5;
        });
      }, 300);

      const response = await uploadFormI(file, proposalCode);
      
      clearInterval(progressInterval);
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
        console.log('Full extracted content:', response.data.extractedContent);
        console.log('Content type:', Array.isArray(response.data.extractedContent) ? 'Array' : typeof response.data.extractedContent);
        
        // The AI backend returns a raw Slate.js content array like:
        // [{type: 'h1', children: [...]}, {type: 'p', children: [...]}, ...]
        // We need to wrap it in the structure the editor expects: { formi: { content: [...] } }
        
        if (Array.isArray(response.data.extractedContent)) {
          console.log('✅ Wrapping Slate array in formi structure');
          const wrappedContent = {
            formi: {
              content: response.data.extractedContent
            }
          };
          console.log('Wrapped content:', wrappedContent);
          onContentChange(wrappedContent);
        } else if (response.data.extractedContent.formi) {
          console.log('✅ Using formi content from extraction');
          onContentChange(response.data.extractedContent);
        } else {
          console.log('✅ Using entire extracted structure');
          onContentChange(response.data.extractedContent);
        }
      }

      setTimeout(() => {
        setIsExtracting(false);
        setExtractionProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload/extraction error:', error);
      
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
    }
  };

  const handleRemoveForm = async () => {
    if (!confirm('Are you sure you want to remove the uploaded form? This will clear the editor content and delete the file from storage.')) {
      return;
    }

    try {
      // Call backend to delete the file from storage and DB
      if (proposalCode && uploadedPdf) {
        setIsUploading(true);
        await deleteFormI(proposalCode);
        console.log('Form I PDF deleted from backend');
      }

      // Call parent remove handler to clear state
      onPdfRemove();
      
      // Clear editor content
      if (onContentChange) {
        onContentChange({ formi: { content: [] } });
      }
      
      setExtractionError(null);
    } catch (error) {
      console.error('Failed to delete Form I:', error);
      alert(`Failed to delete file: ${error.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <div className="mb-4">
        <h2 className={`text-xl font-semibold ${textColor} mb-2`}>Form I - Project Proposal</h2>
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
                  onClick={handleRemoveForm}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  title="Remove form"
                >
                  <FiX className={`w-4 h-4 ${textColor}`} />
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDark ? 'border-slate-600' : 'border-slate-300'} ${hoverBg}`}>
              {isUploading ? (
                <>
                  <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
                  <span className={`text-sm ${textColor}`}>Uploading...</span>
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
                disabled={isUploading || isExtracting}
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
            ref={editorRef}
            mode="create"
            initialContent={editorContent}
            isNewProposal={isNewProposal}
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
