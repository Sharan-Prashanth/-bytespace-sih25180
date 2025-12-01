'use client';

const OnlineUsersModal = ({ isOpen, onClose, onlineUsers = [] }) => {
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
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <h2 className="text-lg font-semibold text-black">Online Users ({onlineUsers.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <p className="text-center text-black text-sm py-4">No users online.</p>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map((user, index) => (
                <div 
                  key={user._id || user.id || index}
                  className="flex items-center gap-3 p-2 bg-black/5 rounded-lg"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-sm font-semibold text-black">
                      {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black">{user.fullName || 'Unknown'}</div>
                    <div className="text-xs text-black">{formatRole(user.role)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersModal;
