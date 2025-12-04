'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import apiClient from '../../../utils/api';
import jsPDF from 'jspdf';
import { Moon, Sun, MoonStar, ArrowLeft } from 'lucide-react';

// Import modular components
import {
  ReviewHeader,
  ReviewProposalInformation,
  ReviewEditorSection,
  ReviewActionsMenu,
  SupportingDocuments,
  CommunicationSection,
  ReviewDecisionPanel,
  ReportEditorModal,
  DecisionSuccessModal,
  ExpertOpinionSection,
  ExpertReviewerSelectionModal
} from '../../../components/review-page';

// Lazy load heavy components
const VersionHistory = lazy(() => import('../../../components/VersionHistory'));
const Chatbot = lazy(() => import('../../../components/Saarthi'));

function ReviewProposalContent() {
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
  const subTextColor = isDark ? 'text-slate-400' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  
  // State
  const [proposal, setProposal] = useState(null);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState({ user: [], ai: [], reviewer: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUserMadeDecision, setHasUserMadeDecision] = useState(false);
  const [hasExpertSubmittedReport, setHasExpertSubmittedReport] = useState(false);
  
  // UI State
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSaarthi, setShowSaarthi] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExpertSelectionModal, setShowExpertSelectionModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState('');
  const [submittedDecision, setSubmittedDecision] = useState('');
  const [submittedReportTitle, setSubmittedReportTitle] = useState('');
  const [submittedReportPdfUrl, setSubmittedReportPdfUrl] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isSubmittingExpertSelection, setIsSubmittingExpertSelection] = useState(false);
  const [isSubmittingExpertReport, setIsSubmittingExpertReport] = useState(false);
  const [isExpertReportMode, setIsExpertReportMode] = useState(false);

  // Role checks
  const userRoles = user?.roles || [];
  const isExpert = userRoles.includes('EXPERT_REVIEWER');
  const isCMPDI = userRoles.includes('CMPDI_MEMBER');
  const isTSSRC = userRoles.includes('TSSRC_MEMBER');
  const isSSRC = userRoles.includes('SSRC_MEMBER');
  const isAdmin = userRoles.includes('SUPER_ADMIN');
  const isCommitteeMember = isCMPDI || isTSSRC || isSSRC || isAdmin;

  // Can resolve comments - committee members and admins
  const canResolveComments = isCommitteeMember;

  // Load proposal data
  useEffect(() => {
    const loadProposalData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch proposal
        const proposalResponse = await apiClient.get(`/api/proposals/${id}`);
        const proposalData = proposalResponse.data.data;
        setProposal(proposalData);
        
        // Fetch comments
        try {
          const commentsResponse = await apiClient.get(`/api/proposals/${id}/comments`);
          setComments(commentsResponse.data.data || []);
        } catch (err) {
          console.warn('Could not load comments:', err);
          setComments([]);
        }
        
        // Fetch reports
        try {
          const reportsResponse = await apiClient.get(`/api/proposals/${id}/reports`);
          const allReports = reportsResponse.data.data || [];
          
          // Categorize reports
          const categorizedReports = {
            user: proposalData.supportingDocs || [],
            ai: proposalData.aiReports || [],
            reviewer: allReports.filter(r => r.reportType !== 'AI_REVIEW')
          };
          setReports(categorizedReports);
          
          // Check if user has already made a decision for current status
          // Get the report type that corresponds to current status
          const currentStatus = proposalData.status;
          let relevantReportType = null;
          if (currentStatus === 'CMPDI_REVIEW' || currentStatus === 'CMPDI_EXPERT_REVIEW') {
            relevantReportType = 'CMPDI_REVIEW';
          } else if (currentStatus === 'TSSRC_REVIEW') {
            relevantReportType = 'TSSRC_REVIEW';
          } else if (currentStatus === 'SSRC_REVIEW') {
            relevantReportType = 'SSRC_REVIEW';
          }
          
          // Find if user has submitted a report for this status (committee member decision)
          if (relevantReportType && user?._id) {
            const userDecisionReport = allReports.find(r => 
              r.reportType === relevantReportType && 
              r.createdBy?._id === user._id &&
              r.status === 'SUBMITTED'
            );
            setHasUserMadeDecision(!!userDecisionReport);
          }

          // Check if expert has already submitted a report
          if (user?._id) {
            const expertReport = allReports.find(r => 
              r.reportType === 'EXPERT_REVIEW' && 
              r.createdBy?._id === user._id &&
              r.status === 'SUBMITTED'
            );
            setHasExpertSubmittedReport(!!expertReport);
          }
        } catch (err) {
          console.warn('Could not load reports:', err);
          setReports({
            user: proposalData?.supportingDocs || [],
            ai: proposalData?.aiReports || [],
            reviewer: []
          });
        }
        
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.message || 'Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    loadProposalData();
  }, [id, user?._id]);

  // Add comment handler
  const handleAddComment = useCallback(async (content) => {
    try {
      const response = await apiClient.post(`/api/proposals/${id}/comments`, {
        content,
        type: 'COMMENT'
      });
      
      // Refresh comments
      const commentsResponse = await apiClient.get(`/api/proposals/${id}/comments`);
      setComments(commentsResponse.data.data || []);
      
      return response.data;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, [id]);

  // Reply to comment handler
  const handleReplyComment = useCallback(async (commentId, content) => {
    try {
      await apiClient.post(`/api/comments/${commentId}/reply`, { content });
      
      // Refresh comments
      const commentsResponse = await apiClient.get(`/api/proposals/${id}/comments`);
      setComments(commentsResponse.data.data || []);
    } catch (err) {
      console.error('Error replying to comment:', err);
      throw err;
    }
  }, [id]);

  // Resolve comment handler
  const handleResolveComment = useCallback(async (commentId) => {
    try {
      await apiClient.put(`/api/comments/${commentId}/resolve`);
      
      // Refresh comments
      const commentsResponse = await apiClient.get(`/api/proposals/${id}/comments`);
      setComments(commentsResponse.data.data || []);
    } catch (err) {
      console.error('Error resolving comment:', err);
      throw err;
    }
  }, [id]);

  // Handle decision submission
  const handleSubmitDecision = useCallback((decision) => {
    // If decision is to send for expert review, show expert selection modal first
    if (decision === 'CMPDI_EXPERT_REVIEW') {
      setPendingDecision(decision);
      setShowExpertSelectionModal(true);
    } else {
      // For accept/reject decisions, show report modal
      setPendingDecision(decision);
      setShowReportModal(true);
    }
  }, []);

  // Handle expert reviewer selection confirmation
  const handleExpertReviewerSelection = useCallback(async (reviewerIds) => {
    if (!reviewerIds || reviewerIds.length === 0) return;
    
    setIsSubmittingExpertSelection(true);
    
    try {
      // Call the new API endpoint to select expert reviewers and update status
      await apiClient.post(`/api/workflow/${id}/select-expert-reviewers`, {
        reviewerIds,
        notes: 'Sent for expert review'
      });
      
      // Refresh proposal data
      const proposalResponse = await apiClient.get(`/api/proposals/${id}`);
      setProposal(proposalResponse.data.data);
      
      // Close modal and show success
      setShowExpertSelectionModal(false);
      setPendingDecision('');
      
      // Show success with a custom message for expert review
      setSubmittedDecision('CMPDI_EXPERT_REVIEW');
      setSubmittedReportTitle('Expert reviewers assigned');
      setSubmittedReportPdfUrl('');
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error('Error selecting expert reviewers:', err);
      alert('Failed to assign expert reviewers: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingExpertSelection(false);
    }
  }, [id]);

  // Open expert report modal (called from ReviewDecisionPanel after confirmation)
  const handleOpenExpertReportModal = useCallback(() => {
    setIsExpertReportMode(true);
    setShowReportModal(true);
  }, []);

  // Handle expert report submission (separate from committee decisions)
  const handleExpertReportSubmit = useCallback(async (reportData) => {
    if (!reportData) return;
    
    setIsSubmittingExpertReport(true);
    
    try {
      // 1. Create the expert report with HTML content
      const reportResponse = await apiClient.post(`/api/proposals/${id}/reports`, {
        title: reportData.title,
        content: reportData.content,
        htmlContent: reportData.content,
        textContent: reportData.textContent,
        wordCount: reportData.wordCount,
        characterCount: reportData.characterCount,
        reportType: 'EXPERT_REVIEW'
      });
      
      const reportId = reportResponse.data.data._id;
      
      // 2. Submit the report (generates PDF and uploads to S3)
      const submitResponse = await apiClient.post(`/api/reports/${reportId}/submit`);
      const pdfUrl = submitResponse.data.data?.fileUrl || '';
      
      // 3. Refresh reports to include the new expert report
      const reportsResponse = await apiClient.get(`/api/proposals/${id}/reports`);
      const allReports = reportsResponse.data.data || [];
      setReports(prev => ({
        ...prev,
        reviewer: allReports.filter(r => r.reportType !== 'AI_REVIEW')
      }));
      
      // 4. Mark that expert has submitted report
      setHasExpertSubmittedReport(true);
      
      // 5. Show success modal
      setSubmittedDecision('EXPERT_REPORT_SUBMITTED');
      setSubmittedReportTitle(reportData.title);
      setSubmittedReportPdfUrl(pdfUrl);
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error('Error submitting expert report:', err);
      alert('Failed to submit expert report: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingExpertReport(false);
    }
  }, [id]);

  // Handle final decision with report
  const handleFinalDecision = useCallback(async (reportData) => {
    if (!pendingDecision || !reportData) return;
    
    setIsSubmittingDecision(true);
    
    try {
      // 1. Create the report with HTML content
      const reportResponse = await apiClient.post(`/api/proposals/${id}/reports`, {
        title: reportData.title,
        content: reportData.content, // HTML content
        htmlContent: reportData.content,
        textContent: reportData.textContent,
        wordCount: reportData.wordCount,
        characterCount: reportData.characterCount,
        decision: pendingDecision,
        reportType: pendingDecision.includes('CMPDI') ? 'CMPDI_REVIEW' 
                   : pendingDecision.includes('TSSRC') ? 'TSSRC_REVIEW'
                   : pendingDecision.includes('SSRC') ? 'SSRC_REVIEW'
                   : 'COMMITTEE_REVIEW'
      });
      
      const reportId = reportResponse.data.data._id;
      
      // 2. Submit the report (generates PDF and uploads to S3)
      const submitResponse = await apiClient.post(`/api/reports/${reportId}/submit`);
      const pdfUrl = submitResponse.data.data?.fileUrl || '';
      
      // 3. Update proposal status
      await apiClient.put(`/api/workflow/${id}/status`, {
        status: pendingDecision,
        notes: `Decision made with report: ${reportData.title}`
      });
      
      // 4. Refresh proposal data
      const proposalResponse = await apiClient.get(`/api/proposals/${id}`);
      setProposal(proposalResponse.data.data);
      
      // 5. Refresh reports
      const reportsResponse = await apiClient.get(`/api/proposals/${id}/reports`);
      const allReports = reportsResponse.data.data || [];
      setReports(prev => ({
        ...prev,
        reviewer: allReports.filter(r => r.reportType !== 'AI_REVIEW')
      }));
      
      // Close report modal and reset pending decision
      setShowReportModal(false);
      
      // Store submitted info for success modal
      setSubmittedDecision(pendingDecision);
      setSubmittedReportTitle(reportData.title);
      setSubmittedReportPdfUrl(pdfUrl);
      setPendingDecision('');
      
      // Mark that user has made a decision
      setHasUserMadeDecision(true);
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error('Error submitting decision:', err);
      alert('Failed to submit decision: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingDecision(false);
    }
  }, [id, pendingDecision]);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-white' : 'border-black'} mx-auto mb-4`}></div>
          <p className={textColor}>Loading proposal for review...</p>
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

      {/* Header */}
      <ReviewHeader
        proposalCode={proposal.proposalCode}
        projectLeader={proposal.projectLeader}
        status={proposal.status}
        version={proposal.currentVersion}
        hasDraft={proposal.hasDraft}
        draftVersionLabel={proposal.draftVersionLabel}
        userRoles={userRoles}
        theme={theme}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Full Width Sections */}
        <div className="space-y-6">
          {/* Proposal Information - Full Width */}
          <ReviewProposalInformation 
            proposalInfo={proposal}
            defaultOpen={true}
            theme={theme}
          />

          {/* Editor Section - Full Width for Maximum Space */}
          <ReviewEditorSection
            proposalId={id}
            proposal={proposal}
            defaultOpen={false}
            theme={theme}
          />

          {/* Two Column Grid for Documents, Communication, and Decision */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Side - Documents and Communication */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supporting Documents */}
              <SupportingDocuments
                userDocuments={reports.user}
                aiReports={reports.ai}
                reviewerReports={reports.reviewer}
                theme={theme}
              />

              {/* Communication Section */}
              <CommunicationSection
                comments={comments}
                currentUser={user}
                onAddComment={handleAddComment}
                onReply={handleReplyComment}
                theme={theme}
              />
            </div>

            {/* Right Side - Decision Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Review Decision Panel - Handles both committee decisions and expert report submissions */}
                <ReviewDecisionPanel
                  userRoles={userRoles}
                  proposalStatus={proposal.status}
                  onSubmitDecision={handleSubmitDecision}
                  isSubmitting={isSubmittingDecision}
                  hasUserMadeDecision={hasUserMadeDecision}
                  showExpertReportSection={isExpert && !isCommitteeMember && proposal.status === 'CMPDI_EXPERT_REVIEW' && !hasExpertSubmittedReport}
                  hasExpertSubmittedReport={hasExpertSubmittedReport}
                  onOpenExpertReportModal={handleOpenExpertReportModal}
                  isSubmittingExpertReport={isSubmittingExpertReport}
                  theme={theme}
                />

                {/* Expert Opinion Section */}
                <ExpertOpinionSection
                  proposalId={id}
                  currentUser={user}
                  userRoles={userRoles}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Actions Menu */}
      <ReviewActionsMenu
        proposalId={id}
        onShowVersionHistory={() => setShowVersionHistory(!showVersionHistory)}
        showVersionHistory={showVersionHistory}
        theme={theme}
      />

      {/* Version History Panel */}
      {showVersionHistory && (
        <Suspense fallback={
          <div className={`fixed top-0 right-0 w-1/3 h-full ${cardBg} border-l ${borderColor} z-50 flex items-center justify-center`}>
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-white' : 'border-black'}`}></div>
          </div>
        }>
          <div className={`fixed top-0 right-0 w-1/3 h-full ${cardBg} border-l ${borderColor} shadow-2xl z-50 overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${textColor}`}>Version History</h2>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className={`p-2 ${hoverBg} rounded-lg transition-colors`}
                >
                  <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VersionHistory proposalId={id} theme={theme} />
            </div>
          </div>
        </Suspense>
      )}

      {/* Report Editor Modal */}
      <ReportEditorModal
        show={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setPendingDecision('');
          setIsExpertReportMode(false);
        }}
        onConfirm={isExpertReportMode ? handleExpertReportSubmit : handleFinalDecision}
        decision={isExpertReportMode ? 'EXPERT_REPORT' : pendingDecision}
        proposalCode={proposal.proposalCode}
        proposalTitle={proposal.title}
        isSubmitting={isExpertReportMode ? isSubmittingExpertReport : isSubmittingDecision}
        isExpertReport={isExpertReportMode}
        theme={theme}
      />

      {/* Expert Reviewer Selection Modal */}
      <ExpertReviewerSelectionModal
        isOpen={showExpertSelectionModal}
        onClose={() => {
          setShowExpertSelectionModal(false);
          setPendingDecision('');
        }}
        onConfirm={handleExpertReviewerSelection}
        proposalCode={proposal.proposalCode}
        isSubmitting={isSubmittingExpertSelection}
        theme={theme}
      />

      {/* Saarthi Chatbot */}
      <Suspense fallback={null}>
        <Chatbot 
          showSaarthi={showSaarthi}
          setShowSaarthi={setShowSaarthi}
          context="reviewer"
          proposalData={proposal}
          theme={theme}
        />
      </Suspense>

      {/* Decision Success Modal */}
      <DecisionSuccessModal
        show={showSuccessModal}
        decision={submittedDecision}
        proposalCode={proposal.proposalCode}
        reportTitle={submittedReportTitle}
        pdfUrl={submittedReportPdfUrl}
        theme={theme}
      />
    </div>
  );
}

export default function ReviewProposal() {
  return (
    <ProtectedRoute>
      <ReviewProposalContent />
    </ProtectedRoute>
  );
}
