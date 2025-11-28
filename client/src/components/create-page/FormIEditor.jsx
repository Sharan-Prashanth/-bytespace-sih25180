import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX, FiRefreshCw } from 'react-icons/fi';
import AdvancedProposalEditor from '../ProposalEditor/editor (our files)/AdvancedProposalEditor';

const FormIEditor = ({ 
  editorContent, 
  onContentChange, 
  onSave,
  lastSavedTime,
  isAutoSaving 
}) => {
  const [uploadedForm, setUploadedForm] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const editorRef = useRef(null);

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

    setIsUploading(true);

    try {
      // Mock upload to S3
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUrl = `https://s3.bucket.com/proposal-files/form-i-${Date.now()}.pdf`;
      
      setUploadedForm({
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });

      // Start extraction process
      setIsExtracting(true);
      setExtractionProgress(0);

      // Mock extraction progress
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock extraction API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted content in Plate.js format
      const extractedContent = [
        {
          type: 'p',
          children: [{ text: 'Extracted content from PDF - Form I' }]
        },
        {
          type: 'p',
          children: [{ text: 'This is a mock extraction. The actual content will be parsed from the uploaded PDF.' }]
        }
      ];

      clearInterval(progressInterval);
      setExtractionProgress(100);

      // Update editor content
      if (onContentChange) {
        onContentChange({ formi: { content: extractedContent } });
      }

      setTimeout(() => {
        setIsExtracting(false);
        setExtractionProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload/extraction error:', error);
      alert('Failed to process document. Please try again.');
      setIsExtracting(false);
      setExtractionProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveForm = async () => {
    if (confirm('Are you sure you want to remove the uploaded form? This will clear the editor content.')) {
      // Mock S3 deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadedForm(null);
      
      // Clear editor content
      if (onContentChange) {
        onContentChange({ formi: { content: [] } });
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-black mb-2">Form I - Project Proposal</h2>
        <p className="text-black/70 text-sm mb-4">
          You can upload a pre-filled PDF form (the content will be extracted and loaded into the editor) or fill the form directly in the editor below. 
          If you upload a document, you can make minor corrections afterward. 
          <span className="font-medium"> Note: Please upload any images in your document separately and directly into the editor.</span>
        </p>

        {/* Upload Section */}
        <div className="bg-black/5 border border-black/10 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-black mb-3">Upload Pre-filled Form (Optional)</h3>
          
          {uploadedForm ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-black/10">
              <div className="flex items-center gap-3">
                <FiFile className="w-5 h-5 text-black" />
                <div>
                  <p className="text-sm font-medium text-black">{uploadedForm.name}</p>
                  <p className="text-xs text-black/60">
                    {formatFileSize(uploadedForm.size)} • Uploaded
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors">
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
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  title="Remove form"
                >
                  <FiX className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-black/20 rounded-lg cursor-pointer hover:border-black/40 hover:bg-white transition-all">
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span className="text-sm text-black">Uploading...</span>
                </>
              ) : (
                <>
                  <FiUpload className="w-4 h-4 text-black" />
                  <span className="text-sm text-black">Click to upload PDF (max 20 MB)</span>
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
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-black">Extracting and parsing content...</span>
                <span className="text-sm font-medium text-black">{extractionProgress}%</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${extractionProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Section */}
      <div className="border border-black/10 rounded-lg overflow-hidden">
        <div className="bg-black/5 px-4 py-2 border-b border-black/10">
          <span className="text-sm font-medium text-black">Editor</span>
        </div>

        <div className="bg-white" style={{ minHeight: '500px' }}>
          <AdvancedProposalEditor
            ref={editorRef}
            mode="create"
            initialContent={editorContent}
            onContentChange={(data) => {
              if (onContentChange) {
                onContentChange(data);
              }
            }}
            proposalTitle="Form I - Project Proposal"
            showStats={true}
            readOnly={isExtracting}
          />
        </div>
      </div>
    </div>
  );
};

export default FormIEditor;
