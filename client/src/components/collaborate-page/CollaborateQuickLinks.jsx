'use client';

import { useRouter } from 'next/router';

const CollaborateQuickLinks = ({ 
  proposalId, 
  showVersionHistory, 
  setShowVersionHistory,
  showTeamChat,
  setShowTeamChat,
  showReviewButton = false,
  theme = 'light'
}) => {
  const router = useRouter();

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const activeBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const iconHoverBg = isDark ? 'group-hover:bg-white/20' : 'group-hover:bg-black/10';

  // Determine grid columns based on whether review button is shown
  const gridCols = showReviewButton ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      <h2 className={`text-xl font-semibold ${textColor} mb-4`}>Quick Actions</h2>
      
      <div className={`grid ${gridCols} gap-4`}>
        {/* Version History - Opens panel */}
        <button
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className={`flex items-center p-4 border rounded-lg transition-colors group ${
            showVersionHistory 
              ? `${isDark ? 'border-white' : 'border-black'} ${activeBg}` 
              : `${borderColor} ${hoverBg}`
          }`}
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 transition-colors ${
            showVersionHistory ? (isDark ? 'bg-white/20' : 'bg-black/10') : `${iconBg} ${iconHoverBg}`
          }`}>
            <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className={`font-semibold ${textColor} mb-1`}>Version History</div>
            <div className={`text-sm ${textColor}`}>
              {showVersionHistory ? 'Panel open' : 'View all versions'}
            </div>
          </div>
        </button>

        {/* Team Chat - Opens panel */}
        <button
          onClick={() => setShowTeamChat(!showTeamChat)}
          className={`flex items-center p-4 border rounded-lg transition-colors group ${
            showTeamChat 
              ? `${isDark ? 'border-white' : 'border-black'} ${activeBg}` 
              : `${borderColor} ${hoverBg}`
          }`}
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 transition-colors ${
            showTeamChat ? (isDark ? 'bg-white/20' : 'bg-black/10') : `${iconBg} ${iconHoverBg}`
          }`}>
            <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-left">
            <div className={`font-semibold ${textColor} mb-1`}>Team Chat</div>
            <div className={`text-sm ${textColor}`}>
              {showTeamChat ? 'Panel open' : 'Chat with team'}
            </div>
          </div>
        </button>

        {/* Track Progress - Navigates to track page */}
        <button
          onClick={() => router.push(`/proposal/track/${proposalId}`)}
          className={`flex items-center p-4 border ${borderColor} rounded-lg ${hoverBg} transition-colors group`}
        >
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4 ${iconHoverBg} transition-colors`}>
            <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-left">
            <div className={`font-semibold ${textColor} mb-1`}>Track Progress</div>
            <div className={`text-sm ${textColor}`}>Monitor review status</div>
          </div>
        </button>

        {/* Review - Only for reviewers and committee members */}
        {showReviewButton && (
          <button
            onClick={() => router.push(`/proposal/review/${proposalId}`)}
            className={`flex items-center p-4 border ${borderColor} rounded-lg ${hoverBg} transition-colors group`}
          >
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4 ${iconHoverBg} transition-colors`}>
              <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className={`font-semibold ${textColor} mb-1`}>Review</div>
              <div className={`text-sm ${textColor}`}>Submit your review</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default CollaborateQuickLinks;
