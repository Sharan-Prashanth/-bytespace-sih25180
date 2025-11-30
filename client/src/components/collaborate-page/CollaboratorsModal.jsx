'use client';

import { useState } from 'react';

const CollaboratorsModal = ({ 
  isOpen, 
  onClose, 
  collaborators = [],
  canInvite = false,
  onInvite,
  currentCICount = 0 
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

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
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black">Collaborators</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className="text-center text-black text-sm py-4">No collaborators yet.</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator, index) => (
                <div 
                  key={collaborator._id || collaborator.id || index}
                  className="flex items-center justify-between p-3 bg-black/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-sm font-semibold text-black">
                      {collaborator.user?.fullName?.charAt(0) || collaborator.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black">
                        {collaborator.user?.fullName || collaborator.fullName || 'Unknown'}
                      </div>
                      <div className="text-xs text-black">
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
          <div className="p-4 border-t border-black/10">
            {currentCICount >= 5 ? (
              <p className="text-sm text-black text-center">Maximum 5 co-investigators reached.</p>
            ) : showInviteForm ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || isInviting}
                    className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                  >
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    onClick={() => { setShowInviteForm(false); setInviteEmail(''); }}
                    className="px-4 py-2 border border-black/20 text-black text-sm rounded-lg hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-black">{5 - currentCICount} invitation(s) remaining</p>
              </div>
            ) : (
              <button
                onClick={() => setShowInviteForm(true)}
                className="w-full px-4 py-2 border border-dashed border-black/30 text-black text-sm rounded-lg hover:bg-black/5 transition-colors"
              >
                Invite Co-Investigator
              </button>
            )}
          </div>
        )}

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

export default CollaboratorsModal;
