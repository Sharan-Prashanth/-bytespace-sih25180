import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';

const ProposalInformation = ({ proposalInfo, validationErrors, onChange, theme = 'light' }) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300';
  const inputText = isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400';
  const inputFocus = isDark ? 'focus:ring-white/20 focus:border-white/30' : 'focus:ring-black/10 focus:border-black/30';
  const spinnerBorder = isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black';

  const handleChange = (field, value) => {
    onChange(field, value);
  };

  const handleAutoFill = () => {
    setIsAutoFilling(true);
    
    // Mock data for auto-fill
    const mockData = {
      title: 'Mission SIH',
      fundingMethod: 'S&T of MoC',
      principalImplementingAgency: 'Rajalakshmi Engineering College',
      subImplementingAgency: 'Chennai Institute of Technology',
      projectLeader: 'David',
      projectCoordinator: 'Mr Robin Britto',
      projectDurationMonths: '4',
      projectOutlayLakhs: '1.5'
    };
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      Object.entries(mockData).forEach(([field, value]) => {
        onChange(field, value);
      });
      setIsAutoFilling(false);
    }, 500);
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${textColor}`}>Proposal Information</h2>
        <button
          onClick={handleAutoFill}
          disabled={isAutoFilling}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
            isDark 
              ? 'border-slate-600 text-slate-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed' 
              : 'border-slate-300 text-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isAutoFilling ? (
            <>
              <div className={`w-4 h-4 border-2 ${spinnerBorder} rounded-full animate-spin`}></div>
              <span className="text-sm">Auto-filling...</span>
            </>
          ) : (
            <>
              <FiZap className="w-4 h-4" />
              <span className="text-sm">Auto-Fill Sample</span>
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Project Title */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.title}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={150}
            placeholder="Enter project title (max 150 characters)"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.title ? 'border-red-500' : ''
            }`}
          />
          <div className="flex justify-between mt-1.5">
            {validationErrors.title && (
              <p className="text-sm text-red-500">{validationErrors.title}</p>
            )}
            <p className={`text-sm ${mutedText} ml-auto`}>{proposalInfo.title.length}/150</p>
          </div>
        </div>

        {/* Funding Method */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Funding Method <span className="text-red-500">*</span>
          </label>
          <select
            value={proposalInfo.fundingMethod}
            onChange={(e) => handleChange('fundingMethod', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors`}
          >
            <option value="S&T of MoC">S&T of MoC</option>
            <option value="R&D of CIL">R&D of CIL</option>
          </select>
        </div>

        {/* Principal Implementing Agency */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Principal Implementing Agency <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.principalImplementingAgency}
            onChange={(e) => handleChange('principalImplementingAgency', e.target.value)}
            maxLength={100}
            placeholder="Enter principal implementing agency"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.principalImplementingAgency ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.principalImplementingAgency && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.principalImplementingAgency}</p>
          )}
        </div>

        {/* Sub Implementing Agency */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Sub Implementing Agency <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.subImplementingAgency}
            onChange={(e) => handleChange('subImplementingAgency', e.target.value)}
            maxLength={100}
            placeholder="Enter sub implementing agency"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.subImplementingAgency ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.subImplementingAgency && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.subImplementingAgency}</p>
          )}
        </div>

        {/* Project Leader */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Project Leader <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.projectLeader}
            onChange={(e) => handleChange('projectLeader', e.target.value)}
            maxLength={100}
            placeholder="Enter project leader name"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.projectLeader ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.projectLeader && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.projectLeader}</p>
          )}
        </div>

        {/* Project Coordinator */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Project Coordinator <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proposalInfo.projectCoordinator}
            onChange={(e) => handleChange('projectCoordinator', e.target.value)}
            maxLength={100}
            placeholder="Enter project coordinator name"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.projectCoordinator ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.projectCoordinator && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.projectCoordinator}</p>
          )}
        </div>

        {/* Project Duration */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Project Duration (in months) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={proposalInfo.projectDurationMonths}
            onChange={(e) => handleChange('projectDurationMonths', e.target.value)}
            min="1"
            placeholder="Enter duration"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.projectDurationMonths ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.projectDurationMonths && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.projectDurationMonths}</p>
          )}
        </div>

        {/* Project Outlay */}
        <div>
          <label className={`block text-sm font-medium ${textColor} mb-2`}>
            Project Outlay (in lakhs) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={proposalInfo.projectOutlayLakhs}
            onChange={(e) => handleChange('projectOutlayLakhs', e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="Enter outlay"
            className={`w-full px-4 py-2.5 border rounded-lg ${inputBg} ${inputText} ${inputFocus} focus:outline-none focus:ring-2 transition-colors ${
              validationErrors.projectOutlayLakhs ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.projectOutlayLakhs && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.projectOutlayLakhs}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalInformation;
