'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import apiClient from '../../../utils/api';
import { Moon, Sun, MoonStar, ArrowLeft, Clock, Users, Eye, ClipboardCheck, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { getUserQuickActions, getCommitteeQuickActions, getExpertQuickActions } from '../../../utils/quickActionsHelper';

// Import modular components
import {
  TrackHeader,
  TrackQuickStats,
  TrackMilestones,
  TrackExpertOpinions
} from '../../../components/track-page';

function TrackProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply dark class to document for CSS variable support
  useEffect(() => {
    const isDarkMode = theme === 'dark' || theme === 'darkest';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkest' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  // Theme helper variables
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  
  // Theme-based classes
  const bgClass = isDarkest ? 'bg-black' : isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  
  // State
  const [proposal, setProposal] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [opinionStats, setOpinionStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active section for scrolling
  const [activeSection, setActiveSection] = useState(null);
  
  // Section open states - milestones open by default
  const [milestonesOpen, setMilestonesOpen] = useState(true);
  const [opinionsOpen, setOpinionsOpen] = useState(false);
  
  // FAB menu state
  const [fabExpanded, setFabExpanded] = useState(true);

  // Refs for scrolling
  const milestonesRef = useRef(null);
  const opinionsRef = useRef(null);

  // Role checks
  const userRoles = user?.roles || [];
  const userId = user?._id;

  // Role checks
  const isExpert = userRoles.includes('EXPERT_REVIEWER');
  const isCMPDI = userRoles.includes('CMPDI_MEMBER');
  const isTSSRC = userRoles.includes('TSSRC_MEMBER');
  const isSSRC = userRoles.includes('SSRC_MEMBER');
  const isAdmin = userRoles.includes('SUPER_ADMIN');
  const isCommittee = isCMPDI || isTSSRC || isSSRC || isAdmin;

  // Check if expert has submitted report
  const expertHasSubmittedReport = proposal?.assignedReviewers?.some(ar => 
    (ar.reviewer === userId || ar.reviewer?._id === userId) && ar.status === 'COMPLETED'
  );

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
    // Current Stage card now scrolls to milestones section
    setActiveSection('milestones');
    setMilestonesOpen(true);
    setTimeout(() => {
      milestonesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Calculate milestones - Updated workflow with 6 stages
  const calculateMilestones = () => {
    if (!proposal?.status) return { completed: 0, total: 6 };
    
    const status = proposal.status;
    const timeline = proposal.timeline || [];
    const timelineStatuses = timeline.map(t => t.status);
    
    // Check if expert review was conducted or skipped
    const hasExpertReview = timelineStatuses.includes('CMPDI_EXPERT_REVIEW') || status === 'CMPDI_EXPERT_REVIEW';
    const expertWasSkipped = proposal.expertReviewSkipped === true || 
      (!hasExpertReview && ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status));
    
    // Stage 1: AI Evaluation - completed if moved past AI stage
    const aiCompleted = ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    // Stage 2: CMPDI Review - completed if moved to expert review or decision made
    const cmpdiReviewCompleted = ['CMPDI_EXPERT_REVIEW', 'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    // Stage 3: Expert Review - completed if expert review done, skipped if not
    const expertReviewCompleted = hasExpertReview && ['CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    // Stage 4: CMPDI Decision - completed if decision made
    const cmpdiDecisionCompleted = ['CMPDI_ACCEPTED', 'TSSRC_REVIEW', 'TSSRC_ACCEPTED', 'TSSRC_REJECTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    // Stage 5: TSSRC Review - completed if moved to SSRC or accepted by TSSRC
    const tssrcCompleted = ['TSSRC_ACCEPTED', 'SSRC_REVIEW', 'SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    // Stage 6: SSRC Review - completed if finally accepted or rejected by SSRC
    const ssrcCompleted = ['SSRC_ACCEPTED', 'SSRC_REJECTED'].includes(status);
    
    let completed = 0;
    if (aiCompleted) completed++;
    if (cmpdiReviewCompleted) completed++;
    if (expertReviewCompleted) completed++; // Only count if expert review actually happened
    if (cmpdiDecisionCompleted) completed++;
    if (tssrcCompleted) completed++;
    if (ssrcCompleted) completed++;

    // Total is 6 stages, but if expert review was skipped, effective total is 5
    const total = expertWasSkipped ? 5 : 6;

    return { completed, total };
  };

  // Get current stage name
  const getCurrentStage = () => {
    if (!proposal?.status) return 'Draft';
    
    const stageMap = {
      'DRAFT': 'Draft',
      'AI_EVALUATION_PENDING': 'AI Evaluation',
      'AI_REJECTED': 'AI Rejected',
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
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`${textColor} text-lg`}>Loading proposal tracking...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className={`${textColor} text-xl font-semibold mb-2`}>Error Loading Proposal</p>
          <p className={`${textColor} mb-4`}>{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-2 ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'} rounded-lg transition-colors`}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-6 py-2 border ${borderColor} ${textColor} rounded-lg ${hoverBg} transition-colors`}
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
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <svg className={`w-16 h-16 ${isDark ? 'text-white/30' : 'text-black/30'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={`${textColor} text-xl font-semibold mb-2`}>Proposal Not Found</p>
          <p className={`${textColor} mb-4`}>The requested proposal could not be loaded.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`px-6 py-2 ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'} rounded-lg transition-colors`}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const milestones = calculateMilestones();

  // Get quick actions based on role and status
  const getQuickActionsData = () => {
    if (!proposal) return {};
    
    if (isExpert && !isCommittee) {
      return getExpertQuickActions(proposal, 'track', user, expertHasSubmittedReport);
    } else if (isCommittee) {
      return getCommitteeQuickActions(proposal, 'track', user);
    } else {
      return getUserQuickActions(proposal, 'track', user);
    }
  };

  const quickActionsFlags = getQuickActionsData();

  // Build action buttons array
  const getQuickActions = () => {
    const actions = [];

    // View - always show if available
    if (quickActionsFlags.view) {
      actions.push({
        label: 'View',
        description: 'View proposal',
        icon: <Eye className="w-5 h-5" />,
        onClick: () => router.push(`/proposal/view/${id}`)
      });
    }

    // Collaborate
    if (quickActionsFlags.collaborate) {
      actions.push({
        label: 'Collaborate',
        description: 'Work with team',
        icon: <Users className="w-5 h-5" />,
        onClick: () => router.push(`/proposal/collaborate/${id}`)
      });
    }

    // Versions
    if (quickActionsFlags.versions) {
      actions.push({
        label: 'Versions',
        description: 'View version history',
        icon: <Clock className="w-5 h-5" />,
        onClick: () => router.push(`/proposal/view/${id}?tab=versions`)
      });
    }

    // Review
    if (quickActionsFlags.review) {
      actions.push({
        label: 'Review',
        description: 'Submit review',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => router.push(`/proposal/review/${id}`)
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Fixed Top Bar - Back Button (left) and Theme Toggle (right) */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between pointer-events-none">
        {/* Back to Dashboard Button - Expands on hover */}
        <button
          onClick={() => router.push('/dashboard')}
          className={`group flex items-center gap-0 p-2 ${cardBg} border rounded-lg shadow-lg ${hoverBg} transition-all duration-300 pointer-events-auto overflow-hidden`}
          title="Back to Dashboard"
        >
          <ArrowLeft className={`w-5 h-5 ${textColor} flex-shrink-0`} />
          <span className={`text-sm font-medium ${textColor} max-w-0 group-hover:max-w-40 group-hover:ml-2 group-hover:pr-1 overflow-hidden whitespace-nowrap transition-all duration-300`}>Back to Dashboard</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${cardBg} border shadow-lg ${hoverBg} transition-colors pointer-events-auto`}
          title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'darkest' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className={`w-5 h-5 ${textColor}`} />
          ) : theme === 'dark' ? (
            <MoonStar className={`w-5 h-5 ${textColor}`} />
          ) : (
            <Sun className={`w-5 h-5 ${textColor}`} />
          )}
        </button>
      </div>

      {/* Floating Action Button Panel */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <div className={`${cardBg} rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 ${fabExpanded ? 'w-48' : 'w-14'}`}>
          {/* Toggle Button */}
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            className={`w-full flex items-center justify-between p-3 transition-colors border-b ${borderColor} ${hoverBg}`}
          >
            {fabExpanded && <span className={`text-sm font-semibold ${textColor}`}>Actions</span>}
            {fabExpanded ? (
              <ChevronDown className={`w-5 h-5 ${textColor}`} />
            ) : (
              <ChevronUp className={`w-5 h-5 ${textColor} mx-auto`} />
            )}
          </button>

          {/* Action Buttons */}
          <div className="p-2 space-y-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${hoverBg} ${textColor}`}
                title={action.label}
              >
                <span className="group-hover:scale-110 transition-transform">{action.icon}</span>
                {fabExpanded && <span className="text-sm font-medium">{action.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add top padding to account for fixed header */}
      <div className="pt-16">
        {/* Header */}
        <TrackHeader
          proposalCode={proposal.proposalCode}
          projectLeader={proposal.projectLeader}
          status={proposal.status}
          version={proposal.currentVersion}
        userRoles={userRoles}
        theme={theme}
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
          theme={theme}
        />

        {/* Collapsible Sections */}
        <div className="space-y-6">
          {/* Milestones Section */}
          <div ref={milestonesRef} className="scroll-mt-20">
            <TrackMilestones
              proposalStatus={proposal.status}
              timeline={proposal.timeline || []}
              expertReviewSkipped={proposal.expertReviewSkipped}
              isOpen={milestonesOpen}
              onToggle={() => {
                setMilestonesOpen(!milestonesOpen);
                if (!milestonesOpen) setActiveSection('milestones');
              }}
              theme={theme}
            />
          </div>

          {/* Expert Opinions Section */}
          <div ref={opinionsRef} className="scroll-mt-20">
            <TrackExpertOpinions
              opinions={opinions}
              averageRating={opinionStats.averageRating}
              isOpen={opinionsOpen}
              onToggle={() => {
                setOpinionsOpen(!opinionsOpen);
                if (!opinionsOpen) setActiveSection('opinions');
              }}
              theme={theme}
            />
          </div>
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
