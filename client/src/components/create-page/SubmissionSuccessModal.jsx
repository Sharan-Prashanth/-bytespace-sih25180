import React, { useEffect, useState } from 'react';
import { FiCheck, FiLoader } from 'react-icons/fi';

const SubmissionSuccessModal = ({ isOpen, onClose, proposalId }) => {
  const [stage, setStage] = useState('storing'); // 'storing', 'blockchain', 'ai', 'complete'
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate submission stages
    const timer1 = setTimeout(() => {
      setStage('blockchain');
      setProgress(33);
    }, 1500);

    const timer2 = setTimeout(() => {
      setStage('ai');
      setProgress(66);
    }, 3000);

    const timer3 = setTimeout(() => {
      setStage('complete');
      setProgress(100);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStageMessage = () => {
    switch (stage) {
      case 'storing':
        return 'Storing proposal data securely...';
      case 'blockchain':
        return 'Recording on blockchain for immutability...';
      case 'ai':
        return 'Initiating AI validation process...';
      case 'complete':
        return 'Submission successful!';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {stage !== 'complete' ? (
            <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
          ) : (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-black text-center mb-4">
          {stage === 'complete' ? 'Proposal Submitted Successfully!' : 'Processing Submission'}
        </h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-black/10 rounded-full h-2 mb-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-black/60 text-center">{getStageMessage()}</p>
        </div>

        {/* Stage Details */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center gap-3 ${stage === 'storing' || stage === 'blockchain' || stage === 'ai' || stage === 'complete' ? 'text-black' : 'text-black/40'}`}>
            {stage !== 'storing' ? (
              <FiCheck className="w-5 h-5 text-green-600" />
            ) : (
              <FiLoader className="w-5 h-5 animate-spin" />
            )}
            <span className="text-sm">Proposal data stored securely</span>
          </div>
          <div className={`flex items-center gap-3 ${stage === 'blockchain' || stage === 'ai' || stage === 'complete' ? 'text-black' : 'text-black/40'}`}>
            {stage === 'ai' || stage === 'complete' ? (
              <FiCheck className="w-5 h-5 text-green-600" />
            ) : stage === 'blockchain' ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <div className="w-5 h-5 border-2 border-black/20 rounded-full"></div>
            )}
            <span className="text-sm">Recorded on blockchain</span>
          </div>
          <div className={`flex items-center gap-3 ${stage === 'ai' || stage === 'complete' ? 'text-black' : 'text-black/40'}`}>
            {stage === 'complete' ? (
              <FiCheck className="w-5 h-5 text-green-600" />
            ) : stage === 'ai' ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <div className="w-5 h-5 border-2 border-black/20 rounded-full"></div>
            )}
            <span className="text-sm">AI validation initiated</span>
          </div>
        </div>

        {/* Success Message */}
        {stage === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-black mb-3">
              Your proposal has been submitted successfully. AI evaluation and validation is now in progress.
            </p>
            <p className="text-sm text-black mb-3">
              <span className="font-semibold">Proposal ID:</span> {proposalId}
            </p>
            <p className="text-sm text-black">
              You will receive an email notification once the AI validation is complete. The validation report will be available in your dashboard within 5 minutes.
            </p>
          </div>
        )}

        {/* Action Button */}
        {stage === 'complete' && (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmissionSuccessModal;
