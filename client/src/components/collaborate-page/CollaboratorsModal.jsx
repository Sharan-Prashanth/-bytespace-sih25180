'use client';

import { useState } from 'react';

const CollaboratorsModal = ({ 
  isOpen, 
  onClose, 
  collaborators = [],
  canInvite = false,
  onInvite,
  currentCICount = 0,
  theme = 'light'
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const itemBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/20';
  const buttonBg = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      if (onInvite) {
        await onInvite(inviteEmail);
      }
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    const roleMap = {
      'PI': 'Principal Investigator',
      'CI': 'Co-Investigator',
      'EXPERT_REVIEWER': 'Expert Reviewer',
      'CMPDI_MEMBER': 'CMPDI Member',
      'TSSRC_MEMBER': 'TSSRC Member',
      'SSRC_MEMBER': 'SSRC Member',
      'SUPER_ADMIN': 'Super Admin'
    };
    return roleMap[role.toUpperCase()] || role.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`relative ${modalBg} rounded-lg shadow-xl max-w-md w-full mx-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
          <h2 className={`text-lg font-semibold ${textColor}`}>Collaborators</h2>
          <button onClick={onClose} className={`p-1 ${hoverBg} rounded transition-colors`}>
            <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className={`text-center ${textColor} text-sm py-4`}>No collaborators yet.</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator, index) => (
                <div 
                  key={collaborator._id || collaborator.id || index}
                  className={`flex items-center justify-between p-3 ${itemBg} rounded-lg`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${isDark ? 'bg-white/20' : 'bg-black/10'} rounded-full flex items-center justify-center text-sm font-semibold ${textColor}`}>
                      {collaborator.user?.fullName?.charAt(0) || collaborator.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${textColor}`}>
                        {collaborator.user?.fullName || collaborator.fullName || 'Unknown'}
                      </div>
                      <div className={`text-xs ${textColor}`}>
                        {formatRole(collaborator.role)}
                      </div>
                    </div>
                  </div>
                  {collaborator.isOnline && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Section */}
        {canInvite && (
          <div className={`p-4 border-t ${borderColor}`}>
            {currentCICount >= 5 ? (
              <p className={`text-sm ${textColor} text-center`}>Maximum 5 co-investigators reached.</p>
            ) : showInviteForm ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-3 py-2 border ${inputBg} rounded-lg text-sm ${textColor} focus:outline-none focus:ring-1 focus:ring-white/20`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || isInviting}
                    className={`flex-1 px-4 py-2 ${buttonBg} text-sm font-medium rounded-lg transition-colors disabled:opacity-50`}
                  >
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    onClick={() => { setShowInviteForm(false); setInviteEmail(''); }}
                    className={`px-4 py-2 border ${borderColor} ${textColor} text-sm rounded-lg ${hoverBg} transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
                <p className={`text-xs ${textColor}`}>{5 - currentCICount} invitation(s) remaining</p>
              </div>
            ) : (
              <button
                onClick={() => setShowInviteForm(true)}
                className={`w-full px-4 py-2 border border-dashed ${borderColor} ${textColor} text-sm rounded-lg ${hoverBg} transition-colors`}
              >
                Invite Co-Investigator
              </button>
            )}
          </div>
        )}

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

export default CollaboratorsModal;
