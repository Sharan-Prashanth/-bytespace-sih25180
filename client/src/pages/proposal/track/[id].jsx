'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import apiClient from '../../../utils/api';

// Import modular components
import {
  TrackHeader,
  TrackQuickStats,
  TrackMilestones,
  TrackExpertOpinions,
  TrackTimeline
} from '../../../components/track-page';

function TrackProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // State
  const [proposal, setProposal] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [opinionStats, setOpinionStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fabExpanded, setFabExpanded] = useState(true);
  
  // Active section for scrolling
  const [activeSection, setActiveSection] = useState(null);
  
  // Section open states
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [opinionsOpen, setOpinionsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  // Refs for scrolling
  const milestonesRef = useRef(null);
  const opinionsRef = useRef(null);
  const timelineRef = useRef(null);

  // Role checks
  const userRoles = user?.roles || [];
  const userId = user?._id;

  // Check if user is PI or CI
  const isPI = proposal?.createdBy?._id === userId || proposal?.createdBy === userId;
  const isCI = proposal?.collaborators?.some(c => 
    (c.user?._id === userId || c.user === userId) && c.role === 'CI'
  );

  // Check if user is a reviewer or committee member
  const isReviewer = userRoles.some(role => 
    ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
  );

  // Check if user can collaborate
  const canAccessCollaborate = isPI || isCI;

  // Load proposal data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch proposal
        const proposalResponse = await apiClient.get(`/api/proposals/${id}`);
        const proposalData = proposalResponse.data.data || proposalResponse.data;
        setProposal(proposalData);
        
        // Fetch expert opinions
        try {
          const opinionsResponse = await apiClient.get(`/api/proposals/${id}/opinions`);
          if (opinionsResponse.data.success) {
            setOpinions(opinionsResponse.data.data.opinions || []);
            setOpinionStats(opinionsResponse.data.data.stats || { count: 0, averageRating: 0 });
          }
        } catch (err) {
          console.warn('Could not load opinions:', err);
          setOpinions([]);
        }
        
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Handle quick stats clicks
  const handleMilestonesClick = () => {
    setActiveSection('milestones');
    setMilestonesOpen(true);
    setTimeout(() => {
      milestonesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpinionsClick = () => {
    setActiveSection('opinions');
    setOpinionsOpen(true);
    setTimeout(() => {
      opinionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleStageClick = () => {
    setActiveSection('timeline');
    setTimelineOpen(true);
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Calculate milestones
  const calculateMilestones = () => {
    if (!proposal?.status) return { completed: 0, total: 6 };
    
    const milestoneStatuses = {
      'AI_VALIDATION': ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
      'CMPDI_REVIEW': ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
      'EXPERT_REVIEW': ['CMPDI_ACCEPTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
      'CMPDI_DECISION': ['TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
      'TSSRC_REVIEW': ['TSSRC_ACCEPTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'],
      'SSRC_REVIEW': ['SSRC_ACCEPTED', 'SSRC_REJECTED']
    };

    let completed = 0;
    Object.values(milestoneStatuses).forEach(statuses => {
      if (statuses.includes(proposal.status)) {
        completed++;
      }
    });

    return { completed, total: 6 };
  };

  // Get current stage name
  const getCurrentStage = () => {
    if (!proposal?.status) return 'Draft';
    
    const stageMap = {
      'DRAFT': 'Draft',
      'AI_EVALUATION_PENDING': 'AI Evaluation',
      'CMPDI_REVIEW': 'CMPDI Review',
      'CMPDI_EXPERT_REVIEW': 'Expert Review',
      'CMPDI_ACCEPTED': 'CMPDI Accepted',
      'CMPDI_REJECTED': 'CMPDI Rejected',
      'TSSRC_REVIEW': 'TSSRC Review',
      'TSSRC_ACCEPTED': 'TSSRC Accepted',
      'TSSRC_REJECTED': 'TSSRC Rejected',
      'SSRC_REVIEW': 'SSRC Review',
      'SSRC_ACCEPTED': 'SSRC Accepted',
      'SSRC_REJECTED': 'SSRC Rejected'
    };
    
    return stageMap[proposal.status] || proposal.status.replace(/_/g, ' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg">Loading proposal tracking...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-black text-xl font-semibold mb-2">Error Loading Proposal</p>
          <p className="text-black mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-black text-black rounded-lg hover:bg-black/5 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!proposal) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-black/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-black text-xl font-semibold mb-2">Proposal Not Found</p>
          <p className="text-black mb-4">The requested proposal could not be loaded.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const milestones = calculateMilestones();

  // Determine rejected stage index (if any)
  const getRejectedStageIndex = () => {
    if (!proposal?.status) return -1;
    const rejectionMap = {
      'AI_REJECTED': 0,
      'CMPDI_REJECTED': 3, // Decision stage
      'TSSRC_REJECTED': 4,
      'SSRC_REJECTED': 5
    };
    return rejectionMap[proposal.status] ?? -1;
  };

  const rejectedStageIndex = getRejectedStageIndex();
  const isRejected = rejectedStageIndex >= 0;

  return (
    <div className="min-h-screen bg-black/5">
      {/* Floating Action Button Panel */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <div className={`bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden transition-all duration-300 ${fabExpanded ? 'w-48' : 'w-14'}`}>
          {/* Toggle Button */}
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors border-b border-black/10"
          >
            {fabExpanded && <span className="text-sm font-semibold text-black">Actions</span>}
            <svg 
              className={`w-5 h-5 text-black transition-transform ${fabExpanded ? '' : 'mx-auto'} ${fabExpanded ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Action Buttons */}
          <div className="p-2 space-y-1">
            {/* Version History Button */}
            <button
              onClick={() => router.push(`/proposal/view/${id}?tab=versions`)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
              title="Version History"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fabExpanded && <span className="text-sm font-medium">Versions</span>}
            </button>

            {/* Collaborate Button */}
            {canAccessCollaborate && (
              <button
                onClick={() => router.push(`/proposal/collaborate/${id}`)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                title="Collaborate"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {fabExpanded && <span className="text-sm font-medium">Collaborate</span>}
              </button>
            )}

            {/* View Button */}
            <button
              onClick={() => router.push(`/proposal/view/${id}`)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
              title="View Proposal"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {fabExpanded && <span className="text-sm font-medium">View</span>}
            </button>

            {/* Review Button - Only for reviewers */}
            {isReviewer && (
              <button
                onClick={() => router.push(`/proposal/review/${id}`)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                title="Review"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {fabExpanded && <span className="text-sm font-medium">Review</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <TrackHeader
        proposalCode={proposal.proposalCode}
        projectLeader={proposal.projectLeader}
        status={proposal.status}
        version={proposal.currentVersion}
        userRoles={userRoles}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <TrackQuickStats
          milestonesCompleted={milestones.completed}
          totalMilestones={milestones.total}
          expertOpinionsCount={opinionStats.count}
          currentStage={getCurrentStage()}
          onMilestonesClick={handleMilestonesClick}
          onOpinionsClick={handleOpinionsClick}
          onStageClick={handleStageClick}
          activeSection={activeSection}
        />

        {/* Visual Timeline Bar */}
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-black mb-6">Progress Overview</h3>
          <div className="relative">
            {/* Progress Bar Container */}
            <div className="flex items-center">
              {['AI', 'CMPDI', 'Expert', 'Decision', 'TSSRC', 'SSRC'].map((stage, index) => {
                const isCompleted = index < milestones.completed;
                const isActive = index === milestones.completed && !isRejected;
                const isRejectedStage = index === rejectedStageIndex;
                const isLast = index === 5;
                const isPastRejection = isRejected && index > rejectedStageIndex;
                
                return (
                  <div key={stage} className="flex items-center flex-1 last:flex-none">
                    {/* Stage Marker */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        isRejectedStage 
                          ? 'bg-red-500 border-red-500' 
                          : isCompleted 
                            ? 'bg-black border-black' 
                            : isActive 
                              ? 'bg-white border-black' 
                              : 'bg-white border-black/20'
                      }`}>
                        {isRejectedStage ? (
                          <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : isCompleted ? (
                          <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        isRejectedStage 
                          ? 'text-red-500' 
                          : isPastRejection
                            ? 'text-black/20'
                            : isCompleted || isActive 
                              ? 'text-black' 
                              : 'text-black/40'
                      }`}>
                        {stage}
                      </span>
                    </div>
                    
                    {/* Connecting Line */}
                    {!isLast && (
                      <div className="flex-1 h-0.5 mx-2 -mt-5">
                        <div className={`h-full transition-all duration-300 ${
                          isRejectedStage 
                            ? 'bg-red-500' 
                            : isCompleted && !isPastRejection
                              ? 'bg-black' 
                              : 'bg-black/10'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Rejection Notice */}
          {isRejected && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-black">
                  This proposal was rejected at the <span className="font-semibold">{['AI', 'CMPDI', 'Expert', 'Decision', 'TSSRC', 'SSRC'][rejectedStageIndex]}</span> stage.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {/* Milestones Section */}
          <div ref={milestonesRef} className="scroll-mt-8">
            <TrackMilestones
              proposalStatus={proposal.status}
              timeline={proposal.timeline || []}
              isOpen={milestonesOpen}
              onToggle={() => {
                setMilestonesOpen(!milestonesOpen);
                if (!milestonesOpen) setActiveSection('milestones');
              }}
            />
          </div>

          {/* Expert Opinions Section */}
          <div ref={opinionsRef} className="scroll-mt-8">
            <TrackExpertOpinions
              opinions={opinions}
              averageRating={opinionStats.averageRating}
              isOpen={opinionsOpen}
              onToggle={() => {
                setOpinionsOpen(!opinionsOpen);
                if (!opinionsOpen) setActiveSection('opinions');
              }}
            />
          </div>

          {/* Timeline Section */}
          <div ref={timelineRef} className="scroll-mt-8">
            <TrackTimeline
              proposalStatus={proposal.status}
              timeline={proposal.timeline || []}
              isOpen={timelineOpen}
              onToggle={() => {
                setTimelineOpen(!timelineOpen);
                if (!timelineOpen) setActiveSection('timeline');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackProposal() {
  return (
    <ProtectedRoute>
      <TrackProposalContent />
    </ProtectedRoute>
  );
}
