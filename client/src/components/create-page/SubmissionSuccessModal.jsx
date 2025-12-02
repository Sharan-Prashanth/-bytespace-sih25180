import React, { useEffect, useState } from 'react';
import { FiCheck, FiLoader } from 'react-icons/fi';

const SubmissionSuccessModal = ({ isOpen, onClose, proposalId, theme = 'light' }) => {
  const [stage, setStage] = useState('storing'); // 'storing', 'blockchain', 'ai', 'complete'
  const [progress, setProgress] = useState(0);

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const progressBg = isDark ? 'bg-slate-700' : 'bg-slate-200';
  const successBg = isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200';
  const spinnerBorder = isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${modalBg} rounded-xl max-w-md w-full p-6 shadow-2xl`}>
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {stage !== 'complete' ? (
            <div className={`w-16 h-16 border-4 ${spinnerBorder} rounded-full animate-spin`}></div>
          ) : (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <FiCheck className={`w-8 h-8 ${textColor}`} />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold ${textColor} text-center mb-4`}>
          {stage === 'complete' ? 'Proposal Submitted Successfully!' : 'Processing Submission'}
        </h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className={`w-full ${progressBg} rounded-full h-2 mb-2`}>
            <div
              className={`h-2 rounded-full transition-all duration-500 ${isDark ? 'bg-white' : 'bg-black'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className={`text-sm ${mutedText} text-center`}>{getStageMessage()}</p>
        </div>

        {/* Stage Details */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center gap-3 ${stage === 'storing' || stage === 'blockchain' || stage === 'ai' || stage === 'complete' ? textColor : mutedText}`}>
            {stage !== 'storing' ? (
              <FiCheck className={`w-5 h-5 ${textColor}`} />
            ) : (
              <FiLoader className={`w-5 h-5 animate-spin ${textColor}`} />
            )}
            <span className="text-sm">Proposal data stored securely</span>
          </div>
          <div className={`flex items-center gap-3 ${stage === 'blockchain' || stage === 'ai' || stage === 'complete' ? textColor : mutedText}`}>
            {stage === 'ai' || stage === 'complete' ? (
              <FiCheck className={`w-5 h-5 ${textColor}`} />
            ) : stage === 'blockchain' ? (
              <FiLoader className={`w-5 h-5 animate-spin ${textColor}`} />
            ) : (
              <div className={`w-5 h-5 border-2 rounded-full ${isDark ? 'border-slate-600' : 'border-slate-300'}`}></div>
            )}
            <span className="text-sm">Recorded on blockchain</span>
          </div>
          <div className={`flex items-center gap-3 ${stage === 'ai' || stage === 'complete' ? textColor : mutedText}`}>
            {stage === 'complete' ? (
              <FiCheck className={`w-5 h-5 ${textColor}`} />
            ) : stage === 'ai' ? (
              <FiLoader className={`w-5 h-5 animate-spin ${textColor}`} />
            ) : (
              <div className={`w-5 h-5 border-2 rounded-full ${isDark ? 'border-slate-600' : 'border-slate-300'}`}></div>
            )}
            <span className="text-sm">AI validation initiated</span>
          </div>
        </div>

        {/* Success Message */}
        {stage === 'complete' && (
          <div className={`${successBg} border rounded-lg p-4 mb-6`}>
            <p className={`text-sm ${textColor} mb-3`}>
              Your proposal has been submitted successfully. AI evaluation and validation is now in progress.
            </p>
            <p className={`text-sm ${textColor} mb-3`}>
              <span className="font-semibold">Proposal ID:</span> <span className="font-mono">{proposalId}</span>
            </p>
            <p className={`text-sm ${textColor}`}>
              You will receive an email notification once the AI validation is complete. The validation report will be available in your dashboard within 5 minutes.
            </p>
          </div>
        )}

        {/* Action Button */}
        {stage === 'complete' && (
          <button
            onClick={onClose}
            className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmissionSuccessModal;
