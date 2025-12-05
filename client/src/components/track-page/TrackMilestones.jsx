'use client';

import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, ChevronDown, AlertCircle, Info, X, SkipForward } from 'lucide-react';

// Define the fixed milestones in the workflow - 6 stages
// Stage 1: AI Evaluation
// Stage 2: CMPDI Review
// Stage 3: Expert Review (can be skipped)
// Stage 4: CMPDI Decision
// Stage 5: TSSRC Review
// Stage 6: SSRC Review
const MILESTONE_STAGES = [
  { 
    key: 'AI_VALIDATION', 
    label: 'AI Evaluation',
    description: 'Automated AI analysis and validation of proposal content',
    milestoneStatuses: ['AI_EVALUATION_PENDING'],
    completionIndicators: ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: 'AI_REJECTED'
  },
  { 
    key: 'CMPDI_REVIEW', 
    label: 'CMPDI Review',
    description: 'Initial review by CMPDI committee. They can send for expert review or make a direct decision.',
    milestoneStatuses: ['CMPDI_REVIEW'],
    completionIndicators: ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: null // Rejection happens at CMPDI Decision stage
  },
  { 
    key: 'EXPERT_REVIEW', 
    label: 'Expert Review',
    description: 'Domain experts review the proposal for detailed technical assessment. This stage can be skipped by CMPDI.',
    milestoneStatuses: ['CMPDI_EXPERT_REVIEW'],
    completionIndicators: ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: null, // Experts cannot reject
    canBeSkipped: true
  },
  { 
    key: 'CMPDI_DECISION', 
    label: 'CMPDI Decision',
    description: 'CMPDI makes the final decision to accept or reject the proposal at this stage.',
    milestoneStatuses: [],
    completionIndicators: ['CMPDI_ACCEPTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: 'CMPDI_REJECTED'
  },
  { 
    key: 'TSSRC_REVIEW', 
    label: 'TSSRC Review',
    description: 'Review by Technical Standing Scientific Research Committee',
    milestoneStatuses: ['TSSRC_REVIEW'],
    completionIndicators: ['TSSRC_ACCEPTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
    rejectionStatus: 'TSSRC_REJECTED'
  },
  { 
    key: 'SSRC_REVIEW', 
    label: 'SSRC Review',
    description: 'Final review and approval by Standing Scientific Research Committee',
    milestoneStatuses: ['SSRC_REVIEW'],
    completionIndicators: ['SSRC_ACCEPTED'],
    rejectionStatus: 'SSRC_REJECTED'
  }
];

const TrackMilestones = ({ 
  proposalStatus,
  timeline = [],
  expertReviewSkipped = null,
  isOpen,
  onToggle,
  theme = 'light'
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const modalBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/10';

  // Get all statuses that exist in timeline
  const timelineStatuses = timeline.map(t => t.status);

  // Check if proposal is rejected
  const isRejected = proposalStatus?.includes('REJECTED');

  // Check if expert review was conducted or skipped
  const hasExpertReview = timelineStatuses.includes('CMPDI_EXPERT_REVIEW') || proposalStatus === 'CMPDI_EXPERT_REVIEW';
  const expertWasSkipped = expertReviewSkipped === true || 
    (!hasExpertReview && ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(proposalStatus));

  // Determine milestone status based on actual timeline data
  const getMilestoneStatus = (milestone, milestoneIndex) => {
    // Special handling for Expert Review stage (can be skipped)
    if (milestone.key === 'EXPERT_REVIEW') {
      if (expertWasSkipped) {
        return 'skipped';
      }
      if (hasExpertReview) {
        // Check if expert review is currently active
        if (proposalStatus === 'CMPDI_EXPERT_REVIEW') {
          return 'active';
        }
        // Expert review was completed
        const completionExists = milestone.completionIndicators.some(s => timelineStatuses.includes(s) || proposalStatus === s);
        if (completionExists) {
          return 'completed';
        }
      }
      // Not yet reached
      return 'pending';
    }

    // Special handling for CMPDI Decision stage
    if (milestone.key === 'CMPDI_DECISION') {
      if (proposalStatus === 'CMPDI_REJECTED') {
        return 'rejected';
      }
      // Check if CMPDI made a decision (accepted or moved to TSSRC)
      const cmpdiDecisionMade = ['CMPDI_ACCEPTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(proposalStatus) ||
        timelineStatuses.some(s => ['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(s));
      
      if (cmpdiDecisionMade) {
        return 'completed';
      }
      
      // CMPDI decision is active when in CMPDI_REVIEW or CMPDI_EXPERT_REVIEW and expert review done
      if ((proposalStatus === 'CMPDI_REVIEW' && !hasExpertReview) || 
          (proposalStatus === 'CMPDI_EXPERT_REVIEW') ||
          (hasExpertReview && proposalStatus === 'CMPDI_REVIEW')) {
        // Only show as active if CMPDI_REVIEW or expert review stage passed
        const cmpdiReviewDone = timelineStatuses.includes('CMPDI_REVIEW');
        if (cmpdiReviewDone || proposalStatus === 'CMPDI_EXPERT_REVIEW') {
          return 'pending'; // Waiting for decision
        }
      }
      
      return 'pending';
    }

    // Check if this is where rejection happened
    if (milestone.rejectionStatus && proposalStatus === milestone.rejectionStatus) {
      return 'rejected';
    }

    // Check if any completion indicator exists (meaning milestone was completed)
    const hasCompletionIndicator = milestone.completionIndicators.some(s => timelineStatuses.includes(s) || proposalStatus === s);
    
    // Check if this is the current active status
    const isCurrentlyActive = milestone.milestoneStatuses.includes(proposalStatus);
    
    if (hasCompletionIndicator && !isCurrentlyActive) {
      return 'completed';
    }
    
    if (isCurrentlyActive) {
      return 'active';
    }
    
    return 'pending';
  };

  // Get completion info from timeline
  const getCompletionInfo = (milestone) => {
    // For skipped stages
    if (milestone.key === 'EXPERT_REVIEW' && expertWasSkipped) {
      // Find when CMPDI made decision (skipping expert review)
      const decisionEntry = timeline.find(t => ['CMPDI_ACCEPTED', 'CMPDI_REJECTED'].includes(t.status));
      if (decisionEntry) {
        return {
          date: new Date(decisionEntry.changedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          isSkipped: true
        };
      }
      return { isSkipped: true };
    }

    // For CMPDI Decision stage
    if (milestone.key === 'CMPDI_DECISION') {
      const decisionEntry = timeline.find(t => ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW'].includes(t.status));
      if (decisionEntry) {
        return {
          date: new Date(decisionEntry.changedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          changedBy: decisionEntry.changedBy?.fullName || decisionEntry.changedBy?.name || 'CMPDI Member'
        };
      }
      return null;
    }

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

  // Count completed milestones (excluding skipped)
  const completedCount = MILESTONE_STAGES.filter((m, i) => {
    const status = getMilestoneStatus(m, i);
    return status === 'completed';
  }).length;
  
  // Adjust total count if expert review was skipped
  const totalCount = expertWasSkipped ? MILESTONE_STAGES.length - 1 : MILESTONE_STAGES.length;

  return (
    <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 ${hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${isDark ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
            <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${textColor}`}>Milestones</h3>
              {/* Info Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfoModal(true);
                }}
                className={`p-1 rounded-full ${hoverBg} transition-colors`}
                aria-label="View workflow information"
              >
                <Info className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-black/50'}`} />
              </button>
            </div>
            <p className={`text-sm ${textColor}`}>{completedCount} of {totalCount} completed</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 ${textColor} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Info Modal - Workflow Tutorial */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className={`${modalBg} border rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
              <h3 className={`text-lg font-semibold ${textColor} flex items-center gap-2`}>
                <Info className="w-5 h-5" />
                Review Workflow Guide
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className={`p-1 rounded-lg ${hoverBg} transition-colors`}
              >
                <X className={`w-5 h-5 ${textColor}`} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <p className={`text-sm ${textColor}`}>
                The proposal goes through the following review stages:
              </p>

              {/* Stage 1 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>1</span>
                  <h4 className={`font-semibold ${textColor}`}>AI Evaluation</h4>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  Automated analysis validates proposal content and format.
                </p>
              </div>

              {/* Stage 2 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>2</span>
                  <h4 className={`font-semibold ${textColor}`}>CMPDI Review</h4>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  CMPDI committee conducts initial review. They can choose to send for expert review or make a direct decision.
                </p>
              </div>

              {/* Stage 3 */}
              <div className={`p-3 rounded-lg border border-dashed ${isDark ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-dashed ${isDark ? 'border-white/40 bg-white/10 text-white' : 'border-black/40 bg-black/10 text-black'}`}>3</span>
                  <h4 className={`font-semibold ${textColor}`}>Expert Review</h4>
                  <span className={`px-2 py-0.5 text-xs rounded ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>Optional</span>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  Domain experts provide detailed technical assessment. CMPDI can skip this stage and make a direct decision. Experts do not have authority to accept or reject.
                </p>
              </div>

              {/* Stage 4 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>4</span>
                  <h4 className={`font-semibold ${textColor}`}>CMPDI Decision</h4>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  CMPDI makes the final accept/reject decision at this stage. If expert review was skipped, this completes simultaneously with stage 2.
                </p>
              </div>

              {/* Stage 5 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>5</span>
                  <h4 className={`font-semibold ${textColor}`}>TSSRC Review</h4>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  Technical Standing Scientific Research Committee reviews approved proposals.
                </p>
              </div>

              {/* Stage 6 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>6</span>
                  <h4 className={`font-semibold ${textColor}`}>SSRC Review</h4>
                </div>
                <p className={`text-sm ${textColor} ml-8`}>
                  Standing Scientific Research Committee provides final approval.
                </p>
              </div>

              {/* Note */}
              <div className={`mt-4 p-3 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs ${textColor}`}>
                  Note: Proposals can be rejected at AI Evaluation, CMPDI Decision, TSSRC Review, or SSRC Review stages. Expert reviewers can only provide opinions but cannot make accept/reject decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isOpen && (
        <div className={`px-6 pb-6 border-t ${borderColor}`}>
          <div className="mt-4 space-y-4">
            {MILESTONE_STAGES.map((milestone, index) => {
              const status = getMilestoneStatus(milestone, index);
              const completionInfo = getCompletionInfo(milestone);
              const isSkippedStage = status === 'skipped';
              
              return (
                <div key={milestone.key} className={`flex items-start gap-4 ${isSkippedStage ? 'opacity-60' : ''}`}>
                  {/* Status Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed' ? (isDark ? 'bg-green-500/20' : 'bg-green-100') :
                      status === 'active' ? (isDark ? 'bg-blue-500/20' : 'bg-blue-100') :
                      status === 'rejected' ? (isDark ? 'bg-red-500/20' : 'bg-red-100') :
                      status === 'skipped' ? (isDark ? 'bg-amber-500/20' : 'bg-amber-100') :
                      (isDark ? 'bg-white/5' : 'bg-black/5')
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      ) : status === 'active' ? (
                        <Clock className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      ) : status === 'rejected' ? (
                        <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                      ) : status === 'skipped' ? (
                        <SkipForward className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      ) : (
                        <Circle className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                      )}
                    </div>
                    {/* Connector Line */}
                    {index < MILESTONE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-8 mt-2 ${
                        status === 'completed' ? (isDark ? 'bg-green-400/50' : 'bg-green-300') : 
                        status === 'rejected' ? (isDark ? 'bg-red-400/50' : 'bg-red-300') :
                        status === 'skipped' ? (isDark ? 'bg-amber-400/30' : 'bg-amber-300') :
                        (isDark ? 'bg-white/10' : 'bg-black/10')
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${
                          status === 'completed' ? (isDark ? 'text-green-400' : 'text-green-700') :
                          status === 'active' ? (isDark ? 'text-blue-400' : 'text-blue-700') :
                          status === 'rejected' ? (isDark ? 'text-red-400' : 'text-red-700') :
                          status === 'skipped' ? (isDark ? 'text-amber-400' : 'text-amber-700') :
                          textColor
                        }`}>
                          {milestone.label}
                        </h4>
                        {milestone.canBeSkipped && (
                          <span className={`px-1.5 py-0.5 text-xs rounded ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                            Optional
                          </span>
                        )}
                      </div>
                      {status === 'active' && (
                        <span className={`px-2 py-0.5 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} text-xs font-medium rounded`}>
                          In Progress
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className={`px-2 py-0.5 ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'} text-xs font-medium rounded`}>
                          Rejected
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className={`px-2 py-0.5 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'} text-xs font-medium rounded`}>
                          Completed
                        </span>
                      )}
                      {status === 'skipped' && (
                        <span className={`px-2 py-0.5 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'} text-xs font-medium rounded`}>
                          Skipped
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${textColor} mt-1`}>{milestone.description}</p>
                    
                    {/* Completion/Start Info */}
                    {status === 'completed' && completionInfo && (
                      <div className={`mt-2 text-xs ${textColor}`}>
                        <span>Completed on {completionInfo.date}</span>
                        {completionInfo.changedBy && completionInfo.changedBy !== 'System' && (
                          <span> by {completionInfo.changedBy}</span>
                        )}
                      </div>
                    )}
                    {status === 'active' && completionInfo && (
                      <div className={`mt-2 text-xs ${textColor}`}>
                        <span>Started on {completionInfo.date}</span>
                      </div>
                    )}
                    {status === 'rejected' && completionInfo && (
                      <div className={`mt-2 text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        <span>Rejected on {completionInfo.date}</span>
                        {completionInfo.changedBy && completionInfo.changedBy !== 'System' && (
                          <span> by {completionInfo.changedBy}</span>
                        )}
                      </div>
                    )}
                    {status === 'skipped' && completionInfo && (
                      <div className={`mt-2 text-xs ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                        <span>Skipped on {completionInfo.date}</span>
                        <span> - CMPDI made direct decision</span>
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
