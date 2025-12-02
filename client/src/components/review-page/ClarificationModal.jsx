'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

const ClarificationModal = ({ 
  show, 
  onClose, 
  clarificationMessage, 
  onMessageChange, 
  onSubmit,
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
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700 text-white' : isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-black/20 text-black';

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className={`${modalBg} rounded-2xl p-8 max-w-md mx-4 shadow-2xl border`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className={`text-xl font-bold ${textColor} mb-2`}>Request Clarification</h3>
          <p className={`${textColor} mb-6`}>
            Ask the Principal Investigator for additional information or clarification
          </p>
          
          <textarea
            value={clarificationMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Enter your clarification request here..."
            className={`w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${inputBg} ${isDark ? 'placeholder-white/50' : 'placeholder-black/50'} mb-4`}
          />
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${borderColor} ${textColor} ${hoverBg} rounded-lg transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!clarificationMessage?.trim()}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-6 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClarificationModal;
