'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, FileText, User, Clock, Tag } from 'lucide-react';

const ReviewHeader = ({ 
  proposalCode, 
  projectLeader, 
  status, 
  version,
  hasDraft,
  draftVersionLabel,
  userRoles = []
}) => {
  const router = useRouter();

  // Determine dashboard path - always goes to main dashboard
  const getDashboardPath = () => {
    return '/dashboard';
  };

  // Get role-specific label
  const getRoleLabel = () => {
    return 'Dashboard';
  };

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
      {/* Back Button Section - Matching view page style */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push(getDashboardPath())}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-black/20 text-black rounded-lg hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {getRoleLabel()}
          </button>
        </div>
      </div>

      {/* Header Content */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-black mb-4">Review Proposal</h1>
          
          {/* Proposal Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-black">
            {/* Proposal Code */}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-black/60" />
              <span>Code:</span>
              <span className="font-semibold">{proposalCode || 'N/A'}</span>
            </div>

            <span className="text-black/40">|</span>

            {/* Project Leader */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-black/60" />
              <span>Leader:</span>
              <span className="font-semibold">{projectLeader || 'N/A'}</span>
            </div>

            <span className="text-black/40">|</span>

            {/* Version */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black/60" />
              <span>Version:</span>
              <span className="font-semibold">v{version || 1}</span>
              {hasDraft && (
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium rounded">
                  {draftVersionLabel || 'Draft'}
                </span>
              )}
            </div>

            <span className="text-black/40">|</span>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-black/60" />
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

export default ReviewHeader;
