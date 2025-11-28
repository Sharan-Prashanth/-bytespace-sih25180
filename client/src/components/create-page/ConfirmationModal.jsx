import React from 'react';
import { FiX, FiFile, FiCheck } from 'react-icons/fi';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, proposalData }) => {
  if (!isOpen) return null;

  const { proposalInfo, initialDocuments, additionalForms, supportingDocuments, formIContent } = proposalData;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const renderDocumentItem = (doc) => {
    if (!doc) return <span className="text-black/40 text-sm">Not uploaded</span>;
    return (
      <div className="flex items-center gap-2">
        <FiCheck className="w-4 h-4 text-green-600" />
        <span className="text-sm text-black">{doc.name} ({formatFileSize(doc.size)})</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <h2 className="text-2xl font-bold text-black">Confirm Proposal Submission</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Proposal Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Proposal Information</h3>
            <div className="bg-black/5 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-black/60">Project Title</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.title}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Funding Method</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.fundingMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Principal Implementing Agency</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.principalImplementingAgency}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Sub Implementing Agency</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.subImplementingAgency}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Project Leader</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.projectLeader}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Project Coordinator</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.projectCoordinator}</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Duration</p>
                  <p className="text-sm font-medium text-black">{proposalInfo.projectDurationMonths} months</p>
                </div>
                <div>
                  <p className="text-sm text-black/60">Outlay</p>
                  <p className="text-sm font-medium text-black">₹ {proposalInfo.projectOutlayLakhs} lakhs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Documents */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Initial Documents</h3>
            <div className="bg-black/5 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-sm text-black/60 mb-1">Covering Letter</p>
                {renderDocumentItem(initialDocuments.coveringLetter)}
              </div>
              <div>
                <p className="text-sm text-black/60 mb-1">CV / Resume</p>
                {renderDocumentItem(initialDocuments.cv)}
              </div>
            </div>
          </div>

          {/* Form I */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Form I - Project Proposal</h3>
            <div className="bg-black/5 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-black">Form completed and ready for submission</span>
              </div>
            </div>
          </div>

          {/* Additional Forms */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Additional Forms</h3>
            <div className="bg-black/5 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-sm text-black/60 mb-1">Form IA - Endorsement Form</p>
                {renderDocumentItem(additionalForms.formia)}
              </div>
              <div>
                <p className="text-sm text-black/60 mb-1">Form IX - Equipment Details (Optional)</p>
                {renderDocumentItem(additionalForms.formix)}
              </div>
              <div>
                <p className="text-sm text-black/60 mb-1">Form X - Computer & Software Details (Optional)</p>
                {renderDocumentItem(additionalForms.formx)}
              </div>
              <div>
                <p className="text-sm text-black/60 mb-1">Form XI - Manpower Cost</p>
                {renderDocumentItem(additionalForms.formxi)}
              </div>
              <div>
                <p className="text-sm text-black/60 mb-1">Form XII - Travel Expenditure</p>
                {renderDocumentItem(additionalForms.formxii)}
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Supporting Documents</h3>
            <div className="bg-black/5 rounded-lg p-4 space-y-2">
              {Object.entries(supportingDocuments).map(([key, doc]) => (
                <div key={key}>
                  {renderDocumentItem(doc)}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-black">
              Please review all the information and documents above. Once you confirm, your proposal will be submitted for AI validation and review. 
              You will receive an email notification once the submission is processed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-black/10">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-black/20 text-black rounded-lg hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
