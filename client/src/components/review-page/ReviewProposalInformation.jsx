'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ReviewProposalInformation = ({ proposalInfo, defaultOpen = true, theme = 'light' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const fieldBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-black/5 border-black/10';

  if (!proposalInfo) return null;

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
            <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${textColor}`}>Proposal Information</h2>
        </div>
        <button className={`p-1 ${hoverBg} rounded transition-colors`}>
          <ChevronDown 
            className={`w-5 h-5 ${textColor} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Project Title */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Project Title
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.title || 'N/A'}
              </div>
            </div>

            {/* Funding Method */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Funding Method
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.fundingMethod || 'N/A'}
              </div>
            </div>

            {/* Principal Implementing Agency */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Principal Implementing Agency
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.principalAgency || 'N/A'}
              </div>
            </div>

            {/* Sub Implementing Agency */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Sub Implementing Agency
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.subAgencies && proposalInfo.subAgencies.length > 0 
                  ? proposalInfo.subAgencies.join(', ') 
                  : 'N/A'}
              </div>
            </div>

            {/* Project Leader */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Project Leader
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.projectLeader || 'N/A'}
              </div>
            </div>

            {/* Project Coordinator */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Project Coordinator
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.projectCoordinator || 'N/A'}
              </div>
            </div>

            {/* Project Duration */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Project Duration (months)
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.durationMonths || 0}
              </div>
            </div>

            {/* Project Outlay */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Project Outlay (lakhs)
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.outlayLakhs ? `Rs. ${proposalInfo.outlayLakhs.toLocaleString()}` : 'Rs. 0'}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Status
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {(proposalInfo.status || 'DRAFT').replace(/_/g, ' ')}
              </div>
            </div>

            {/* Version */}
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Current Version
              </label>
              <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
                {proposalInfo.currentVersion || 1}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewProposalInformation;
