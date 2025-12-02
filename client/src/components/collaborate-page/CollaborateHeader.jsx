'use client';

import { useRouter } from 'next/router';

const CollaborateHeader = ({ 
  proposalCode, 
  onlineCount = 0, 
  collaboratorCount = 0,
  onCollaboratorsClick,
  theme = 'light'
}) => {
  const router = useRouter();

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const bgClass = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  return (
    <div className={`${bgClass} border-b ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className={`px-4 py-2 text-sm border ${borderColor} ${textColor} rounded-lg ${hoverBg} transition-colors`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </span>
          </button>
          {proposalCode && (
            <div className={`text-sm ${textColor}`}>
              Code: <span className="font-mono font-semibold">{proposalCode}</span>
            </div>
          )}
        </div>
        <button
          onClick={onCollaboratorsClick}
          className={`flex items-center gap-2 px-4 py-2 text-sm border ${borderColor} ${textColor} rounded-lg ${hoverBg} transition-colors`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{collaboratorCount} Collaborators</span>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {onlineCount} online
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CollaborateHeader;
