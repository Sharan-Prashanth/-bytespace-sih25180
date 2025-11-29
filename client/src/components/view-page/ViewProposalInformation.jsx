import React from 'react';

const ViewProposalInformation = ({ proposalInfo }) => {
  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-black">Proposal Information</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Project Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-black mb-2">
            Project Title
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.title || 'N/A'}
          </div>
        </div>

        {/* Funding Method */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Funding Method
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.fundingMethod || 'N/A'}
          </div>
        </div>

        {/* Principal Implementing Agency */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Principal Implementing Agency
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.principalAgency || 'N/A'}
          </div>
        </div>

        {/* Sub Implementing Agency */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Sub Implementing Agency
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.subAgencies && proposalInfo.subAgencies.length > 0 
              ? proposalInfo.subAgencies.join(', ') 
              : 'N/A'}
          </div>
        </div>

        {/* Project Leader */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Leader
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.projectLeader || 'N/A'}
          </div>
        </div>

        {/* Project Coordinator */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Coordinator
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.projectCoordinator || 'N/A'}
          </div>
        </div>

        {/* Project Duration */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Duration (months)
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.durationMonths || 0}
          </div>
        </div>

        {/* Project Outlay */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Outlay (lakhs)
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {proposalInfo.outlayLakhs ? `₹${proposalInfo.outlayLakhs.toLocaleString()}` : '₹0'}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Status
          </label>
          <div className="w-full px-4 py-3 border border-black/10 rounded-lg bg-black/5 text-black">
            {(proposalInfo.status || 'DRAFT').replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProposalInformation;
