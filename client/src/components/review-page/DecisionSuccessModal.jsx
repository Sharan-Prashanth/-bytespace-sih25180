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
  pdfUrl
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden mx-4">
        {/* Success Icon Header */}
        <div className="bg-green-50 border-b border-green-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-black mb-2">
            Decision Submitted Successfully
          </h2>
          <p className="text-black">
            {getDecisionLabel()}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Decision Details */}
          <div className="bg-black/5 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">Proposal Code:</span>
                <span className="text-sm font-medium text-black">{proposalCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">Report Title:</span>
                <span className="text-sm font-medium text-black truncate max-w-[200px]">{reportTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">Status:</span>
                <span className="text-sm font-medium text-green-600">Completed</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-black mb-6">
            {getDecisionDescription()}
          </p>

          {/* PDF Generated Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-black">PDF Report Generated</p>
              <p className="text-sm text-black mt-1">
                Your review report has been converted to PDF and stored securely. 
                It will be available in the Supporting Documents section.
              </p>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-black text-white font-semibold rounded-lg hover:bg-black/90 transition-colors"
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
