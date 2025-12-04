'use client';

import React from 'react';
import { CheckCircle, MessageSquare, Activity } from 'lucide-react';

const TrackQuickStats = ({ 
  milestonesCompleted,
  totalMilestones,
  expertOpinionsCount,
  currentStage,
  onMilestonesClick,
  onOpinionsClick,
  onStageClick,
  activeSection,
  theme = 'light'
}) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const activeBorder = isDark ? 'border-white ring-white/20' : 'border-black ring-black/20';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Milestones Completed */}
      <button 
        onClick={onMilestonesClick}
        className={`${cardBg} border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'milestones' 
            ? `${activeBorder} ring-2` 
            : borderColor
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${isDark ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
            <CheckCircle className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {milestonesCompleted}/{totalMilestones}
            </div>
            <div className={`text-sm ${textColor}`}>Milestones Completed</div>
          </div>
        </div>
      </button>

      {/* Expert Opinions */}
      <button 
        onClick={onOpinionsClick}
        className={`${cardBg} border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'opinions' 
            ? `${activeBorder} ring-2` 
            : borderColor
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
            <MessageSquare className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>{expertOpinionsCount}</div>
            <div className={`text-sm ${textColor}`}>Expert Opinions</div>
          </div>
        </div>
      </button>

      {/* Current Stage */}
      <button 
        onClick={onStageClick}
        className={`${cardBg} border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'timeline' 
            ? `${activeBorder} ring-2` 
            : borderColor
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} rounded-lg flex items-center justify-center`}>
            <Activity className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className={`text-lg font-bold ${textColor} truncate max-w-[150px]`}>
              {currentStage || 'Draft'}
            </div>
            <div className={`text-sm ${textColor}`}>Current Stage</div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default TrackQuickStats;
