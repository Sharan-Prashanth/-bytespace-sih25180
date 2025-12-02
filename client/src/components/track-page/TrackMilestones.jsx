'use client';

import React from 'react';
import { CheckCircle, Clock, Circle, ChevronDown } from 'lucide-react';

// Define the fixed milestones in the workflow with their associated statuses
const MILESTONE_STAGES = [
  { 
    key: 'AI_VALIDATION', 
    label: 'AI Validation',
    description: 'Automated AI analysis and validation of proposal content',
    // Statuses that indicate this milestone was reached/completed
    milestoneStatuses: ['AI_EVALUATION_PENDING', 'CMPDI_REVIEW'],
    // If any of these statuses exist in timeline, milestone is completed
    completionIndicators: ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED']
  },
  { 
    key: 'CMPDI_REVIEW', 
    label: 'CMPDI Review',
    description: 'Review by CMPDI committee members',
    milestoneStatuses: ['CMPDI_REVIEW'],
    completionIndicators: ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED']
  },
  { 
    key: 'EXPERT_REVIEW', 
    label: 'Expert Review',
    description: 'Detailed assessment by domain experts',
    milestoneStatuses: ['CMPDI_EXPERT_REVIEW'],
    completionIndicators: ['CMPDI_ACCEPTED', 'CMPDI_REJECTED'],
    // This stage can be skipped - check if CMPDI went directly to decision
    canBeSkipped: true
  },
  { 
    key: 'CMPDI_DECISION', 
    label: 'CMPDI Decision',
    description: 'Final decision by CMPDI committee',
    milestoneStatuses: ['CMPDI_ACCEPTED', 'CMPDI_REJECTED'],
    completionIndicators: ['TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED']
  },
  { 
    key: 'TSSRC_REVIEW', 
    label: 'TSSRC Review',
    description: 'Review by Technical Standing Scientific Research Committee',
    milestoneStatuses: ['TSSRC_REVIEW'],
    completionIndicators: ['TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW']
  },
  { 
    key: 'SSRC_REVIEW', 
    label: 'SSRC Review',
    description: 'Final review by Standing Scientific Research Committee',
    milestoneStatuses: ['SSRC_REVIEW'],
    completionIndicators: ['SSRC_ACCEPTED', 'SSRC_REJECTED']
  }
];

const TrackMilestones = ({ 
  proposalStatus,
  timeline = [],
  isOpen,
  onToggle
}) => {
  // Get all statuses that exist in timeline
  const timelineStatuses = timeline.map(t => t.status);

  // Determine milestone status based on actual timeline data
  const getMilestoneStatus = (milestone, milestoneIndex) => {
    // Check if this milestone's status exists in the timeline
    const hasReachedMilestone = milestone.milestoneStatuses.some(s => timelineStatuses.includes(s));
    
    // Check if any completion indicator exists (meaning milestone was completed)
    const hasCompletionIndicator = milestone.completionIndicators.some(s => timelineStatuses.includes(s));
    
    // Check if this is the current active status
    const isCurrentlyActive = milestone.milestoneStatuses.includes(proposalStatus);
    
    if (hasCompletionIndicator) {
      return 'completed';
    }
    
    if (isCurrentlyActive) {
      return 'active';
    }
    
    // For Expert Review - check if it was skipped
    if (milestone.canBeSkipped) {
      // Check if CMPDI went directly to decision without expert review
      const hasCMPDIDecision = timelineStatuses.includes('CMPDI_ACCEPTED') || 
                               timelineStatuses.includes('CMPDI_REJECTED');
      const hasExpertReview = timelineStatuses.includes('CMPDI_EXPERT_REVIEW');
      
      if (hasCMPDIDecision && !hasExpertReview) {
        return 'skipped';
      }
    }
    
    // Check if previous milestones are completed (to show as pending vs not reached)
    if (milestoneIndex > 0) {
      const prevMilestone = MILESTONE_STAGES[milestoneIndex - 1];
      const prevCompleted = prevMilestone.completionIndicators.some(s => timelineStatuses.includes(s));
      const prevActive = prevMilestone.milestoneStatuses.includes(proposalStatus);
      
      if (prevCompleted || prevActive) {
        return 'pending';
      }
    }
    
    return 'pending';
  };

  // Get completion info from timeline
  const getCompletionInfo = (milestone) => {
    // Find the timeline entry that indicates this milestone was completed
    const completionEntry = timeline.find(t => milestone.completionIndicators.includes(t.status));
    
    if (completionEntry) {
      return {
        date: new Date(completionEntry.changedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        changedBy: completionEntry.changedBy?.fullName || completionEntry.changedBy?.name || 'System'
      };
    }
    
    // For active status, find when it started
    const activeEntry = timeline.find(t => milestone.milestoneStatuses.includes(t.status));
    if (activeEntry) {
      return {
        date: new Date(activeEntry.changedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        changedBy: activeEntry.changedBy?.fullName || activeEntry.changedBy?.name || 'System',
        isStartDate: true
      };
    }
    
    return null;
  };

  // Count completed milestones
  const completedCount = MILESTONE_STAGES.filter((m, i) => getMilestoneStatus(m, i) === 'completed').length;
  const totalCount = MILESTONE_STAGES.length;

  return (
    <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-black">Milestones</h3>
            <p className="text-sm text-black">{completedCount} of {totalCount} completed</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-black/10">
          <div className="mt-4 space-y-4">
            {MILESTONE_STAGES.map((milestone, index) => {
              const status = getMilestoneStatus(milestone, index);
              const completionInfo = getCompletionInfo(milestone);
              
              return (
                <div key={milestone.key} className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed' ? 'bg-green-100' :
                      status === 'active' ? 'bg-blue-100' :
                      status === 'skipped' ? 'bg-black/10' :
                      'bg-black/5'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : status === 'active' ? (
                        <Clock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-black/30" />
                      )}
                    </div>
                    {/* Connector Line */}
                    {index < MILESTONE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-8 mt-2 ${
                        status === 'completed' ? 'bg-green-300' : 'bg-black/10'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        status === 'completed' ? 'text-green-700' :
                        status === 'active' ? 'text-blue-700' :
                        'text-black'
                      }`}>
                        {milestone.label}
                      </h4>
                      {status === 'active' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          In Progress
                        </span>
                      )}
                      {status === 'skipped' && (
                        <span className="px-2 py-0.5 bg-black/10 text-black text-xs font-medium rounded">
                          Skipped
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-black mt-1">{milestone.description}</p>
                    
                    {/* Completion/Start Info */}
                    {status === 'completed' && completionInfo && (
                      <div className="mt-2 text-xs text-black">
                        <span>Completed on {completionInfo.date}</span>
                        {completionInfo.changedBy !== 'System' && (
                          <span> by {completionInfo.changedBy}</span>
                        )}
                      </div>
                    )}
                    {status === 'active' && completionInfo && (
                      <div className="mt-2 text-xs text-black">
                        <span>Started on {completionInfo.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackMilestones;
