'use client';

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { ChevronDown, ExternalLink, Info } from 'lucide-react';

// Lazy load the editor for performance
const AdvancedProposalEditor = lazy(() => 
  import('@/components/ProposalEditor/editor (our files)/AdvancedProposalEditor')
);

const ReviewEditorSection = ({ 
  proposalId,
  proposal,
  defaultOpen = false 
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleGoToCollaborate = () => {
    router.push(`/proposal/collaborate/${proposalId}`);
  };

  // Process forms data to match AdvancedProposalEditor expectations
  // Editor expects format: { formi: { content: [...] } }
  const processedForms = useMemo(() => {
    if (!proposal) return null;

    console.log('ReviewEditorSection - Processing proposal forms:', {
      hasFormi: !!proposal.formi,
      hasForms: !!proposal.forms,
      formiType: typeof proposal.formi,
      formsType: typeof proposal.forms
    });

    // First check for the new single formi field (new schema)
    if (proposal.formi) {
      const formiData = proposal.formi;
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
        return {
          formi: {
            content: content,
            wordCount: formiData.wordCount || 0,
            characterCount: formiData.characterCount || 0
          }
        };
      }
    }

    // Fallback to legacy forms.formI structure (old schema)
    if (proposal.forms && proposal.forms.formI) {
      const formIData = proposal.forms.formI;
      let content = null;

      // Try nested structure: forms.formI.formi.content (MongoDB structure)
      if (formIData.formi && formIData.formi.content) {
        content = formIData.formi.content;
        console.log('Found nested formi.content structure in forms.formI');
      }
      // Try direct content
      else if (formIData.content) {
        content = formIData.content;
        console.log('Found direct content structure in forms.formI');
      }
      // Try editorContent
      else if (formIData.editorContent) {
        content = formIData.editorContent;
        console.log('Found editorContent structure in forms.formI');
      }

      if (content && Array.isArray(content) && content.length > 0) {
        return {
          formi: {
            content: content,
            wordCount: formIData.formi?.wordCount || formIData.wordCount || 0,
            characterCount: formIData.formi?.characterCount || formIData.characterCount || 0
          }
        };
      }
    }

    console.log('No valid form content found');
    return null;
  }, [proposal]);

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black">Proposal Contents</h2>
            <p className="text-sm text-black mt-0.5">View all forms and documents</p>
          </div>
        </div>
        <button className="p-1 hover:bg-black/5 rounded transition-colors">
          <ChevronDown 
            className={`w-5 h-5 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4">
          {/* Info Banner */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">View-Only Mode</h4>
                <p className="text-sm text-blue-800 mb-2">
                  This proposal is displayed in read-only mode. To make comments or suggestions directly on the document, please use the Collaborate page.
                </p>
                <button
                  onClick={handleGoToCollaborate}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Go to Collaborate</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Editor in View Mode */}
          <div className="border border-black/10 rounded-lg overflow-hidden">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12 bg-black/5">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-black">Loading editor...</p>
                </div>
              </div>
            }>
              {processedForms ? (
                <AdvancedProposalEditor
                  mode="view"
                  proposalId={proposalId}
                  initialContent={processedForms}
                  proposalTitle={proposal?.title || 'Form I - Project Proposal'}
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
                      This proposal does not have any Form I content yet.
                    </p>
                  </div>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewEditorSection;
