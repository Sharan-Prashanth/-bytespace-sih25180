'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const DecisionConfirmModal = ({ 
  show, 
  onClose, 
  onConfirm, 
  reviewStatus,
  theme = 'light'
}) => {
  if (!show) return null;

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900 border-neutral-700' : isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
  };

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className={`${modalBg} rounded-2xl p-8 max-w-md mx-4 shadow-2xl border`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className={`text-xl font-bold ${textColor} mb-2`}>Confirm Review Decision</h3>
          <p className={`${textColor} mb-2`}>Are you sure you want to submit this decision?</p>
          <p className={`${textColor} font-semibold mb-6`}>
            Decision: {formatStatus(reviewStatus)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${borderColor} ${textColor} ${hoverBg} rounded-lg transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DecisionConfirmModal;
