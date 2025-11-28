import React, { useState } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';

const SupportingDocumentsUpload = ({ documents, onDocumentUpload, onDocumentRemove }) => {
  const [uploading, setUploading] = useState({});

  const handleFileUpload = async (docId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate PDF format
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading({ ...uploading, [docId]: true });

    try {
      // Mock upload to S3
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUrl = `https://s3.bucket.com/proposal-files/support-doc-${docId}-${Date.now()}.pdf`;
      
      onDocumentUpload(docId, {
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading({ ...uploading, [docId]: false });
    }
  };

  const handleRemove = (docId) => {
    if (confirm('Are you sure you want to remove this document?')) {
      onDocumentRemove(docId);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Supporting Documents</h2>
      <p className="text-black mb-4">
        Please upload the following supporting documents as mentioned in the guidelines. Documents marked with * are mandatory.
      </p>

      <div className="space-y-3">
        {documentConfigs.map((config) => (
          <div key={config.id} className="border border-black/20 rounded-lg p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-black">
                {config.label}
                {config.mandatory && <span className="text-red-600 ml-1">*</span>}
                {!config.mandatory && <span className="text-black/50 ml-1 text-xs">(Optional)</span>}
              </h3>
            </div>

            {documents[config.id] ? (
              <div className="flex items-center justify-between bg-black/5 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-black">{documents[config.id].name}</p>
                    <p className="text-xs text-black/60">
                      {formatFileSize(documents[config.id].size)} • Uploaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(config.id)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  title="Remove document"
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
                    <span className="text-sm text-black">Click to upload PDF (max 10 MB)</span>
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

export default SupportingDocumentsUpload;
