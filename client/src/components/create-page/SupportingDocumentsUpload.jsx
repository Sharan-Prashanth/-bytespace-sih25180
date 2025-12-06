import React, { useState, useCallback } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';
import { uploadDocument, deleteDocument } from '../../utils/proposalApi';
import ConfirmationModal from '../ui/ConfirmationModal';
import AlertModal from './AlertModal';

const SupportingDocumentsUpload = ({ documents, onDocumentUpload, onDocumentRemove, proposalCode, theme = 'light' }) => {
  const [uploading, setUploading] = useState({});
  const [removeModal, setRemoveModal] = useState({ isOpen: false, docId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const innerCardBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200';
  const uploadedBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-slate-100';
  const hoverBg = isDark ? 'hover:bg-white/5 hover:border-slate-500' : 'hover:bg-slate-100 hover:border-slate-400';
  const spinnerBorder = isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black';

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

  const documentConfigs = [
    {
      id: 'orgDetails',
      label: 'a) Brief details of the organization / institution',
      mandatory: true
    },
    {
      id: 'infrastructure',
      label: 'b) Details of Infrastructural resources available including R&D set up',
      mandatory: true
    },
    {
      id: 'expertise',
      label: 'c) Details of expertise available, past experience and performance in the proposed field by the organization / institution concerned',
      mandatory: true
    },
    {
      id: 'rdComponent',
      label: 'd) R&D component under the proposed study',
      mandatory: true
    },
    {
      id: 'benefits',
      label: 'e) How the project could be beneficial to the coal industry',
      mandatory: true
    },
    {
      id: 'webSurvey',
      label: 'f) Detailed web survey report for the specific research area',
      mandatory: true
    },
    {
      id: 'researchContent',
      label: 'g) Specific research or development content which is exclusive to the proposal shall be clearly indicated',
      mandatory: true
    },
    {
      id: 'collaboration',
      label: 'h) Brief details of proposed collaboration / tie-up with other agencies, if applicable',
      mandatory: false
    }
  ];

  const handleFileUpload = async (docId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset the input
    event.target.value = '';

    // Validate PDF format
    if (file.type !== 'application/pdf') {
      showAlert('Invalid File Type', 'Please upload a PDF file.', 'error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File Too Large', 'File size must be less than 10MB.', 'error');
      return;
    }

    setUploading({ ...uploading, [docId]: true });

    try {
      // Upload to S3 via backend API
      const response = await uploadDocument(file, proposalCode || 'temp');
      
      onDocumentUpload(docId, {
        name: file.name,
        url: response.data.fileUrl || response.data.url,
        s3Key: response.data.s3Key || response.data.path,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('Upload Failed', `Failed to upload document: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setUploading({ ...uploading, [docId]: false });
    }
  };

  const handleRemoveClick = (docId) => {
    setRemoveModal({ isOpen: true, docId });
  };

  const handleConfirmRemove = async () => {
    const docId = removeModal.docId;
    const document = documents[docId];
    
    if (!document) {
      setRemoveModal({ isOpen: false, docId: null });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete from Supabase storage via backend API
      if (document.s3Key) {
        await deleteDocument(document.s3Key);
      }
      
      // Remove from local state
      onDocumentRemove(docId);
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from local state even if S3 delete fails
      onDocumentRemove(docId);
    } finally {
      setIsDeleting(false);
      setRemoveModal({ isOpen: false, docId: null });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentLabel = (docId) => {
    const config = documentConfigs.find(c => c.id === docId);
    return config?.label || 'Supporting Document';
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

      <h2 className={`text-xl font-semibold ${textColor} mb-2`}>Supporting Documents</h2>
      <p className={`${mutedText} text-sm mb-4`}>
        Please upload the following supporting documents as mentioned in the guidelines. Documents marked with * are mandatory.
      </p>

      <div className="space-y-3">
        {documentConfigs.map((config) => (
          <div key={config.id} className={`border ${innerCardBg} rounded-lg p-4`}>
            <div className="mb-3">
              <h3 className={`text-sm font-medium ${textColor}`}>
                {config.label}
                {config.mandatory && <span className="text-red-500 ml-1">*</span>}
                {!config.mandatory && <span className={`${mutedText} ml-1 text-xs`}>(Optional)</span>}
              </h3>
            </div>

            {documents[config.id] ? (
              <div className={`flex items-center justify-between ${uploadedBg} p-3 rounded-lg border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <FiCheck className={`w-5 h-5 ${textColor}`} />
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{documents[config.id].name}</p>
                    <p className={`text-xs ${mutedText}`}>
                      {formatFileSize(documents[config.id].size)} - Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClick(config.id)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  title="Remove document"
                >
                  <FiX className={`w-4 h-4 ${textColor}`} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDark ? 'border-slate-600' : 'border-slate-300'} ${hoverBg}`}>
                {uploading[config.id] ? (
                  <>
                    <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
                    <span className={`text-sm ${textColor}`}>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUpload className={`w-4 h-4 ${textColor}`} />
                    <span className={`text-sm ${textColor}`}>Click to upload PDF (max 10 MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(config.id, e)}
                  className="hidden"
                  disabled={uploading[config.id]}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, docId: null })}
        onConfirm={handleConfirmRemove}
        title="Remove Document"
        message={`Are you sure you want to remove this supporting document? This will permanently delete the file from storage.`}
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isDeleting}
        theme={theme}
        variant="danger"
      />
    </div>
  );
};

export default SupportingDocumentsUpload;
