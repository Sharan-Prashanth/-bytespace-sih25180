'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Send
} from 'lucide-react';
import SimpleReportEditor from './SimpleReportEditor';

const ReportEditorModal = ({ 
  show, 
  onClose, 
  onConfirm,
  decision,
  proposalCode,
  proposalTitle,
  isSubmitting = false
}) => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState({
    html: '',
    text: '',
    json: null,
    characters: 0,
    words: 0
  });
  const [confirmStep, setConfirmStep] = useState(1); // 1: editor, 2: confirmation
  const [mounted, setMounted] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Key to force editor re-render

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setReportTitle('');
      setReportContent({
        html: '',
        text: '',
        json: null,
        characters: 0,
        words: 0
      });
      setConfirmStep(1);
      setEditorKey(prev => prev + 1); // Force editor to re-render with fresh content
    }
  }, [show]);

  if (!mounted || !show) return null;

  const getDecisionLabel = () => {
    if (!decision) return 'Unknown';
    if (decision.includes('ACCEPTED')) return 'Acceptance';
    if (decision.includes('REJECTED')) return 'Rejection';
    if (decision.includes('EXPERT_REVIEW')) return 'Expert Review Request';
    return decision.replace(/_/g, ' ');
  };

  const getDecisionColor = () => {
    if (!decision) return 'bg-black/10 text-black';
    if (decision.includes('ACCEPTED')) return 'bg-green-100 text-green-800 border-green-200';
    if (decision.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
    if (decision.includes('EXPERT_REVIEW')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-black/10 text-black';
  };

  const handleEditorChange = (content) => {
    setReportContent(content);
  };

  const handleProceedToConfirm = () => {
    if (reportTitle.trim() && reportContent.text.trim()) {
      setConfirmStep(2);
    }
  };

  const handleFinalSubmit = () => {
    if (onConfirm) {
      onConfirm({
        title: reportTitle,
        content: reportContent.html,
        textContent: reportContent.text,
        jsonContent: reportContent.json,
        decision: decision,
        wordCount: reportContent.words,
        characterCount: reportContent.characters
      });
    }
  };

  const handleBackToEditor = () => {
    setConfirmStep(1);
  };

  const isFormValid = reportTitle.trim() && reportContent.text.trim() && reportContent.characters >= 50;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black">
                {confirmStep === 1 ? 'Write Review Report' : 'Confirm Decision'}
              </h2>
              <p className="text-sm text-black">
                {confirmStep === 1 
                  ? 'Provide detailed justification for your decision' 
                  : 'Review and confirm your decision'
                }
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {confirmStep === 1 ? (
            <>
              {/* Decision Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-4 ${getDecisionColor()}`}>
                <span className="text-sm font-medium">Decision: {getDecisionLabel()}</span>
              </div>

              {/* Proposal Info */}
              <div className="bg-black/5 rounded-lg p-4 mb-6">
                <p className="text-sm text-black">
                  <span className="font-medium">Proposal Code:</span> {proposalCode}
                </p>
                <p className="text-sm text-black mt-1">
                  <span className="font-medium">Title:</span> {proposalTitle}
                </p>
              </div>

              {/* Report Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Report Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your report"
                    className="w-full px-4 py-3 border border-black/20 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Report Content <span className="text-red-500">*</span>
                  </label>
                  <SimpleReportEditor
                    key={editorKey}
                    content={null}
                    onChange={handleEditorChange}
                    placeholder="Provide detailed justification for your decision. Include key strengths or weaknesses, technical assessment, budget evaluation, and recommendations."
                    minCharacters={100}
                  />
                  <p className="text-xs text-black mt-2">
                    Use the toolbar above to format your text. Include headings, bullet points, and clear sections for better readability.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Double Confirmation View */}
              <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-black">Final Confirmation Required</p>
                  <p className="text-sm text-black mt-1">
                    This action is permanent and cannot be undone. Your report will be converted to PDF 
                    and stored as a supporting document for this proposal.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="bg-black/5 rounded-lg p-4">
                  <h3 className="font-semibold text-black mb-3">Decision Summary</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Proposal:</span>
                      <span className="text-sm font-medium text-black">{proposalCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Decision:</span>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${getDecisionColor()}`}>
                        {getDecisionLabel()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Report Title:</span>
                      <span className="text-sm font-medium text-black">{reportTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Word Count:</span>
                      <span className="text-sm font-medium text-black">{reportContent.words} words</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/5 rounded-lg p-4">
                  <h3 className="font-semibold text-black mb-2">Report Preview</h3>
                  <div className="max-h-48 overflow-y-auto bg-white rounded-lg p-4 border border-black/10">
                    <div 
                      className="prose prose-sm max-w-none text-black"
                      dangerouslySetInnerHTML={{ __html: reportContent.html }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-black/10 bg-black/5">
          {confirmStep === 1 ? (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-black/20 rounded-lg text-black font-medium hover:bg-black/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToConfirm}
                disabled={!isFormValid || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Proceed to Confirm
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBackToEditor}
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-black/20 rounded-lg text-black font-medium hover:bg-black/5 transition-colors disabled:opacity-50"
              >
                Back to Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Decision
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReportEditorModal;
