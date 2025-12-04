import React from 'react';

const ViewHeader = ({ proposalCode, projectLeader, status, version, hasDraft, draftVersionLabel, theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  
  // Theme-aware styles
  const bgClass = theme === 'darkest' 
    ? 'bg-neutral-900 border-neutral-800' 
    : theme === 'dark' 
      ? 'bg-slate-800 border-slate-700' 
      : 'bg-white border-slate-200';
  
  const textColor = isDark ? 'text-white' : 'text-black';
  const textMuted = isDark ? 'text-slate-400' : 'text-black';
  const dividerColor = isDark ? 'text-slate-600' : 'text-slate-300';
  const draftBadge = isDark 
    ? 'bg-slate-700 border-slate-600 text-white' 
    : 'bg-slate-100 border-slate-300 text-black';

  return (
    <div className={`${bgClass} border-b`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`text-3xl font-bold ${textColor}`}>View Proposal</h1>
            </div>
            <div className={`flex items-center gap-4 text-sm ${textMuted}`}>
              <span>Code: <span className={`font-semibold ${textColor}`}>{proposalCode}</span></span>
              <span className={dividerColor}>|</span>
              <span>Leader: <span className={`font-semibold ${textColor}`}>{projectLeader}</span></span>
              <span className={dividerColor}>|</span>
              <span className="flex items-center gap-2">
                Version: <span className={`font-semibold ${textColor}`}>v{version || 1}</span>
                {hasDraft && (
                  <span className={`px-2 py-0.5 ${draftBadge} border text-xs font-medium rounded`}>
                    {draftVersionLabel || 'Draft'}
                  </span>
                )}
              </span>
              <span className={dividerColor}>|</span>
              <span>Status: <span className={`font-semibold ${textColor}`}>{status}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewHeader;
