'use client';

const ProposalMetadata = ({ proposalCode, status, version, hasDraft, draftVersionLabel, theme = 'light' }) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const badgeBg = isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black';

  const getStatusLabel = (status) => {
    if (!status) return 'DRAFT';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className={`${cardBg} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div>
          <label className={`block text-xs font-semibold ${textColor} mb-1`}>Proposal Code</label>
          <div className={`text-lg font-bold ${textColor} font-mono`}>{proposalCode || 'N/A'}</div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className={`block text-xs font-semibold ${textColor} mb-1`}>Version</label>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${textColor}`}>v{version || '1'}</span>
              {hasDraft && (
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium rounded">
                  {draftVersionLabel || 'Draft'}
                </span>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeBg}`}>
            {getStatusLabel(status)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalMetadata;
