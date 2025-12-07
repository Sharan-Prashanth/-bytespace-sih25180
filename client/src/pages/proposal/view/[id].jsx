'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getProposalById } from '../../../utils/proposalApi';
import apiClient from '../../../utils/api';
import { Edit, Users, FileText, MessageSquare, Download, ChevronUp, ChevronDown, Clock, PenLine, Moon, Sun, MoonStar, ArrowLeft } from 'lucide-react';
import { getUserQuickActions, getCommitteeQuickActions, getExpertQuickActions } from '../../../utils/quickActionsHelper';
import StickyNavigation from '../../../components/common/StickyNavigation';

// Lazy load heavy components
const AdvancedProposalEditor = lazy(() => import('../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor'));
const VersionHistory = lazy(() => import('../../../components/VersionHistory'));

// Import view-specific components
import ViewHeader from '../../../components/view-page/ViewHeader';
import ViewProposalInformation from '../../../components/view-page/ViewProposalInformation';

function ViewProposalContent() {
  const router = useRouter();
  const { id, version: versionParam } = router.query;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fabExpanded, setFabExpanded] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [versionData, setVersionData] = useState(null);
  const [expertHasSubmittedReport, setExpertHasSubmittedReport] = useState(false);
  
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

  // Determine which buttons to show based on user role
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('SUPER_ADMIN');
  const isExpert = userRoles.includes('EXPERT_REVIEWER');
  const isCMPDI = userRoles.includes('CMPDI_MEMBER');
  const isTSSRC = userRoles.includes('TSSRC_MEMBER');
  const isSSRC = userRoles.includes('SSRC_MEMBER');
  const isRegularUser = userRoles.includes('USER') || userRoles.length === 0;

  // Determine the correct dashboard path based on user role
  const getDashboardPath = () => {
    return '/dashboard'; // Single dashboard route for all users
  };

  // Get role-specific label
  const getRoleLabel = () => {
    return 'Dashboard'; // Simple label for all users
  };

  // Determine quick actions based on user role and proposal status
  const getQuickActions = () => {
    if (!proposal) return {};
    
    // Check if user is committee member
    const isCommittee = isCMPDI || isTSSRC || isSSRC || isAdmin;
    
    // Get appropriate quick actions
    if (isExpert && !isCommittee) {
      return getExpertQuickActions(proposal, 'view', user, expertHasSubmittedReport);
    } else if (isCommittee) {
      return getCommitteeQuickActions(proposal, 'view', user);
    } else {
      return getUserQuickActions(proposal, 'view', user);
    }
  };

  const quickActions = getQuickActions();
  
  // Check if proposal is in draft status
  const isDraft = proposal && proposal.status === 'DRAFT';
  const isSSRCAccepted = proposal && proposal.status === 'SSRC_ACCEPTED';
  const isAIRejected = proposal && proposal.status === 'AI_EVALUATION_REJECTED';
  const isFinallyRejected = proposal && (proposal.status === 'CMPDI_REJECTED' || proposal.status === 'TSSRC_REJECTED' || proposal.status === 'SSRC_REJECTED');

  // Load specific version data if version parameter is present
  useEffect(() => {
    const loadVersionData = async () => {
      if (!id) return;
      
      // If no version param, reset to current version
      if (!versionParam) {
        setViewingVersion(null);
        setVersionData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const versionNum = parseInt(versionParam);
        setViewingVersion(versionNum);

        const response = await apiClient.get(`/api/proposals/${id}/versions/${versionNum}`);
        const version = response.data.data;
        setVersionData(version);
      } catch (err) {
        console.error('[ViewPage] Error loading version:', err);
        setError(err.response?.data?.message || 'Failed to load version');
      } finally {
        setLoading(false);
      }
    };

    loadVersionData();
  }, [id, versionParam]);

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!id) return;
      // Skip loading current proposal if we're viewing a specific version
      if (versionParam) {
        // But ensure we have at least the base proposal data for context
        if (!proposal) {
          try {
            const response = await getProposalById(id);
            const proposalData = response.data;
            setProposal({ ...proposalData, processedForms: null }); // Basic data without forms
          } catch (err) {
            console.error('Error loading base proposal:', err);
          }
        }
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProposalById(id);
        const proposalData = response.data;
        
        console.log('Proposal loaded:', proposalData.proposalCode);
        console.log('Forms available:', proposalData.forms ? Object.keys(proposalData.forms) : 'none');
        console.log('FormI field available:', proposalData.formi ? 'yes' : 'no');
        
        // Process forms data to match AdvancedProposalEditor expectations
        // Editor expects EXACT format from create.jsx: { formi: { content: [...] } }
        let processedForms = null;
        
        // First check for the new single formi field (new schema)
        if (proposalData.formi) {
          const formiData = proposalData.formi;
          console.log('Using new formi field structure');
          
          let content = null;
          
          // Check for nested content
          if (formiData.formi && formiData.formi.content) {
            content = formiData.formi.content;
            console.log('Found nested formi.formi.content structure');
          }
          // Check direct content
          else if (formiData.content) {
            content = formiData.content;
            console.log('Found formi.content structure');
          }
          // Maybe it's already the content array
          else if (Array.isArray(formiData)) {
            content = formiData;
            console.log('Found formi as direct content array');
          }
          
          if (content && Array.isArray(content) && content.length > 0) {
            processedForms = {
              formi: {
                content: content,
                wordCount: formiData.wordCount || 0,
                characterCount: formiData.characterCount || 0
              }
            };
            console.log('Successfully processed formi:', {
              contentLength: content.length,
              firstNode: content[0]
            });
          }
        }
        // Fallback to legacy forms.formI structure (old schema)
        else if (proposalData.forms && proposalData.forms.formI) {
          const formIData = proposalData.forms.formI;
          
          console.log('Using legacy forms.formI structure:', {
            keys: Object.keys(formIData),
            hasFormi: !!formIData.formi,
            hasContent: !!formIData.content,
            hasEditorContent: !!formIData.editorContent
          });
          
          let content = null;
          
          // Try nested structure: forms.formI.formi.content (MongoDB structure)
          if (formIData.formi && formIData.formi.content) {
            content = formIData.formi.content;
            console.log('Found nested formi.content structure');
          }
          // Try direct content
          else if (formIData.content) {
            content = formIData.content;
            console.log('Found direct content structure');
          }
          // Try editorContent
          else if (formIData.editorContent) {
            content = formIData.editorContent;
            console.log('Found editorContent structure');
          }
          
          if (content && Array.isArray(content) && content.length > 0) {
            // Match create.jsx format exactly: { formi: { content: [...] } }
            processedForms = {
              formi: {
                content: content,
                wordCount: formIData.formi?.wordCount || formIData.wordCount || 0,
                characterCount: formIData.formi?.characterCount || formIData.characterCount || 0
              }
            };
            
            console.log('Successfully processed Form I:', {
              contentType: 'array',
              contentLength: content.length,
              wordCount: processedForms.formi.wordCount,
              firstNode: content[0]
            });
          } else {
            console.error('No valid content array found in Form I');
            console.log('Form I data:', formIData);
          }
        } else {
          console.error('No formI found in proposal');
        }
        
        setProposal({ ...proposalData, processedForms });
        
        // Check if expert has submitted their report
        if (user?.roles?.includes('EXPERT_REVIEWER') && user?._id) {
          const assignment = proposalData.assignedReviewers?.find(ar => 
            (ar.reviewer === user._id || ar.reviewer?._id === user._id) && ar.status === 'COMPLETED'
          );
          setExpertHasSubmittedReport(!!assignment);
        }
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.message || 'Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id, versionParam, user?._id]);

  // Process version data for display
  const getDisplayData = () => {
    if (viewingVersion && versionData) {
      // Process version forms for editor
      let processedForms = null;
      
      // First check for new formi field
      if (versionData.formi) {
        const formiData = versionData.formi;
        let content = null;
        
        if (formiData.formi && formiData.formi.content) {
          content = formiData.formi.content;
        } else if (formiData.content) {
          content = formiData.content;
        } else if (Array.isArray(formiData)) {
          content = formiData;
        }
        
        if (content && Array.isArray(content) && content.length > 0) {
          processedForms = {
            formi: {
              content: content,
              wordCount: formiData.wordCount || 0,
              characterCount: formiData.characterCount || 0
            }
          };
        }
      }
      // Fallback to legacy forms.formI
      else if (versionData.forms && versionData.forms.formI) {
        const formIData = versionData.forms.formI;
        let content = null;
        
        if (formIData.formi && formIData.formi.content) {
          content = formIData.formi.content;
        } else if (formIData.content) {
          content = formIData.content;
        } else if (formIData.editorContent) {
          content = formIData.editorContent;
        }
        
        if (content && Array.isArray(content) && content.length > 0) {
          processedForms = {
            formi: {
              content: content,
              wordCount: formIData.formi?.wordCount || formIData.wordCount || 0,
              characterCount: formIData.formi?.characterCount || formIData.characterCount || 0
            }
          };
        }
      }
      
      return {
        proposalCode: versionData.proposalCode,
        title: versionData.proposalInfo?.title || 'N/A',
        status: versionData.status || 'ARCHIVED',
        currentVersion: versionData.versionNumber,
        proposalInfo: versionData.proposalInfo || {},
        processedForms,
        isHistoricalVersion: true
      };
    }
    
    return proposal ? { ...proposal, isHistoricalVersion: false } : null;
  };

  const displayData = getDisplayData();

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${isDark ? 'border-slate-700 border-t-white' : 'border-slate-200 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`${textColor} text-lg`}>
            {viewingVersion ? `Loading version ${viewingVersion}...` : 'Loading proposal...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || (!proposal && !versionData)) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`${textColor} text-xl mb-4`}>
            {error || 'Proposal not found'}
          </p>
          <button
            onClick={() => router.push(getDashboardPath())}
            className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-black text-white hover:bg-black/90'}`}
          >
            Back to {getRoleLabel()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Sticky Navigation */}
      <StickyNavigation
        onBack={() => router.push(getDashboardPath())}
        backLabel="Back to Dashboard"
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Add top padding for fixed navigation */}
      <div className="pt-16"></div>

      {/* Version History Panel */}
      <Suspense fallback={null}>
        <VersionHistory
          proposalId={id}
          currentVersion={proposal?.currentVersion || displayData?.currentVersion || 0}
          showVersionHistory={showVersionHistory}
          setShowVersionHistory={setShowVersionHistory}
          theme={theme}
        />
      </Suspense>

      {/* Historical Version Banner */}
      {viewingVersion && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white z-50">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <div>
                  <span className="font-semibold">Viewing Version {viewingVersion}</span>
                  <span className="ml-2 text-amber-100">
                    {versionData?.commitMessage === 'Initial Submission' 
                      ? '(Initial Submission)' 
                      : versionData?.commitMessage ? `(${versionData.commitMessage})` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingVersion(null);
                    setVersionData(null);
                    router.replace(`/proposal/view/${id}`, undefined, { shallow: false });
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Current Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Proposal Banner */}
      {isDraft && !viewingVersion && (
        <div className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white`}>
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PenLine className="w-5 h-5" />
                <div>
                  <span className="font-semibold">Draft Proposal</span>
                  <span className="ml-2 text-slate-300">
                    This proposal has not been submitted yet.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/proposal/create?draft=${id}`)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Edit Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button Panel - Hide for experts who have submitted their review */}
      {!(isExpert && !isCMPDI && !isTSSRC && !isSSRC && !isAdmin && expertHasSubmittedReport) && (
        <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 ${viewingVersion ? 'mt-6' : ''}`}>
          <div className={`${cardBg} rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 ${fabExpanded ? 'w-48' : 'w-14'}`}>
            {/* Toggle Button */}
            <button
              onClick={() => setFabExpanded(!fabExpanded)}
              className={`w-full flex items-center justify-between p-3 transition-colors border-b ${borderColor} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
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
            {/* Version History Button */}
            {quickActions.versions && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                title="Version History"
              >
                <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {fabExpanded && <span className="text-sm font-medium">Versions</span>}
              </button>
            )}

            {/* Only show action buttons when not viewing historical version */}
            {!viewingVersion && (
              <>
                {/* Edit Draft Button - Only for DRAFT proposals */}
                {quickActions.editDraft && (
                  <button
                    onClick={() => router.push(`/proposal/create?draft=${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Edit Draft"
                  >
                    <PenLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Edit Draft</span>}
                  </button>
                )}

                {/* Edit Button - Admin only */}
                {isAdmin && !isDraft && (
                  <button
                    onClick={() => router.push(`/proposal/collaborate/${id}?mode=edit`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Edit Proposal"
                  >
                    <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Edit</span>}
                  </button>
                )}

                {/* Collaborate Button */}
                {quickActions.collaborate && (
                  <button
                    onClick={() => router.push(`/proposal/collaborate/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Collaborate"
                  >
                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Collaborate</span>}
                  </button>
                )}

                {/* Review Button */}
                {quickActions.review && (
                  <button
                    onClick={() => router.push(`/proposal/review/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Review"
                  >
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Review</span>}
                  </button>
                )}

                {/* Track Button */}
                {quickActions.track && (
                  <button
                    onClick={() => router.push(`/proposal/track/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Track Progress"
                  >
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Track</span>}
                  </button>
                )}

                {/* Download Button - Admin only */}
                {isAdmin && !isDraft && (
                  <button
                    onClick={() => {
                      alert('Download feature coming soon!');
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!fabExpanded && 'justify-center'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textColor}`}
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Download</span>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Add top padding to account for fixed navigation */}
      <div className="pt-16"></div>

      {/* Header */}
      <ViewHeader
        proposalCode={displayData?.proposalCode || proposal?.proposalCode}
        projectLeader={displayData?.proposalInfo?.projectLeader || proposal?.projectLeader}
        status={viewingVersion ? `VERSION ${viewingVersion}` : (displayData?.status || 'DRAFT').replace('_', ' ').toUpperCase()}
        version={viewingVersion || proposal?.currentVersion || 1}
        hasDraft={!viewingVersion && proposal?.hasDraft}
        draftVersionLabel={!viewingVersion && proposal?.draftVersionLabel}
        theme={theme}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Proposal Code Section */}
        <div className={`${cardBg} border rounded-xl p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-black'} mb-0.5`}>Proposal Code</label>
                <div className={`text-lg font-bold ${textColor}`}>{displayData?.proposalCode || proposal?.proposalCode || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewingVersion && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  Version {viewingVersion}
                </div>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                viewingVersion 
                  ? isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-black'
                  : (displayData?.status || 'DRAFT').includes('ACCEPTED') || (displayData?.status || 'DRAFT').includes('APPROVED')
                    ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : (displayData?.status || 'DRAFT').includes('REJECTED')
                      ? isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-100 text-red-700 border border-red-200'
                      : (displayData?.status || 'DRAFT').includes('REVIEW')
                        ? isDark ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-700 border border-amber-200'
                        : isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-black'
              }`}>
                {viewingVersion ? 'Historical Version' : (displayData?.status || 'DRAFT').replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Information Section */}
        <ViewProposalInformation proposalInfo={viewingVersion ? displayData?.proposalInfo : proposal} theme={theme} />

        {/* View-Only Editor Section using AdvancedProposalEditor */}
        <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
          {/* Version-specific info banner */}
          {viewingVersion ? (
            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <Clock className={`w-5 h-5 ${textColor} mt-0.5 flex-shrink-0`} />
                <div>
                  <h4 className={`font-semibold ${textColor} mb-1`}>Historical Version</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'} mb-2`}>
                    You are viewing Version {viewingVersion} of this proposal. This is a read-only snapshot of the proposal at that point in time.
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'}`}>
                    <button
                      onClick={() => {
                        setViewingVersion(null);
                        setVersionData(null);
                        router.replace(`/proposal/view/${id}`, undefined, { shallow: false });
                      }}
                      className={`font-semibold underline ${textColor}`}
                    >
                      Click here
                    </button>{' '}
                    to view the current version.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 ${textColor} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className={`font-semibold ${textColor} mb-1`}>View-Only Mode</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'} mb-2`}>
                    This proposal is displayed in read-only mode. You cannot make any changes to the content.
                  </p>
                  {(displayData?.status || proposal?.status) === 'DRAFT' ? (
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'}`}>
                      To make changes, click{' '}
                      <button
                        onClick={() => router.push(`/proposal/create?draft=${id}`)}
                        className={`font-semibold underline ${textColor}`}
                      >
                        Edit Draft
                      </button>{' '}
                      to continue editing.
                    </p>
                  ) : isAIRejected ? (
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'}`}>
                      This proposal was rejected by AI evaluation. You can{' '}
                      <button
                        onClick={() => router.push(`/proposal/create?draft=${id}`)}
                        className={`font-semibold underline ${textColor}`}
                      >
                        edit and resubmit
                      </button>{' '}
                      the proposal.
                    </p>
                  ) : isFinallyRejected ? (
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'}`}>
                      This proposal has been rejected and cannot be modified. You can view it in read-only mode.
                    </p>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-black'}`}>
                      To make changes, please use the{' '}
                      <button
                        onClick={() => router.push(`/proposal/collaborate/${id}`)}
                        className={`font-semibold underline ${textColor}`}
                      >
                        Collaborative Editor
                      </button>{' '}
                      page.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`w-12 h-12 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
                <p className={`${textColor} text-sm`}>Loading editor...</p>
              </div>
            </div>
          }>
            {(displayData?.processedForms || proposal?.processedForms) ? (
              <AdvancedProposalEditor
                mode="view"
                initialContent={displayData?.processedForms || proposal?.processedForms}
                proposalTitle={displayData?.proposalInfo?.title || proposal?.title || 'Form I - Project Proposal'}
                showStats={true}
                readOnly={true}
                theme={theme}
              />
            ) : (
              <div className={`flex items-center justify-center py-12 ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}>
                <div className="text-center">
                  <svg className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className={`${isDark ? 'text-red-300' : 'text-red-800'} font-semibold mb-2`}>No Content Available</p>
                  <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-sm`}>
                    {viewingVersion 
                      ? `Version ${viewingVersion} does not have any Form I content.`
                      : 'This proposal does not have any Form I content yet.'}
                  </p>
                </div>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function ViewProposal() {
  return (
    <ProtectedRoute>
      <ViewProposalContent />
    </ProtectedRoute>
  );
}