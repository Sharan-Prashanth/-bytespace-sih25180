import React from 'react';

const ProposalInformation = ({ proposalInfo, validationErrors, onChange }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Proposal Information</h2>
      
      <div className="space-y-4">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.title}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={150}
            placeholder="Enter project title (max 150 characters)"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.title ? 'border-red-500' : 'border-black/20'
            }`}
          />
          <div className="flex justify-between mt-1">
            {validationErrors.title && (
              <p className="text-sm text-red-600">{validationErrors.title}</p>
            )}
            <p className="text-sm text-black/60 ml-auto">{proposalInfo.title.length}/150</p>
          </div>
        </div>

        {/* Funding Method */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Funding Method <span className="text-red-600">*</span>
          </label>
          <select
            value={proposalInfo.fundingMethod}
            onChange={(e) => handleChange('fundingMethod', e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="S&T of MoC">S&T of MoC</option>
            <option value="R&D of CIL">R&D of CIL</option>
          </select>
        </div>

        {/* Principal Implementing Agency */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Principal Implementing Agency <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.principalImplementingAgency}
            onChange={(e) => handleChange('principalImplementingAgency', e.target.value)}
            maxLength={100}
            placeholder="Enter principal implementing agency"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.principalImplementingAgency ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.principalImplementingAgency && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.principalImplementingAgency}</p>
          )}
        </div>

        {/* Sub Implementing Agency */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Sub Implementing Agency <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.subImplementingAgency}
            onChange={(e) => handleChange('subImplementingAgency', e.target.value)}
            maxLength={100}
            placeholder="Enter sub implementing agency"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.subImplementingAgency ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.subImplementingAgency && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.subImplementingAgency}</p>
          )}
        </div>

        {/* Project Leader */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Leader <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.projectLeader}
            onChange={(e) => handleChange('projectLeader', e.target.value)}
            maxLength={100}
            placeholder="Enter project leader name"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.projectLeader ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.projectLeader && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.projectLeader}</p>
          )}
        </div>

        {/* Project Coordinator */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Coordinator <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.projectCoordinator}
            onChange={(e) => handleChange('projectCoordinator', e.target.value)}
            maxLength={100}
            placeholder="Enter project coordinator name"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.projectCoordinator ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.projectCoordinator && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.projectCoordinator}</p>
          )}
        </div>

        {/* Project Duration */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Duration (in months) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            value={proposalInfo.projectDurationMonths}
            onChange={(e) => handleChange('projectDurationMonths', e.target.value)}
            min="1"
            placeholder="Enter duration"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.projectDurationMonths ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.projectDurationMonths && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.projectDurationMonths}</p>
          )}
        </div>

        {/* Project Outlay */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Project Outlay (in lakhs) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            value={proposalInfo.projectOutlayLakhs}
            onChange={(e) => handleChange('projectOutlayLakhs', e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="Enter outlay"
            className={`w-full px-4 py-2 border rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 ${
              validationErrors.projectOutlayLakhs ? 'border-red-500' : 'border-black/20'
            }`}
          />
          {validationErrors.projectOutlayLakhs && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.projectOutlayLakhs}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalInformation;
