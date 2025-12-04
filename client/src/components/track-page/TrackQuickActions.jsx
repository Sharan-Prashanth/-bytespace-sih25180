'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Eye, Users, Clock, ClipboardCheck } from 'lucide-react';

const TrackQuickActions = ({ 
  proposalId,
  userRoles = [],
  isPI = false,
  isCI = false,
  isRejected = false,
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
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const iconHoverBg = isDark ? 'group-hover:bg-white/20' : 'group-hover:bg-black/10';

  // Check if user is a reviewer or committee member
  const isReviewer = userRoles.some(role => 
    ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
  );

  // All users can access collaborate unless rejected
  const canAccessCollaborate = !isRejected;

  const actions = [
    {
      label: 'Versions',
      description: 'View version history',
      icon: <Clock className={`w-6 h-6 ${textColor}`} />,
      onClick: () => router.push(`/proposal/view/${proposalId}?tab=versions`),
      visible: true
    },
    {
      label: 'Collaborate',
      description: 'Work with team members',
      icon: <Users className={`w-6 h-6 ${textColor}`} />,
      onClick: () => router.push(`/proposal/collaborate/${proposalId}`),
      visible: canAccessCollaborate
    },
    {
      label: 'View',
      description: 'View proposal details',
      icon: <Eye className={`w-6 h-6 ${textColor}`} />,
      onClick: () => router.push(`/proposal/view/${proposalId}`),
      visible: true
    },
    {
      label: 'Review',
      description: 'Submit your review',
      icon: <ClipboardCheck className={`w-6 h-6 ${textColor}`} />,
      onClick: () => router.push(`/proposal/review/${proposalId}`),
      visible: isReviewer
    }
  ];

  const visibleActions = actions.filter(action => action.visible);

  // Determine grid columns based on number of visible actions
  const getGridCols = () => {
    const count = visibleActions.length;
    if (count === 4) return 'md:grid-cols-4';
    if (count === 3) return 'md:grid-cols-3';
    if (count === 2) return 'md:grid-cols-2';
    return 'md:grid-cols-1';
  };

  return (
    <div className={`${cardBg} border rounded-lg p-6`}>
      <h2 className={`text-xl font-semibold ${textColor} mb-4`}>Quick Actions</h2>
      <div className={`grid ${getGridCols()} gap-4`}>
        {visibleActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center p-4 border ${borderColor} rounded-lg ${hoverBg} transition-colors group`}
          >
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4 ${iconHoverBg} transition-colors`}>
              {action.icon}
            </div>
            <div className="text-left">
              <div className={`font-semibold ${textColor} mb-1`}>{action.label}</div>
              <div className={`text-sm ${textColor}`}>{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrackQuickActions;
