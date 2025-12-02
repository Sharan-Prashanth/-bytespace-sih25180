'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2 } from 'lucide-react';

const CommitModal = ({ 
  show, 
  onClose, 
  onCommit, 
  commitMessage, 
  onCommitMessageChange,
  committing,
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
        {committing ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className={`text-xl font-bold ${textColor} mb-2`}>Submitting Decision...</h3>
            <p className={textColor}>Processing your review decision</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className={`text-xl font-bold ${textColor} mb-2`}>Add Commit Message</h3>
            <p className={`${textColor} mb-6`}>Describe your review decision for tracking purposes</p>
            
            <div className="mb-6">
              <textarea
                value={commitMessage}
                onChange={(e) => onCommitMessageChange(e.target.value)}
                placeholder="Enter commit message..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${inputBg} resize-none`}
                rows="3"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 border ${borderColor} ${textColor} ${hoverBg} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={onCommit}
                disabled={!commitMessage?.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Submit Decision
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CommitModal;
