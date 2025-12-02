import React, { useState } from 'react';
import { FiUpload, FiFile, FiX, FiDownload, FiCheck } from 'react-icons/fi';
import { uploadDocument, deleteDocument } from '../../utils/proposalApi';
import ConfirmationModal from '../ui/ConfirmationModal';

const AdditionalFormsUpload = ({ forms, onFormUpload, onFormRemove, proposalCode, theme = 'light' }) => {
  const [uploading, setUploading] = useState({});
  const [removeModal, setRemoveModal] = useState({ isOpen: false, formId: null });
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
  const downloadBtnClass = isDark ? 'border-slate-500 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-black hover:bg-slate-100';

  const formConfigs = [
    {
      id: 'formia',
      label: 'Form IA',
      title: 'Endorsement Form',
      mandatory: true,
      pdfTemplate: 'FORM-IA_NEW',
      docxTemplate: 'FORM-IA_NEW'
    },
    {
      id: 'formix',
      label: 'Form IX',
      title: 'Equipment Details (Already Procured)',
      mandatory: false,
      pdfTemplate: 'FORM-IX_NEW',
      docxTemplate: 'FORM-IX_NEW'
    },
    {
      id: 'formx',
      label: 'Form X',
      title: 'Computer & Software Details',
      mandatory: false,
      pdfTemplate: 'FORM-X_NEW',
      docxTemplate: 'FORM-X_NEW'
    },
    {
      id: 'formxi',
      label: 'Form XI',
      title: 'Manpower Cost (Salary & Wages)',
      mandatory: true,
      pdfTemplate: 'FORM-XI_NEW',
      docxTemplate: 'FORM-XI_NEW'
    },
    {
      id: 'formxii',
      label: 'Form XII',
      title: 'Travel Expenditure (TA/DA)',
      mandatory: true,
      pdfTemplate: 'FORM-XII_NEW',
      docxTemplate: 'FORM-XII_NEW'
    }
  ];

  const handleFileUpload = async (formId, event) => {
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

    setUploading({ ...uploading, [formId]: true });

    try {
      // Upload to S3 via backend API
      const response = await uploadDocument(file, proposalCode || 'temp');
      
      onFormUpload(formId, {
        name: file.name,
        url: response.data.fileUrl || response.data.url,
        s3Key: response.data.s3Key || response.data.path, // Store S3 key for deletion
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload form: ${error.message || 'Please try again.'}`);
    } finally {
      setUploading({ ...uploading, [formId]: false });
    }
  };

  const handleRemoveClick = (formId) => {
    setRemoveModal({ isOpen: true, formId });
  };

  const handleConfirmRemove = async () => {
    const formId = removeModal.formId;
    const form = forms[formId];
    
    if (!form) {
      setRemoveModal({ isOpen: false, formId: null });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete from Supabase storage via backend API
      if (form.s3Key) {
        await deleteDocument(form.s3Key);
      }
      
      // Remove from local state
      onFormRemove(formId);
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from local state even if S3 delete fails
      onFormRemove(formId);
    } finally {
      setIsDeleting(false);
      setRemoveModal({ isOpen: false, formId: null });
    }
  };

  const handleDownloadTemplate = (type, fileType) => {
    const link = document.createElement('a');
    link.href = `/files/${type}.${fileType}`;
    link.download = `${type}.${fileType}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFormLabel = (formId) => {
    const config = formConfigs.find(c => c.id === formId);
    return config ? `${config.label} - ${config.title}` : 'Form';
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <h2 className={`text-xl font-semibold ${textColor} mb-2`}>Additional Forms</h2>
      <p className={`${mutedText} text-sm mb-4`}>
        Please download the templates and upload the filled forms. Forms marked with * are mandatory.
      </p>

      <div className="space-y-3">
        {formConfigs.map((config) => (
          <div key={config.id} className={`border ${innerCardBg} rounded-lg p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`text-base font-semibold ${textColor}`}>
                  {config.label} - {config.title}
                  {config.mandatory && <span className="text-red-500 ml-1">*</span>}
                  {!config.mandatory && <span className={`${mutedText} ml-1 text-sm`}>(Optional)</span>}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadTemplate(config.pdfTemplate, 'pdf')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${downloadBtnClass}`}
                  title="Download PDF template"
                >
                  <FiDownload className="w-3 h-3" />
                  PDF
                </button>
                <button
                  onClick={() => handleDownloadTemplate(config.docxTemplate, 'docx')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${downloadBtnClass}`}
                  title="Download DOCX template"
                >
                  <FiDownload className="w-3 h-3" />
                  DOCX
                </button>
              </div>
            </div>

            {forms[config.id] ? (
              <div className={`flex items-center justify-between ${uploadedBg} p-3 rounded-lg border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <FiCheck className={`w-5 h-5 ${textColor}`} />
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{forms[config.id].name}</p>
                    <p className={`text-xs ${mutedText}`}>
                      {formatFileSize(forms[config.id].size)} - Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClick(config.id)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  title="Remove form"
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
                    <span className={`text-sm ${textColor}`}>Click to upload PDF (max 20 MB)</span>
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
        onClose={() => setRemoveModal({ isOpen: false, formId: null })}
        onConfirm={handleConfirmRemove}
        title="Remove Form"
        message={`Are you sure you want to remove "${getFormLabel(removeModal.formId)}"? This will permanently delete the file from storage.`}
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isDeleting}
        theme={theme}
        variant="danger"
      />
    </div>
  );
};

export default AdditionalFormsUpload;
