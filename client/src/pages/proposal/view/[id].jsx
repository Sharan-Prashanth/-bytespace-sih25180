'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getProposalById } from '../../../utils/proposalApi';

// Lazy load heavy components
const AdvancedProposalEditor = lazy(() => import('../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor'));

// Import view-specific components
import ViewHeader from '../../../components/view-page/ViewHeader';
import ViewProposalInformation from '../../../components/view-page/ViewProposalInformation';
import QuickLinks from '../../../components/view-page/QuickLinks';

function ViewProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProposalById(id);
        const proposalData = response.data;
        
        console.log('Proposal loaded:', proposalData.proposalCode);
        console.log('Forms available:', proposalData.forms ? Object.keys(proposalData.forms) : 'none');
        console.log('Full forms structure:', JSON.stringify(proposalData.forms, null, 2));
        
        // Process forms data to match AdvancedProposalEditor expectations
        // Editor expects EXACT format from create.jsx: { formi: { content: [...] } }
        // NOT { formI: { editorContent: [...] } }
        let processedForms = null;
        if (proposalData.forms && proposalData.forms.formI) {
          const formIData = proposalData.forms.formI;
          
          console.log('FormI structure:', {
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
          console.error('No formI found in proposal.forms');
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
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg">Loading proposal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !proposal) {
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
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/5">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-black/20 text-black rounded-lg hover:bg-black/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Header */}
      <ViewHeader
        proposalCode={proposal.proposalCode}
        projectLeader={proposal.projectLeader}
        status={(proposal.status || 'DRAFT').replace('_', ' ').toUpperCase()}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Proposal Code Section */}
        <div className="bg-white border border-black/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Proposal Code</label>
              <div className="text-lg font-bold text-black">{proposal.proposalCode || 'N/A'}</div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 text-black">
              {(proposal.status || 'DRAFT').replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Proposal Information Section */}
        <ViewProposalInformation proposalInfo={proposal} />

        {/* View-Only Editor Section using AdvancedProposalEditor */}
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
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
                {proposal.status === 'DRAFT' ? (
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

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-black text-sm">Loading editor...</p>
              </div>
            </div>
          }>
            {proposal.processedForms ? (
              <AdvancedProposalEditor
                mode="view"
                initialContent={proposal.processedForms}
                proposalTitle={proposal.title || 'Form I - Project Proposal'}
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
                  <p className="text-red-600 text-sm">This proposal does not have any Form I content yet.</p>
                </div>
              </div>
            )}
          </Suspense>
        </div>

        {/* Quick Links Section */}
        <QuickLinks proposalId={id} status={proposal.status} />
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