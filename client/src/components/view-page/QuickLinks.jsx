import React from 'react';
import { useRouter } from 'next/router';

const QuickLinks = ({ proposalId, status, currentVersion }) => {
  const router = useRouter();
  const isDraft = status === 'DRAFT';
  const isAIRejected = status === 'AI_REJECTED';
  const isFinallyRejected = ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(status);
  
  // Check if this is a draft version (x.1 format or version 0.1)
  const isDraftVersion = currentVersion === 0.1 || (currentVersion && currentVersion % 1 !== 0);
  
  // Can collaborate only if not a final rejection and not a draft
  const canCollaborate = !isFinallyRejected && !isDraft;
  // Can edit in create page only for DRAFT or AI_REJECTED
  const canEdit = isDraft || isAIRejected;
  // Show versions only for submitted proposals (not drafts)
  const showVersions = !isDraft && !isDraftVersion;

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Quick Actions</h2>
      
      {/* Show rejection message for finally rejected proposals */}
      {isFinallyRejected && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Proposal Rejected</h4>
              <p className="text-sm text-red-800">
                This proposal has been rejected and cannot be modified further. You can still view the proposal and track its history.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Edit Link - for DRAFT or AI_REJECTED (goes to create page) */}
        {canEdit && (
          <button
            onClick={() => router.push(`/proposal/create?draft=${proposalId}`)}
            className="flex items-center p-4 border border-black/20 rounded-lg hover:bg-black/5 transition-colors group"
          >
            <div className="w-12 h-12 bg-black/5 rounded-lg flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-black mb-1">
                {isAIRejected ? 'Edit & Resubmit' : 'Continue Editing'}
              </div>
              <div className="text-sm text-black">
                {isAIRejected ? 'Modify and submit again' : 'Resume work on this draft'}
              </div>
            </div>
          </button>
        )}
        
        {/* Collaborate Link - for submitted proposals (not drafts, not finally rejected) */}
        {canCollaborate && (
          <button
            onClick={() => router.push(`/proposal/collaborate/${proposalId}`)}
            className="flex items-center p-4 border border-black/20 rounded-lg hover:bg-black/5 transition-colors group"
          >
            <div className="w-12 h-12 bg-black/5 rounded-lg flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-black mb-1">Collaborate</div>
              <div className="text-sm text-black">Work with team members</div>
            </div>
          </button>
        )}

        {/* Track Link */}
        <button
          onClick={() => router.push(`/proposal/track/${proposalId}`)}
          className={`flex items-center p-4 border border-black/20 rounded-lg hover:bg-black/5 transition-colors group ${(isFinallyRejected && !canCollaborate && !canEdit) || (!canCollaborate && !canEdit && !showVersions) ? 'md:col-span-2' : ''}`}
        >
          <div className="w-12 h-12 bg-black/5 rounded-lg flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-semibold text-black mb-1">Track Progress</div>
            <div className="text-sm text-black">Monitor review status</div>
          </div>
        </button>

        {/* Versions Link - only for submitted proposals (not drafts) */}
        {showVersions && (
          <button
            onClick={() => router.push(`/proposal/versions/${proposalId}`)}
            className="flex items-center p-4 border border-black/20 rounded-lg hover:bg-black/5 transition-colors group"
          >
            <div className="w-12 h-12 bg-black/5 rounded-lg flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-black mb-1">Version History</div>
              <div className="text-sm text-black">View previous versions</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickLinks;
