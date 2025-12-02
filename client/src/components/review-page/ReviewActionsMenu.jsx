'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Clock, 
  Users, 
  MessageSquare, 
  Eye, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ReviewActionsMenu = ({ 
  proposalId, 
  onShowVersionHistory,
  showVersionHistory = false
}) => {
  const router = useRouter();
  const [fabExpanded, setFabExpanded] = useState(true);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
      <div className={`bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden transition-all duration-300 ${fabExpanded ? 'w-48' : 'w-14'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors border-b border-black/10"
        >
          {fabExpanded && <span className="text-sm font-semibold text-black">Actions</span>}
          {fabExpanded ? (
            <ChevronDown className="w-5 h-5 text-black" />
          ) : (
            <ChevronUp className="w-5 h-5 text-black mx-auto" />
          )}
        </button>

        {/* Action Buttons */}
        <div className="p-2 space-y-1">
          {/* Version History Button */}
          <button
            onClick={onShowVersionHistory}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
              showVersionHistory 
                ? 'bg-black text-white' 
                : 'hover:bg-black/5 text-black'
            } ${!fabExpanded && 'justify-center'}`}
            title="Version History"
          >
            <Clock className={`w-5 h-5 ${!showVersionHistory && 'group-hover:scale-110'} transition-transform`} />
            {fabExpanded && <span className="text-sm font-medium">Versions</span>}
          </button>

          {/* Collaborate Button */}
          <button
            onClick={() => router.push(`/proposal/collaborate/${proposalId}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
            title="Collaborate"
          >
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {fabExpanded && <span className="text-sm font-medium">Collaborate</span>}
          </button>

          {/* Track Button */}
          <button
            onClick={() => router.push(`/proposal/track/${proposalId}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
            title="Track Progress"
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {fabExpanded && <span className="text-sm font-medium">Track</span>}
          </button>

          {/* View Button */}
          <button
            onClick={() => router.push(`/proposal/view/${proposalId}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-black transition-all group ${!fabExpanded && 'justify-center'}`}
            title="View Proposal"
          >
            <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {fabExpanded && <span className="text-sm font-medium">View</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewActionsMenu;
