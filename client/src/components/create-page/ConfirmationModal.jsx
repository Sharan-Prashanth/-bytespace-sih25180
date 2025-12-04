import React from 'react';
import { FiX, FiFile, FiCheck } from 'react-icons/fi';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, proposalData, theme = 'light' }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200';
  const sectionBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700/50' : 'bg-slate-50';
  const infoBg = isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200';

  const { proposalInfo, initialDocuments, additionalForms, supportingDocuments, formIContent } = proposalData;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const renderDocumentItem = (doc) => {
    if (!doc) return <span className={mutedText + ' text-sm'}>Not uploaded</span>;
    return (
      <div className="flex items-center gap-2">
        <FiCheck className={`w-4 h-4 ${textColor}`} />
        <span className={`text-sm ${textColor}`}>{doc.name} ({formatFileSize(doc.size)})</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${modalBg} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${textColor}`}>Confirm Proposal Submission</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
          >
            <FiX className={`w-5 h-5 ${textColor}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Proposal Information */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>Proposal Information</h3>
            <div className={`${sectionBg} rounded-lg p-4 space-y-2`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${mutedText}`}>Project Title</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.title}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Funding Method</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.fundingMethod}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Principal Implementing Agency</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.principalImplementingAgency}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Sub Implementing Agency</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.subImplementingAgency}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Project Leader</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.projectLeader}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Project Coordinator</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.projectCoordinator}</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Duration</p>
                  <p className={`text-sm font-medium ${textColor}`}>{proposalInfo.projectDurationMonths} months</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Outlay</p>
                  <p className={`text-sm font-medium ${textColor}`}>Rs. {proposalInfo.projectOutlayLakhs} lakhs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Documents */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>Initial Documents</h3>
            <div className={`${sectionBg} rounded-lg p-4 space-y-2`}>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Covering Letter</p>
                {renderDocumentItem(initialDocuments.coveringLetter)}
              </div>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>CV / Resume</p>
                {renderDocumentItem(initialDocuments.cv)}
              </div>
            </div>
          </div>

          {/* Form I */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>Form I - Project Proposal</h3>
            <div className={`${sectionBg} rounded-lg p-4`}>
              <div className="flex items-center gap-2">
                <FiCheck className={`w-4 h-4 ${textColor}`} />
                <span className={`text-sm ${textColor}`}>Form completed and ready for submission</span>
              </div>
            </div>
          </div>

          {/* Additional Forms */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>Additional Forms</h3>
            <div className={`${sectionBg} rounded-lg p-4 space-y-2`}>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Form IA - Endorsement Form</p>
                {renderDocumentItem(additionalForms.formia)}
              </div>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Form IX - Equipment Details (Optional)</p>
                {renderDocumentItem(additionalForms.formix)}
              </div>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Form X - Computer & Software Details (Optional)</p>
                {renderDocumentItem(additionalForms.formx)}
              </div>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Form XI - Manpower Cost</p>
                {renderDocumentItem(additionalForms.formxi)}
              </div>
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Form XII - Travel Expenditure</p>
                {renderDocumentItem(additionalForms.formxii)}
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>Supporting Documents</h3>
            <div className={`${sectionBg} rounded-lg p-4 space-y-2`}>
              {Object.entries(supportingDocuments).map(([key, doc]) => (
                <div key={key}>
                  {renderDocumentItem(doc)}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className={`${infoBg} border rounded-lg p-4`}>
            <p className={`text-sm ${textColor}`}>
              Please review all the information and documents above. Once you confirm, your proposal will be submitted for AI validation and review. 
              You will receive an email notification once the submission is processed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${borderColor}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 border rounded-lg transition-colors ${isDark ? `border-slate-600 ${textColor} hover:bg-white/5` : `border-slate-300 ${textColor} hover:bg-slate-100`}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
