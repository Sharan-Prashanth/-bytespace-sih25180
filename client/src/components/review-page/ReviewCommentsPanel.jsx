'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';

const ReviewCommentsPanel = ({ 
  feedback, 
  onFeedbackChange, 
  onSubmitFeedback,
  theme = 'light'
}) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700 text-white' : isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-black/20 text-black';

  return (
    <div className={`${cardBg} border rounded-xl shadow-lg p-6`}>
      <h3 className={`text-xl font-bold ${textColor} mb-4 flex items-center`}>
        <div className={`w-10 h-10 ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'} rounded-lg flex items-center justify-center mr-3`}>
          <Edit3 className="w-6 h-6 text-orange-600" />
        </div>
        Review Comments
      </h3>
      
      <textarea
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="Enter your detailed review comments, suggestions, and recommendations here..."
        className={`w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${inputBg} ${isDark ? 'placeholder-white/50' : 'placeholder-black/50'}`}
      />
      
      <button
        onClick={onSubmitFeedback}
        disabled={!feedback?.trim()}
        className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
      >
        Submit Review
      </button>
    </div>
  );
};

export default ReviewCommentsPanel;
