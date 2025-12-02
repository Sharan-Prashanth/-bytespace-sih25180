'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, FileText, User, Clock, Tag } from 'lucide-react';

const TrackHeader = ({ 
  proposalCode, 
  projectLeader, 
  status, 
  version,
  userRoles = [],
  theme = 'light'
}) => {
  const router = useRouter();

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const bgClass = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-white/60' : 'text-black/60';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    if (!status) return 'bg-black/10 text-black';
    if (status.includes('ACCEPTED')) {
      return 'bg-green-100 text-green-800';
    }
    if (status.includes('REJECTED')) {
      return 'bg-red-100 text-red-800';
    }
    if (status.includes('REVIEW')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (status.includes('DRAFT')) {
      return 'bg-black/10 text-black';
    }
    return 'bg-black/10 text-black';
  };

  return (
    <>
      {/* Back Button Section */}
      <div className={`${bgClass} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex items-center gap-2 px-4 py-2 text-sm border ${borderColor} ${textColor} rounded-lg ${hoverBg} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Header Content */}
      <div className={`${bgClass} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className={`text-3xl font-bold ${textColor} mb-4`}>Track Proposal</h1>
          
          {/* Proposal Info Row */}
          <div className={`flex flex-wrap items-center gap-4 text-sm ${textColor}`}>
            {/* Proposal Code */}
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${subTextColor}`} />
              <span>Code:</span>
              <span className="font-semibold">{proposalCode || 'N/A'}</span>
            </div>

            <span className={isDark ? 'text-white/40' : 'text-black/40'}>|</span>

            {/* Project Leader */}
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${subTextColor}`} />
              <span>Leader:</span>
              <span className="font-semibold">{projectLeader || 'N/A'}</span>
            </div>

            <span className={isDark ? 'text-white/40' : 'text-black/40'}>|</span>

            {/* Version */}
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${subTextColor}`} />
              <span>Version:</span>
              <span className="font-semibold">v{version || 1}</span>
            </div>

            <span className={isDark ? 'text-white/40' : 'text-black/40'}>|</span>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Tag className={`w-4 h-4 ${subTextColor}`} />
              <span>Status:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(status)}`}>
                {formatStatus(status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackHeader;
