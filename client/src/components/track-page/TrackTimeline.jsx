'use client';

import React from 'react';
import { Clock, CheckCircle, Circle, ChevronDown, User, AlertCircle } from 'lucide-react';

// Define the review stages in order with their associated statuses
const REVIEW_STAGES = [
  {
    key: 'DRAFT',
    label: 'Draft',
    description: 'Proposal is being drafted by the PI and collaborators',
    stageStatuses: ['DRAFT'],
    completionIndicators: ['AI_EVALUATION_PENDING', 'CMPDI_REVIEW']
  },
  {
    key: 'AI_EVALUATION',
    label: 'AI Evaluation',
    description: 'Automated AI analysis and validation of proposal content and structure',
    stageStatuses: ['AI_EVALUATION_PENDING'],
    completionIndicators: ['CMPDI_REVIEW', 'AI_REJECTED'],
    rejectionStatus: 'AI_REJECTED'
  },
  {
    key: 'CMPDI_REVIEW',
    label: 'CMPDI Review',
    description: 'Initial review by Central Mine Planning & Design Institute committee members',
    stageStatuses: ['CMPDI_REVIEW'],
    completionIndicators: ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED']
  },
  {
    key: 'EXPERT_REVIEW',
    label: 'Expert Review',
    description: 'Detailed technical assessment by domain-specific expert reviewers',
    stageStatuses: ['CMPDI_EXPERT_REVIEW'],
    completionIndicators: ['CMPDI_ACCEPTED', 'CMPDI_REJECTED'],
    canBeSkipped: true
  },
  {
    key: 'CMPDI_DECISION',
    label: 'CMPDI Decision',
    description: 'Final evaluation and decision by CMPDI committee',
    stageStatuses: ['CMPDI_ACCEPTED', 'CMPDI_REJECTED'],
    completionIndicators: ['TSSRC_REVIEW'],
    rejectionStatus: 'CMPDI_REJECTED'
  },
  {
    key: 'TSSRC_REVIEW',
    label: 'TSSRC Review',
    description: 'Review by Technical Standing Scientific Research Committee',
    stageStatuses: ['TSSRC_REVIEW'],
    completionIndicators: ['TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW'],
    rejectionStatus: 'TSSRC_REJECTED'
  },
  {
    key: 'SSRC_REVIEW',
    label: 'SSRC Review',
    description: 'Final review and approval by Standing Scientific Research Committee',
    stageStatuses: ['SSRC_REVIEW'],
    completionIndicators: ['SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: 'SSRC_REJECTED'
  }
];

const TrackTimeline = ({ 
  proposalStatus,
  timeline = [],
  isOpen,
  onToggle
}) => {
  // Get all statuses that exist in timeline
  const timelineStatuses = timeline.map(t => t.status);

  // Get stage status based on actual timeline data
  const getStageStatus = (stage, stageIndex) => {
    // Check if this stage was reached
    const hasReachedStage = stage.stageStatuses.some(s => timelineStatuses.includes(s));
    
    // Check if stage was completed (has completion indicator in timeline)
    const hasCompletionIndicator = stage.completionIndicators.some(s => timelineStatuses.includes(s));
    
    // Check if this is the current active status
    const isCurrentlyActive = stage.stageStatuses.includes(proposalStatus);
    
    // Check if stage was rejected
    const isRejected = stage.rejectionStatus && timelineStatuses.includes(stage.rejectionStatus);
    
    if (isRejected) {
      return 'rejected';
    }
    
    if (hasCompletionIndicator) {
      return 'completed';
    }
    
    if (isCurrentlyActive) {
      return 'active';
    }
    
    // For Expert Review - check if it was skipped
    if (stage.canBeSkipped) {
      const hasCMPDIDecision = timelineStatuses.includes('CMPDI_ACCEPTED') || 
                               timelineStatuses.includes('CMPDI_REJECTED');
      const hasExpertReview = timelineStatuses.includes('CMPDI_EXPERT_REVIEW');
      
      if (hasCMPDIDecision && !hasExpertReview) {
        return 'skipped';
      }
    }
    
    return 'pending';
  };

  // Get stage info from timeline
  const getStageInfo = (stage) => {
    // First try to find the completion entry
    const completionEntry = timeline.find(t => stage.completionIndicators.includes(t.status));
    
    if (completionEntry) {
      return {
        type: 'completed',
        date: new Date(completionEntry.changedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        time: new Date(completionEntry.changedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        changedBy: completionEntry.changedBy?.fullName || completionEntry.changedBy?.name || 'System'
      };
    }
    
    // Find when this stage started
    const startEntry = timeline.find(t => stage.stageStatuses.includes(t.status));
    if (startEntry) {
      return {
        type: 'started',
        date: new Date(startEntry.changedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        time: new Date(startEntry.changedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        changedBy: startEntry.changedBy?.fullName || startEntry.changedBy?.name || 'System'
      };
    }
    
    return null;
  };

  // Get current stage name
  const getCurrentStageName = () => {
    const currentStage = REVIEW_STAGES.find(s => s.stageStatuses.includes(proposalStatus));
    return currentStage?.label || proposalStatus?.replace(/_/g, ' ') || 'Unknown';
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-black">Review Timeline</h3>
            <p className="text-sm text-black">Current Stage: {getCurrentStageName()}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-black/10">
          <div className="mt-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-black/10" />
            
            {REVIEW_STAGES.map((stage, index) => {
              const status = getStageStatus(stage, index);
              const stageInfo = getStageInfo(stage);
              
              return (
                <div key={stage.key} className="relative pl-12 pb-6 last:pb-0">
                  {/* Status Icon */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-100' :
                    status === 'rejected' ? 'bg-red-100' :
                    status === 'active' ? 'bg-blue-100' :
                    status === 'skipped' ? 'bg-black/10' :
                    'bg-black/5'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : status === 'rejected' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : status === 'active' ? (
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                    ) : status === 'skipped' ? (
                      <Circle className="w-5 h-5 text-black/30" />
                    ) : (
                      <Circle className="w-5 h-5 text-black/30" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`${status === 'pending' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${
                        status === 'completed' ? 'text-green-700' :
                        status === 'rejected' ? 'text-red-700' :
                        status === 'active' ? 'text-blue-700' :
                        'text-black'
                      }`}>
                        {stage.label}
                      </h4>
                      {status === 'active' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Current
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Completed
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Rejected
                        </span>
                      )}
                      {status === 'skipped' && (
                        <span className="px-2 py-0.5 bg-black/10 text-black text-xs font-medium rounded">
                          Skipped
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-black mb-2">{stage.description}</p>
                    
                    {/* Completion Info */}
                    {stageInfo && (status === 'completed' || status === 'rejected') && (
                      <div className="flex items-center gap-4 text-xs text-black">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{stageInfo.date} at {stageInfo.time}</span>
                        </div>
                        {stageInfo.changedBy !== 'System' && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{stageInfo.changedBy}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {stageInfo && status === 'active' && (
                      <div className="flex items-center gap-4 text-xs text-black">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Started: {stageInfo.date}</span>
                        </div>
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

export default TrackTimeline;
