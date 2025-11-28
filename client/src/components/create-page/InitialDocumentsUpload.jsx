import React, { useState } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';

const InitialDocumentsUpload = ({ documents, onDocumentUpload, onDocumentRemove }) => {
  const [uploading, setUploading] = useState({});

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
      // Mock upload to S3 - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock S3 URL
      const mockUrl = `https://s3.bucket.com/proposal-files/${documentType}-${Date.now()}.pdf`;
      
      onDocumentUpload(documentType, {
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const handleRemove = (documentType) => {
    if (confirm('Are you sure you want to remove this document?')) {
      onDocumentRemove(documentType);
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

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Initial Documents</h2>
      <p className="text-black mb-4">Please upload the following documents before proceeding.</p>
      
      <div className="space-y-4">
        {documentConfigs.map((config) => (
          <div key={config.type} className="border border-black/20 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-black">
                  {config.label} <span className="text-red-600">*</span>
                </h3>
                <p className="text-sm text-black/60 mt-1">{config.description}</p>
              </div>
            </div>

            {documents[config.type] ? (
              <div className="flex items-center justify-between bg-black/5 p-3 rounded-lg mt-2">
                <div className="flex items-center gap-3">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-black">{documents[config.type].name}</p>
                    <p className="text-xs text-black/60">
                      {formatFileSize(documents[config.type].size)} • Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(config.type)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  title="Remove document"
                >
                  <FiX className="w-4 h-4 text-black" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-black/20 rounded-lg cursor-pointer hover:border-black/40 hover:bg-black/5 transition-all">
                  {uploading[config.type] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span className="text-sm text-black">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-4 h-4 text-black" />
                      <span className="text-sm text-black">Click to upload PDF (max {config.maxSize})</span>
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
    </div>
  );
};

export default InitialDocumentsUpload;
