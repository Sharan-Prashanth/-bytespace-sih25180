'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getProposalById } from '../../../utils/proposalApi';
import apiClient from '../../../utils/api';
import { Edit, Users, FileText, MessageSquare, Download, ChevronUp, ChevronDown, Clock, ArrowLeft } from 'lucide-react';

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
    if (isAdmin) return '/dashboard/admin';
    if (isExpert) return '/dashboard/expert';
    if (isCMPDI) return '/dashboard/cmpdi';
    if (isTSSRC) return '/dashboard/tssrc';
    if (isSSRC) return '/dashboard/ssrc';
    return '/dashboard'; // Default for regular users
  };

  // Get role-specific label
  const getRoleLabel = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isExpert) return 'Expert Dashboard';
    if (isCMPDI) return 'CMPDI Dashboard';
    if (isTSSRC) return 'TSSRC Dashboard';
    if (isSSRC) return 'SSRC Dashboard';
    return 'Dashboard';
  };

  // Button visibility based on roles:
  // user - collaborate, track
  // expert - collaborate, track, review
  // cmpdi - collaborate, track, review
  // admin - everything (edit, collaborate, track, review, download)
  // tssrc, ssrc - collaborate, track, review
  const showEdit = isAdmin;
  const showCollaborate = true; // Will be conditionally shown based on status below
  const showReview = isAdmin || isExpert || isCMPDI || isTSSRC || isSSRC;
  const showTrack = true; // Everyone can track
  const showDownload = isAdmin;
  
  // Check if proposal is finally rejected (cannot collaborate)
  const isFinallyRejected = proposal && ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(proposal.status);
  const isAIRejected = proposal && proposal.status === 'AI_REJECTED';

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
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.message || 'Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id, versionParam]);

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
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg">
            {viewingVersion ? `Loading version ${viewingVersion}...` : 'Loading proposal...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || (!proposal && !versionData)) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-black text-xl mb-4">
            {error || 'Proposal not found'}
          </p>
          <button
            onClick={() => router.push(getDashboardPath())}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Back to {getRoleLabel()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/5">
      {/* Version History Panel */}
      <Suspense fallback={null}>
        <VersionHistory
          proposalId={id}
          currentVersion={proposal?.currentVersion || displayData?.currentVersion || 0}
          showVersionHistory={showVersionHistory}
          setShowVersionHistory={setShowVersionHistory}
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
                    // Clear version state and navigate to current version
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

      {/* Floating Action Button Panel - Fixed position, scrolls with user */}
      <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 ${viewingVersion ? 'mt-6' : ''}`}>
        <div className={`bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden transition-all duration-300 ${fabExpanded ? 'w-48' : 'w-14'}`}>
          {/* Toggle Button */}
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors border-b border-black/10"
          >
            {fabExpanded && <span className="text-sm font-semibold text-black">Actions</span>}
            {fabExpanded ? (
              <ChevronDown className="w-5 h-5 text-black" />
            ) : (
              <ChevronUp className="w-5 h-5 text-black mx-auto" />
            )}
          </button>

          {/* Action Buttons */}
          <div className="p-2 space-y-1">
            {/* Version History Button */}
            <button
              onClick={() => setShowVersionHistory(true)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
              title="Version History"
            >
              <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {fabExpanded && <span className="text-sm font-medium">Versions</span>}
            </button>

            {/* Only show action buttons when not viewing historical version */}
            {!viewingVersion && (
              <>
                {/* Edit Button - Admin only */}
                {showEdit && (
                  <button
                    onClick={() => router.push(`/proposal/collaborate/${id}?mode=edit`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                    title="Edit Proposal"
                  >
                    <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Edit</span>}
                  </button>
                )}

                {/* Collaborate Button - Everyone except finally rejected */}
                {showCollaborate && !isFinallyRejected && (
                  <button
                    onClick={() => router.push(`/proposal/collaborate/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                    title="Collaborate"
                  >
                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Collaborate</span>}
                  </button>
                )}

                {/* Review Button - Expert, CMPDI, TSSRC, SSRC, Admin */}
                {showReview && (
                  <button
                    onClick={() => router.push(`/proposal/review/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                    title="Review"
                  >
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Review</span>}
                  </button>
                )}

                {/* Track Button - Everyone */}
                {showTrack && (
                  <button
                    onClick={() => router.push(`/proposal/track/${id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
                    title="Track Progress"
                  >
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {fabExpanded && <span className="text-sm font-medium">Track</span>}
                  </button>
                )}

                {/* Download Button - Admin only */}
                {showDownload && (
                  <button
                    onClick={() => {
                      alert('Download feature coming soon!');
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
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

      {/* Header with Back Button */}
      <div className={`bg-white border-b border-black/10 ${viewingVersion ? 'mt-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => {
              if (viewingVersion) {
                // Clear version state and navigate to current version
                setViewingVersion(null);
                setVersionData(null);
                router.replace(`/proposal/view/${id}`, undefined, { shallow: false });
              } else {
                router.push(getDashboardPath());
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-black/20 text-black rounded-lg hover:bg-black/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {viewingVersion ? 'Back to Current Version' : `Back to ${getRoleLabel()}`}
          </button>
        </div>
      </div>

      {/* Header */}
      <ViewHeader
        proposalCode={displayData?.proposalCode || proposal?.proposalCode}
        projectLeader={displayData?.proposalInfo?.projectLeader || proposal?.projectLeader}
        status={viewingVersion ? `VERSION ${viewingVersion}` : (displayData?.status || 'DRAFT').replace('_', ' ').toUpperCase()}
        version={viewingVersion || proposal?.currentVersion || 1}
        hasDraft={!viewingVersion && proposal?.hasDraft}
        draftVersionLabel={!viewingVersion && proposal?.draftVersionLabel}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Proposal Code Section */}
        <div className="bg-white border border-black/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Proposal Code</label>
              <div className="text-lg font-bold text-black">{displayData?.proposalCode || proposal?.proposalCode || 'N/A'}</div>
            </div>
            <div className="flex items-center gap-2">
              {viewingVersion && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Version {viewingVersion}
                </div>
              )}
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 text-black">
                {viewingVersion ? 'Historical Version' : (displayData?.status || 'DRAFT').replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Information Section */}
        <ViewProposalInformation proposalInfo={viewingVersion ? displayData?.proposalInfo : proposal} />

        {/* View-Only Editor Section using AdvancedProposalEditor */}
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
          {/* Version-specific info banner */}
          {viewingVersion ? (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Historical Version</h4>
                  <p className="text-sm text-amber-800 mb-2">
                    You are viewing Version {viewingVersion} of this proposal. This is a read-only snapshot of the proposal at that point in time.
                  </p>
                  <p className="text-sm text-amber-800">
                    <button
                      onClick={() => {
                        setViewingVersion(null);
                        setVersionData(null);
                        router.replace(`/proposal/view/${id}`, undefined, { shallow: false });
                      }}
                      className="font-semibold underline hover:text-amber-900"
                    >
                      Click here
                    </button>{' '}
                    to view the current version.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">View-Only Mode</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    This proposal is displayed in read-only mode. You cannot make any changes to the content.
                  </p>
                  {(displayData?.status || proposal?.status) === 'DRAFT' ? (
                    <p className="text-sm text-blue-800">
                      To make changes, please continue editing on the{' '}
                      <button
                        onClick={() => router.push('/proposal/create')}
                        className="font-semibold underline hover:text-blue-900"
                      >
                        Create Proposal
                      </button>{' '}
                      page.
                    </p>
                  ) : isAIRejected ? (
                    <p className="text-sm text-blue-800">
                      This proposal was rejected by AI evaluation. You can{' '}
                      <button
                        onClick={() => router.push('/proposal/create')}
                        className="font-semibold underline hover:text-blue-900"
                      >
                        edit and resubmit
                      </button>{' '}
                      the proposal.
                    </p>
                  ) : isFinallyRejected ? (
                    <p className="text-sm text-blue-800">
                      This proposal has been rejected and cannot be modified. You can view it in read-only mode.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-800">
                      To make changes, please use the{' '}
                      <button
                        onClick={() => router.push(`/proposal/collaborate/${id}`)}
                        className="font-semibold underline hover:text-blue-900"
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
                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-black text-sm">Loading editor...</p>
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
              />
            ) : (
              <div className="flex items-center justify-center py-12 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-800 font-semibold mb-2">No Content Available</p>
                  <p className="text-red-600 text-sm">
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