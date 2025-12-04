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
  isSubmitting = false,
  isExpertReport = false,
  theme = 'light'
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

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const cardBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/20';
  const buttonBg = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';
  const footerBg = isDark ? 'bg-white/5' : 'bg-black/5';
  const warningBg = isDark ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-yellow-50 border-yellow-200';
  const warningText = isDark ? 'text-yellow-300' : 'text-yellow-800';

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
    if (isExpertReport) return 'Expert Review';
    if (!decision) return 'Unknown';
    if (decision.includes('ACCEPTED')) return 'Acceptance';
    if (decision.includes('REJECTED')) return 'Rejection';
    if (decision.includes('EXPERT_REVIEW')) return 'Expert Review Request';
    return decision.replace(/_/g, ' ');
  };

  const getDecisionColor = () => {
    if (isExpertReport) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (!decision) return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
    if (decision.includes('ACCEPTED')) return 'bg-green-100 text-green-800 border-green-200';
    if (decision.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
    if (decision.includes('EXPERT_REVIEW')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
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
      <div className={`relative ${modalBg} rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col mx-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${cardBg} rounded-lg flex items-center justify-center`}>
              <FileText className={`w-5 h-5 ${textColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${textColor}`}>
                {confirmStep === 1 
                  ? (isExpertReport ? 'Write Expert Review Report' : 'Write Review Report') 
                  : (isExpertReport ? 'Confirm Report Submission' : 'Confirm Decision')
                }
              </h2>
              <p className={`text-sm ${textColor}`}>
                {confirmStep === 1 
                  ? (isExpertReport 
                      ? 'Provide your detailed assessment and recommendations' 
                      : 'Provide detailed justification for your decision')
                  : (isExpertReport 
                      ? 'Review and confirm your expert report' 
                      : 'Review and confirm your decision')
                }
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
            >
              <X className={`w-5 h-5 ${textColor}`} />
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
              <div className={`${cardBg} rounded-lg p-4 mb-6`}>
                <p className={`text-sm ${textColor}`}>
                  <span className="font-medium">Proposal Code:</span> {proposalCode}
                </p>
                <p className={`text-sm ${textColor} mt-1`}>
                  <span className="font-medium">Title:</span> {proposalTitle}
                </p>
              </div>

              {/* Report Form */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    Report Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your report"
                    className={`w-full px-4 py-3 border ${inputBg} rounded-lg ${textColor} focus:outline-none focus:ring-2 focus:ring-white/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    Report Content <span className="text-red-500">*</span>
                  </label>
                  <SimpleReportEditor
                    key={editorKey}
                    content={null}
                    onChange={handleEditorChange}
                    placeholder="Provide detailed justification for your decision. Include key strengths or weaknesses, technical assessment, budget evaluation, and recommendations."
                    minCharacters={100}
                  />
                  <p className={`text-xs ${textColor} mt-2`}>
                    Use the toolbar above to format your text. Include headings, bullet points, and clear sections for better readability.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Double Confirmation View */}
              <div className={`flex items-start gap-4 p-4 ${warningBg} border rounded-lg mb-6`}>
                <AlertTriangle className={`w-6 h-6 ${warningText} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-sm font-medium ${textColor}`}>Final Confirmation Required</p>
                  <p className={`text-sm ${textColor} mt-1`}>
                    {isExpertReport 
                      ? 'This action is permanent. Your expert report will be converted to PDF, stored, and shared with the CMPDI committee for their decision-making process.'
                      : 'This action is permanent and cannot be undone. Your report will be converted to PDF and stored as a supporting document for this proposal.'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className={`${cardBg} rounded-lg p-4`}>
                  <h3 className={`font-semibold ${textColor} mb-3`}>{isExpertReport ? 'Report Summary' : 'Decision Summary'}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={`text-sm ${textColor}`}>Proposal:</span>
                      <span className={`text-sm font-medium ${textColor}`}>{proposalCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${textColor}`}>{isExpertReport ? 'Report Type:' : 'Decision:'}</span>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${getDecisionColor()}`}>
                        {getDecisionLabel()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${textColor}`}>Report Title:</span>
                      <span className={`text-sm font-medium ${textColor}`}>{reportTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${textColor}`}>Word Count:</span>
                      <span className={`text-sm font-medium ${textColor}`}>{reportContent.words} words</span>
                    </div>
                  </div>
                </div>

                <div className={`${cardBg} rounded-lg p-4`}>
                  <h3 className={`font-semibold ${textColor} mb-2`}>Report Preview</h3>
                  <div className={`max-h-48 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-lg p-4 border ${borderColor}`}>
                    <div 
                      className={`prose prose-sm max-w-none ${textColor}`}
                      dangerouslySetInnerHTML={{ __html: reportContent.html }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${borderColor} ${footerBg}`}>
          {confirmStep === 1 ? (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-2.5 border ${borderColor} rounded-lg ${textColor} font-medium ${hoverBg} transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToConfirm}
                disabled={!isFormValid || isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 ${buttonBg} font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
                className={`px-6 py-2.5 border ${borderColor} rounded-lg ${textColor} font-medium ${hoverBg} transition-colors disabled:opacity-50`}
              >
                Back to Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 ${buttonBg} font-medium rounded-lg transition-colors disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isExpertReport ? 'Submit Report' : 'Submit Decision'}
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
