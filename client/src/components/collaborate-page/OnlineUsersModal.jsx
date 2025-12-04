'use client';

const OnlineUsersModal = ({ isOpen, onClose, onlineUsers = [], theme = 'light' }) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const itemBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const buttonBg = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';

  if (!isOpen) return null;

  const formatRole = (role) => {
    if (!role) return 'User';
    const roleMap = {
      'PI': 'Principal Investigator',
      'CI': 'Co-Investigator',
      'EXPERT_REVIEWER': 'Expert Reviewer',
      'CMPDI_MEMBER': 'CMPDI Member',
      'TSSRC_MEMBER': 'TSSRC Member',
      'SSRC_MEMBER': 'SSRC Member',
      'SUPER_ADMIN': 'Super Admin',
      'USER': 'User'
    };
    return roleMap[role.toUpperCase()] || role.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`relative ${modalBg} rounded-lg shadow-xl max-w-sm w-full mx-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <h2 className={`text-lg font-semibold ${textColor}`}>Online Users ({onlineUsers.length})</h2>
          </div>
          <button onClick={onClose} className={`p-1 ${hoverBg} rounded transition-colors`}>
            <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <p className={`text-center ${textColor} text-sm py-4`}>No users online.</p>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map((user, index) => (
                <div 
                  key={user._id || user.id || index}
                  className={`flex items-center gap-3 p-2 ${itemBg} rounded-lg`}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 ${isDark ? 'bg-white/20' : 'bg-black/10'} rounded-full flex items-center justify-center text-sm font-semibold ${textColor}`}>
                      {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 border ${isDark ? 'border-slate-800' : 'border-white'} rounded-full`}></span>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${textColor}`}>{user.fullName || 'Unknown'}</div>
                    <div className={`text-xs ${textColor}`}>{formatRole(user.role)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${borderColor}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 ${buttonBg} text-sm font-medium rounded-lg transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersModal;
