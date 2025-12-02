'use client';

import React from 'react';
import { useRouter } from 'next/router';

const TrackQuickActions = ({ 
  proposalId,
  userRoles = [],
  isPI = false,
  isCI = false,
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

  // Check if user is PI or CI
  const canAccessCollaborate = isPI || isCI;

  const actions = [
    {
      label: 'View Proposal',
      description: 'View full proposal details',
      icon: (
        <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: () => router.push(`/proposal/view/${proposalId}`),
      visible: true
    },
    {
      label: 'Collaborate',
      description: 'Work with team members',
      icon: (
        <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => router.push(`/proposal/collaborate/${proposalId}`),
      visible: canAccessCollaborate
    },
    {
      label: 'Version History',
      description: 'View previous versions',
      icon: (
        <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => router.push(`/proposal/view/${proposalId}?tab=versions`),
      visible: true
    },
    {
      label: 'Review',
      description: 'Submit your review',
      icon: (
        <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
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
