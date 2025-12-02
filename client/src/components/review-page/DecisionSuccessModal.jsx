'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { 
  CheckCircle, 
  FileText, 
  ArrowLeft,
  Download
} from 'lucide-react';

const DecisionSuccessModal = ({ 
  show, 
  decision,
  proposalCode,
  reportTitle,
  pdfUrl,
  theme = 'light'
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const cardBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const infoBg = isDark ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-50 border-blue-200';
  const infoText = isDark ? 'text-blue-300' : 'text-blue-600';
  const successBg = isDark ? 'bg-green-500/20 border-green-400/30' : 'bg-green-50 border-green-100';
  const buttonBg = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !show) return null;

  const getDecisionLabel = () => {
    if (!decision) return 'Decision Made';
    if (decision.includes('ACCEPTED')) return 'Proposal Accepted';
    if (decision.includes('REJECTED')) return 'Proposal Rejected';
    if (decision.includes('EXPERT_REVIEW')) return 'Sent for Expert Review';
    return decision.replace(/_/g, ' ');
  };

  const getDecisionDescription = () => {
    if (!decision) return 'Your decision has been recorded.';
    if (decision.includes('ACCEPTED')) {
      if (decision.includes('CMPDI')) return 'The proposal has been accepted by CMPDI and will be forwarded to TSSRC for review.';
      if (decision.includes('TSSRC')) return 'The proposal has been accepted by TSSRC and will be forwarded to SSRC for final review.';
      if (decision.includes('SSRC')) return 'The proposal has been finally approved by SSRC. The PI will be notified.';
    }
    if (decision.includes('REJECTED')) {
      return 'The proposal has been rejected. The PI will be notified with your review report.';
    }
    if (decision.includes('EXPERT_REVIEW')) {
      return 'The proposal has been sent to assigned expert reviewers for detailed assessment.';
    }
    return 'Your decision has been recorded and the relevant parties will be notified.';
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - not clickable to close */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className={`relative ${modalBg} rounded-xl shadow-2xl w-full max-w-lg overflow-hidden mx-4`}>
        {/* Success Icon Header */}
        <div className={`${successBg} border-b ${borderColor} p-8 text-center`}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className={`text-2xl font-semibold ${textColor} mb-2`}>
            Decision Submitted Successfully
          </h2>
          <p className={textColor}>
            {getDecisionLabel()}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Decision Details */}
          <div className={`${cardBg} rounded-lg p-4 mb-6`}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textColor}`}>Proposal Code:</span>
                <span className={`text-sm font-medium ${textColor}`}>{proposalCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textColor}`}>Report Title:</span>
                <span className={`text-sm font-medium ${textColor} truncate max-w-[200px]`}>{reportTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textColor}`}>Status:</span>
                <span className="text-sm font-medium text-green-600">Completed</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className={`text-sm ${textColor} mb-6`}>
            {getDecisionDescription()}
          </p>

          {/* PDF Generated Notice */}
          <div className={`flex items-start gap-3 p-4 ${infoBg} border rounded-lg mb-6`}>
            <FileText className={`w-5 h-5 ${infoText} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm font-medium ${textColor}`}>PDF Report Generated</p>
              <p className={`text-sm ${textColor} mt-1`}>
                Your review report has been converted to PDF and stored securely. 
                It will be available in the Supporting Documents section.
              </p>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 mt-2 text-sm font-medium ${infoText} hover:underline transition-colors`}
                >
                  <Download className="w-4 h-4" />
                  Download Report PDF
                </a>
              )}
            </div>
          </div>

          {/* Back to Dashboard Button */}
          <button
            onClick={handleBackToDashboard}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 ${buttonBg} font-semibold rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DecisionSuccessModal;
