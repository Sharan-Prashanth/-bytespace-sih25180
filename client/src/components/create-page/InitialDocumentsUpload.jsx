import React, { useState } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';
import { uploadDocument, deleteDocument } from '../../utils/proposalApi';
import ConfirmationModal from '../ui/ConfirmationModal';

const InitialDocumentsUpload = ({ documents, onDocumentUpload, onDocumentRemove, proposalCode, theme = 'light' }) => {
  const [uploading, setUploading] = useState({});
  const [removeModal, setRemoveModal] = useState({ isOpen: false, documentType: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const innerCardBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200';
  const uploadedBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-slate-100';
  const hoverBg = isDark ? 'hover:bg-white/5 hover:border-slate-500' : 'hover:bg-slate-100 hover:border-slate-400';
  const spinnerBorder = isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black';

  const handleFileUpload = async (documentType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate PDF format
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (2MB for covering letter, 10MB for CV)
    const maxSize = documentType === 'coveringLetter' ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = documentType === 'coveringLetter' ? 2 : 10;
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading({ ...uploading, [documentType]: true });

    try {
      // Upload to S3 via backend API
      const response = await uploadDocument(file, proposalCode || 'temp');
      
      onDocumentUpload(documentType, {
        name: file.name,
        url: response.data.fileUrl || response.data.url,
        s3Key: response.data.s3Key || response.data.path, // Store S3 key for deletion
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload document: ${error.message || 'Please try again.'}`);
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const handleRemoveClick = (documentType) => {
    setRemoveModal({ isOpen: true, documentType });
  };

  const handleConfirmRemove = async () => {
    const documentType = removeModal.documentType;
    const document = documents[documentType];
    
    if (!document) {
      setRemoveModal({ isOpen: false, documentType: null });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete from Supabase storage via backend API
      if (document.s3Key) {
        await deleteDocument(document.s3Key);
      }
      
      // Remove from local state
      onDocumentRemove(documentType);
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from local state even if S3 delete fails
      // The file might have been deleted manually or doesn't exist
      onDocumentRemove(documentType);
    } finally {
      setIsDeleting(false);
      setRemoveModal({ isOpen: false, documentType: null });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const documentConfigs = [
    {
      type: 'coveringLetter',
      label: 'Covering Letter',
      description: 'Upload covering letter in PDF format (max 2 MB)',
      maxSize: '2 MB'
    },
    {
      type: 'cv',
      label: 'CV / Resume',
      description: 'Upload CV in PDF format (max 10 MB)',
      maxSize: '10 MB'
    }
  ];

  const getDocumentLabel = (type) => {
    const config = documentConfigs.find(c => c.type === type);
    return config?.label || 'Document';
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <h2 className={`text-xl font-semibold ${textColor} mb-2`}>Initial Documents</h2>
      <p className={`${mutedText} text-sm mb-4`}>Please upload the following documents before proceeding.</p>
      
      <div className="space-y-4">
        {documentConfigs.map((config) => (
          <div key={config.type} className={`border ${innerCardBg} rounded-lg p-4`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${textColor}`}>
                  {config.label} <span className="text-red-500">*</span>
                </h3>
                <p className={`text-sm ${mutedText} mt-1`}>{config.description}</p>
              </div>
            </div>

            {documents[config.type] ? (
              <div className={`flex items-center justify-between ${uploadedBg} p-3 rounded-lg mt-2 border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <FiCheck className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{documents[config.type].name}</p>
                    <p className={`text-xs ${mutedText}`}>
                      {formatFileSize(documents[config.type].size)} - Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClick(config.type)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  title="Remove document"
                >
                  <FiX className={`w-4 h-4 ${textColor}`} />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDark ? 'border-slate-600' : 'border-slate-300'} ${hoverBg}`}>
                  {uploading[config.type] ? (
                    <>
                      <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
                      <span className={`text-sm ${textColor}`}>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload className={`w-4 h-4 ${textColor}`} />
                      <span className={`text-sm ${textColor}`}>Click to upload PDF (max {config.maxSize})</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFileUpload(config.type, e)}
                    className="hidden"
                    disabled={uploading[config.type]}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, documentType: null })}
        onConfirm={handleConfirmRemove}
        title="Remove Document"
        message={`Are you sure you want to remove "${getDocumentLabel(removeModal.documentType)}"? This will permanently delete the file from storage.`}
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isDeleting}
        theme={theme}
        variant="danger"
      />
    </div>
  );
};

export default InitialDocumentsUpload;
