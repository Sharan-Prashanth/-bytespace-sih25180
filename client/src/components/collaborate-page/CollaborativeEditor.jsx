'use client';

// User color palette for collaboration indicators
const USER_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#06b6d4', '#a855f7', '#ef4444',
];

const getUserColor = (userId) => {
  if (!userId) return USER_COLORS[0];
  let hash = 0;
  const idStr = String(userId);
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

const getRoleShortLabel = (role) => {
  if (!role) return '';
  const labels = {
    'PI': 'PI',
    'CI': 'CI',
    'EXPERT_REVIEWER': 'Expert',
    'CMPDI_MEMBER': 'CMPDI',
    'TSSRC_MEMBER': 'TSSRC',
    'SSRC_MEMBER': 'SSRC',
    'SUPER_ADMIN': 'Admin',
    'USER': ''
  };
  return labels[role.toUpperCase()] || '';
};

const CollaborativeEditor = ({ 
  canEdit = false,
  canComment = false,
  isSuggestionMode = false,
  onlineUsers = [],
  onShowOnlineUsers,
  onSaveChanges,
  children,
  theme = 'light'
}) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const btnBg = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';

  // For investigators (PI/CI), no badge is shown
  // For reviewers/committee, show suggestion mode indicator
  const getModeBadge = () => {
    if (canEdit) {
      return null;
    } else if (canComment || isSuggestionMode) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
          <svg className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            View Only - Use Comments Panel to Add Feedback
          </span>
        </div>
      );
    }
    return null;
  };

  // Render online users avatars with colors
  const renderOnlineAvatars = () => {
    if (!onlineUsers || onlineUsers.length === 0) return null;
    
    const displayUsers = onlineUsers.slice(0, 4);
    const remainingCount = onlineUsers.length - 4;
    
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayUsers.map((user, index) => {
            const color = getUserColor(user._id || user.id);
            const roleLabel = getRoleShortLabel(user.role);
            return (
              <div
                key={user._id || user.id || index}
                className="relative group"
                title={`${user.fullName || user.name}${roleLabel ? ` (${roleLabel})` : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-slate-800"
                  style={{ backgroundColor: color }}
                >
                  {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {user.fullName || user.name}
                  {roleLabel && <span className="text-white/70 ml-1">({roleLabel})</span>}
                </div>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-slate-800 ${isDark ? 'bg-slate-600 text-white' : 'bg-black/20 text-black'}`}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-semibold ${textColor}`}>Form I - Project Proposal</h2>
        </div>
        <div className="flex items-center gap-3">
          {getModeBadge()}
          
          {/* Online Users Avatars */}
          {renderOnlineAvatars()}
          
          {/* Online Users Button */}
          <button
            onClick={onShowOnlineUsers}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm border ${borderColor} rounded-lg ${hoverBg} transition-colors`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={textColor}>{onlineUsers.length} online</span>
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className={`border ${borderColor} rounded-lg`}>
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className={`w-12 h-12 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
              <p className={`${textColor} text-sm`}>Loading editor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Changes Button - Below Editor, only for PI/CI */}
      {onSaveChanges && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onSaveChanges}
            className={`px-6 py-2.5 ${btnBg} font-medium rounded-lg transition-colors flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;
