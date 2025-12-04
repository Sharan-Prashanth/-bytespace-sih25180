import React from 'react';

const ViewProposalInformation = ({ proposalInfo, theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  
  // Theme-aware styles
  const cardBg = theme === 'darkest' 
    ? 'bg-neutral-900 border-neutral-800' 
    : theme === 'dark' 
      ? 'bg-slate-800 border-slate-700' 
      : 'bg-white border-slate-200';
  
  const textColor = isDark ? 'text-white' : 'text-black';
  const labelColor = isDark ? 'text-slate-400' : 'text-black';
  const fieldBg = theme === 'darkest'
    ? 'bg-neutral-800 border-neutral-700'
    : theme === 'dark'
      ? 'bg-slate-700 border-slate-600'
      : 'bg-slate-50 border-slate-200';

  // Get status color - keep semantic colors for status
  const getStatusColor = (status) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s.includes('ACCEPTED') || s.includes('APPROVED')) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (s.includes('REJECTED')) return isDark ? 'text-red-400' : 'text-red-600';
    if (s.includes('REVIEW')) return isDark ? 'text-amber-400' : 'text-amber-600';
    return textColor;
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <div className="flex items-center mb-5">
        <h2 className={`text-xl font-semibold ${textColor}`}>Proposal Information</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Project Title */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Project Title
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor} font-medium`}>
            {proposalInfo.title || 'N/A'}
          </div>
        </div>

        {/* Funding Method */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Funding Method
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            {proposalInfo.fundingMethod || 'N/A'}
          </div>
        </div>

        {/* Principal Implementing Agency */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Principal Implementing Agency
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            {proposalInfo.principalAgency || 'N/A'}
          </div>
        </div>

        {/* Sub Implementing Agency */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
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
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Project Leader
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            {proposalInfo.projectLeader || 'N/A'}
          </div>
        </div>

        {/* Project Coordinator */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Project Coordinator
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            {proposalInfo.projectCoordinator || 'N/A'}
          </div>
        </div>

        {/* Project Duration */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Project Duration (months)
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            <span className={`font-semibold`}>{proposalInfo.durationMonths || 0}</span>
            <span className={`ml-1`}>months</span>
          </div>
        </div>

        {/* Project Outlay */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Project Outlay (lakhs)
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg ${textColor}`}>
            <span className={`font-semibold`}>
              Rs. {proposalInfo.outlayLakhs ? proposalInfo.outlayLakhs.toLocaleString() : '0'}
            </span>
            <span className={`ml-1`}>lakhs</span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Status
          </label>
          <div className={`w-full px-4 py-3 border ${fieldBg} rounded-lg`}>
            <span className={`font-semibold ${getStatusColor(proposalInfo.status)}`}>
              {(proposalInfo.status || 'DRAFT').replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProposalInformation;
