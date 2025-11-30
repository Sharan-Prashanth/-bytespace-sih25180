'use client';

import { useState } from 'react';

const CollaborateProposalInformation = ({ 
  proposalInfo, 
  canEdit = false, 
  onSave,
  isSaving = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(proposalInfo);

  const handleSave = async () => {
    if (onSave) {
      await onSave(editedInfo);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo(proposalInfo);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-black flex items-center">
          <svg className="w-5 h-5 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Proposal Information
        </h2>
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-black/20 text-black rounded-lg text-sm font-semibold hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-black/20 text-black rounded-lg text-sm font-semibold hover:bg-black/5 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">Title</label>
          {isEditing ? (
            <input
              type="text"
              value={editedInfo.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              maxLength={150}
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.title || 'N/A'}</div>
          )}
        </div>

        {/* Funding Method */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Funding Method</label>
          {isEditing ? (
            <select
              value={editedInfo.fundingMethod || 'S&T of MoC'}
              onChange={(e) => handleChange('fundingMethod', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="S&T of MoC">S&T of MoC</option>
              <option value="R&D of CIL">R&D of CIL</option>
            </select>
          ) : (
            <div className="text-sm text-black">{proposalInfo.fundingMethod || 'N/A'}</div>
          )}
        </div>

        {/* Principal Implementing Agency */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Principal Implementing Agency</label>
          {isEditing ? (
            <input
              type="text"
              value={editedInfo.principalAgency || ''}
              onChange={(e) => handleChange('principalAgency', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.principalAgency || 'N/A'}</div>
          )}
        </div>

        {/* Sub Implementing Agency */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Sub Implementing Agency</label>
          {isEditing ? (
            <input
              type="text"
              value={Array.isArray(editedInfo.subAgencies) ? editedInfo.subAgencies[0] || '' : editedInfo.subAgencies || ''}
              onChange={(e) => handleChange('subAgencies', [e.target.value])}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          ) : (
            <div className="text-sm text-black">
              {Array.isArray(proposalInfo.subAgencies) ? proposalInfo.subAgencies[0] : proposalInfo.subAgencies || 'N/A'}
            </div>
          )}
        </div>

        {/* Project Leader */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Project Leader</label>
          {isEditing ? (
            <input
              type="text"
              value={editedInfo.projectLeader || ''}
              onChange={(e) => handleChange('projectLeader', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.projectLeader || 'N/A'}</div>
          )}
        </div>

        {/* Project Coordinator */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Project Coordinator</label>
          {isEditing ? (
            <input
              type="text"
              value={editedInfo.projectCoordinator || ''}
              onChange={(e) => handleChange('projectCoordinator', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.projectCoordinator || 'N/A'}</div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Duration (Months)</label>
          {isEditing ? (
            <input
              type="number"
              value={editedInfo.durationMonths || ''}
              onChange={(e) => handleChange('durationMonths', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              min="1"
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.durationMonths || 'N/A'}</div>
          )}
        </div>

        {/* Outlay */}
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Project Outlay (Lakhs)</label>
          {isEditing ? (
            <input
              type="number"
              value={editedInfo.outlayLakhs || ''}
              onChange={(e) => handleChange('outlayLakhs', e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              min="0.01"
              step="0.01"
            />
          ) : (
            <div className="text-sm text-black">{proposalInfo.outlayLakhs || 'N/A'}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborateProposalInformation;
