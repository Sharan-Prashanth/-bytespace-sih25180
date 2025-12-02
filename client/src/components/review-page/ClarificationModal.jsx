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
  isDark
}) => {
  if (!show) return null;

  const modalBgClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  const subTextClass = isDark ? 'text-slate-400' : 'text-black';
  const inputBgClass = isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-black/20 text-black';

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className={`${modalBgClass} rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl border`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className={`text-xl font-bold ${textClass} mb-2`}>Request Clarification</h3>
          <p className={`${subTextClass} mb-6`}>
            Ask the Principal Investigator for additional information or clarification
          </p>
          
          <textarea
            value={clarificationMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Enter your clarification request here..."
            className={`w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${inputBgClass} placeholder-black/50 mb-4`}
          />
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-black/20 text-black hover:bg-black/5'} rounded-lg transition-colors`}
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
