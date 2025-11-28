import React, { useState } from 'react';
import { FiUpload, FiFile, FiX, FiDownload, FiCheck } from 'react-icons/fi';

const AdditionalFormsUpload = ({ forms, onFormUpload, onFormRemove }) => {
  const [uploading, setUploading] = useState({});

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
      // Mock upload to S3
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUrl = `https://s3.bucket.com/proposal-files/${formId}-${Date.now()}.pdf`;
      
      onFormUpload(formId, {
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload form. Please try again.');
    } finally {
      setUploading({ ...uploading, [formId]: false });
    }
  };

  const handleRemove = (formId) => {
    if (confirm('Are you sure you want to remove this form?')) {
      onFormRemove(formId);
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

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Additional Forms</h2>
      <p className="text-black mb-4">
        Please download the templates and upload the filled forms. Forms marked with * are mandatory.
      </p>

      <div className="space-y-3">
        {formConfigs.map((config) => (
          <div key={config.id} className="border border-black/20 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-black">
                  {config.label} - {config.title}
                  {config.mandatory && <span className="text-red-600 ml-1">*</span>}
                  {!config.mandatory && <span className="text-black/50 ml-1 text-sm">(Optional)</span>}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadTemplate(config.pdfTemplate, 'pdf')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-black/20 text-black rounded hover:bg-black/5 transition-colors"
                  title="Download PDF template"
                >
                  <FiDownload className="w-3 h-3" />
                  PDF
                </button>
                <button
                  onClick={() => handleDownloadTemplate(config.docxTemplate, 'docx')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-black/20 text-black rounded hover:bg-black/5 transition-colors"
                  title="Download DOCX template"
                >
                  <FiDownload className="w-3 h-3" />
                  DOCX
                </button>
              </div>
            </div>

            {forms[config.id] ? (
              <div className="flex items-center justify-between bg-black/5 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-black">{forms[config.id].name}</p>
                    <p className="text-xs text-black/60">
                      {formatFileSize(forms[config.id].size)} • Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(config.id)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  title="Remove form"
                >
                  <FiX className="w-4 h-4 text-black" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-black/20 rounded-lg cursor-pointer hover:border-black/40 hover:bg-black/5 transition-all">
                {uploading[config.id] ? (
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
                  onChange={(e) => handleFileUpload(config.id, e)}
                  className="hidden"
                  disabled={uploading[config.id]}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdditionalFormsUpload;
