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
  activeSection
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Milestones Completed */}
      <button 
        onClick={onMilestonesClick}
        className={`bg-white border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'milestones' 
            ? 'border-black ring-2 ring-black/20' 
            : 'border-black/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black">
              {milestonesCompleted}/{totalMilestones}
            </div>
            <div className="text-sm text-black">Milestones Completed</div>
          </div>
        </div>
      </button>

      {/* Expert Opinions */}
      <button 
        onClick={onOpinionsClick}
        className={`bg-white border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'opinions' 
            ? 'border-black ring-2 ring-black/20' 
            : 'border-black/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black">{expertOpinionsCount}</div>
            <div className="text-sm text-black">Expert Opinions</div>
          </div>
        </div>
      </button>

      {/* Current Stage */}
      <button 
        onClick={onStageClick}
        className={`bg-white border rounded-lg p-6 text-left hover:shadow-md transition-all ${
          activeSection === 'timeline' 
            ? 'border-black ring-2 ring-black/20' 
            : 'border-black/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-black truncate max-w-[150px]">
              {currentStage || 'Draft'}
            </div>
            <div className="text-sm text-black">Current Stage</div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default TrackQuickStats;
