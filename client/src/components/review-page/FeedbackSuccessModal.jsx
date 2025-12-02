'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle } from 'lucide-react';

const FeedbackSuccessModal = ({ show, onClose, isDark }) => {
  if (!show) return null;

  const modalBgClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  const subTextClass = isDark ? 'text-slate-400' : 'text-black';

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className={`${modalBgClass} rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl border`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className={`text-xl font-bold ${textClass} mb-2`}>Review Submitted Successfully!</h3>
          <p className={`${subTextClass} mb-6`}>
            Your expert review has been recorded and will be processed by the PRISM system.
          </p>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeedbackSuccessModal;
