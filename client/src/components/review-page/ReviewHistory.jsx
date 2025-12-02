'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

const ReviewHistory = ({ feedbackList = [], theme = 'light' }) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const itemBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-black/5 border-black/10';

  // Mock feedback if none provided
  const displayFeedback = feedbackList.length > 0 ? feedbackList : [
    {
      id: 1,
      reviewer: 'Dr. Amit Kumar',
      date: '2024-01-20',
      comment: 'The research methodology is well-structured. Please provide more details on the data collection process.'
    },
    {
      id: 2,
      reviewer: 'Prof. Sunita Sharma',
      date: '2024-01-18',
      comment: 'Budget allocation looks reasonable. Minor clarification needed on equipment costs.'
    }
  ];

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`${cardBg} border rounded-xl shadow-lg p-6`}>
      <h3 className={`text-xl font-bold ${textColor} mb-6 flex items-center`}>
        <div className={`w-10 h-10 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-lg flex items-center justify-center mr-3`}>
          <MessageSquare className="w-6 h-6 text-purple-600" />
        </div>
        Review History
      </h3>
      
      <div className="space-y-4">
        {displayFeedback.map((feedback) => (
          <div 
            key={feedback.id} 
            className={`p-4 ${itemBg} rounded-lg border`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-full flex items-center justify-center`}>
                <span className="text-purple-600 text-sm font-bold">
                  {getInitials(feedback.reviewer)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-semibold ${textColor}`}>{feedback.reviewer}</div>
                  <div className={`text-xs ${textColor}`}>{feedback.date}</div>
                </div>
                <p className={`${textColor} text-sm leading-relaxed`}>{feedback.comment}</p>
              </div>
            </div>
          </div>
        ))}
        
        {displayFeedback.length === 0 && (
          <div className={`text-center py-8 ${textColor}`}>
            <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'opacity-40' : 'opacity-40'}`} />
            <p>No review comments yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewHistory;
