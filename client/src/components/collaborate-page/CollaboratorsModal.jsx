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
  const [inviteError, setInviteError] = useState('');

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
    setInviteError('');
    try {
      if (onInvite) {
        await onInvite(inviteEmail);
      }
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Failed to invite:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send invitation';
      setInviteError(errorMessage);
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

  const getRoleBadgeColor = (role) => {
    if (!role) return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
    const colors = {
      'PI': 'bg-blue-500/20 text-blue-600',
      'CI': 'bg-green-500/20 text-green-600',
      'EXPERT_REVIEWER': 'bg-purple-500/20 text-purple-600',
      'CMPDI_MEMBER': 'bg-amber-500/20 text-amber-600',
      'TSSRC_MEMBER': 'bg-cyan-500/20 text-cyan-600',
      'SSRC_MEMBER': 'bg-rose-500/20 text-rose-600',
      'SUPER_ADMIN': 'bg-red-500/20 text-red-600'
    };
    return colors[role.toUpperCase()] || (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black');
  };

  const getRoleShortLabel = (role) => {
    if (!role) return 'USER';
    const labels = {
      'PI': 'PI',
      'CI': 'CI',
      'EXPERT_REVIEWER': 'EXPERT',
      'CMPDI_MEMBER': 'CMPDI',
      'TSSRC_MEMBER': 'TSSRC',
      'SSRC_MEMBER': 'SSRC',
      'SUPER_ADMIN': 'ADMIN'
    };
    return labels[role.toUpperCase()] || role;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`relative ${modalBg} rounded-lg shadow-xl max-w-md w-full mx-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className={`text-lg font-semibold ${textColor}`}>Collaborators ({collaborators.length})</h2>
          </div>
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
                    <div className={`w-10 h-10 ${isDark ? 'bg-white/20' : 'bg-black/10'} rounded-full flex items-center justify-center text-sm font-semibold ${textColor}`}>
                      {collaborator.user?.fullName?.charAt(0) || collaborator.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${textColor}`}>
                        {collaborator.user?.fullName || collaborator.fullName || 'Unknown'}
                      </div>
                      <div className={`text-xs ${textColor} opacity-70`}>
                        {collaborator.user?.email || collaborator.email || ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(collaborator.role)}`}>
                      {getRoleShortLabel(collaborator.role)}
                    </span>
                    {collaborator.isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Section */}
        {canInvite && (
          <div className={`p-4 border-t ${borderColor}`}>
            {currentCICount >= 5 ? (
              <div className={`flex items-center gap-2 justify-center ${textColor} text-sm`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Maximum 5 co-investigators reached.</span>
              </div>
            ) : showInviteForm ? (
              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 border ${inputBg} rounded-lg text-sm ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  />
                  {inviteError && (
                    <p className="mt-1 text-xs text-red-500">{inviteError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || isInviting}
                    className={`flex-1 px-4 py-2 ${buttonBg} text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {isInviting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Invite
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowInviteForm(false); setInviteEmail(''); setInviteError(''); }}
                    className={`px-4 py-2 border ${borderColor} ${textColor} text-sm rounded-lg ${hoverBg} transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
                <p className={`text-xs ${textColor} opacity-70 flex items-center gap-1`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {5 - currentCICount} invitation(s) remaining. Only researchers can be invited as CI.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowInviteForm(true)}
                className={`w-full px-4 py-2 border border-dashed ${borderColor} ${textColor} text-sm rounded-lg ${hoverBg} transition-colors flex items-center justify-center gap-2`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
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
