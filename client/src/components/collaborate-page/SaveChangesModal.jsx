'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';

const SaveChangesModal = ({ isOpen, onClose, onSave, currentVersion = 1, proposalId }) => {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [checkingDraft, setCheckingDraft] = useState(false);

  // Check if there's an existing draft when modal opens
  useEffect(() => {
    if (isOpen && proposalId) {
      checkForDraft();
    }
  }, [isOpen, proposalId]);

  const checkForDraft = async () => {
    setCheckingDraft(true);
    try {
      const response = await apiClient.get(`/api/proposals/${proposalId}/versions/draft`);
      if (response.data.data) {
        setHasDraft(true);
        // Use decimal version format (e.g., v1.1, v2.1)
        const draftVersion = response.data.data.versionNumber || (currentVersion + 0.1);
        setDraftLabel(`v${draftVersion}`);
      } else {
        setHasDraft(false);
        setDraftLabel('');
      }
    } catch (err) {
      // No draft exists
      setHasDraft(false);
      setDraftLabel('');
    } finally {
      setCheckingDraft(false);
    }
  };

  if (!isOpen) return null;

  const getNextVersion = () => {
    // Integer versions only: 1 -> 2, 2 -> 3, etc.
    return currentVersion + 1;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Create new version - this will promote draft if exists
      await apiClient.post(`/api/proposals/${proposalId}/versions`, {
        commitMessage: description || `Version ${getNextVersion()}`
      });

      // Call the parent onSave handler to update local state
      if (onSave) {
        await onSave({
          version: getNextVersion(),
          commitMessage: description || `Version ${getNextVersion()}`
        });
      }

      setDescription('');
      onClose();
    } catch (err) {
      console.error('[SaveChangesModal] Save failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await apiClient.delete(`/api/proposals/${proposalId}/versions/draft`);
      setHasDraft(false);
      setDraftLabel('');
      onClose();
    } catch (err) {
      console.error('[SaveChangesModal] Discard draft failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to discard draft.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black">
            {hasDraft ? 'Commit Draft Version' : 'Create New Version'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors" disabled={isSaving}>
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {checkingDraft ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Version Info */}
              <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-black">Current Version</p>
                  <p className="text-2xl font-bold text-black">v{currentVersion}</p>
                </div>
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-black">
                    {hasDraft ? 'From Draft' : 'New Version'}
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {hasDraft ? draftLabel : `v${getNextVersion()}`}
                  </p>
                </div>
              </div>

              {/* Draft Indicator */}
              {hasDraft && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p className="text-xs text-amber-800">
                      You have unsaved draft changes. Committing will promote your draft to a permanent major version.
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Version Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what changes were made in this version..."
                  rows={3}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-black">
                  If left empty, the default message will be "Version {getNextVersion()}"
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-800">
                    {hasDraft
                      ? 'This will convert your draft into a permanent version. Previous versions can be viewed from the Version History panel.'
                      : 'This will create a new version with your current changes. Previous versions can be viewed from the Version History panel.'
                    }
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-black/10">
          <div>
            {hasDraft && !checkingDraft && (
              <button
                onClick={handleDiscardDraft}
                disabled={isSaving}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Discard Draft
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || checkingDraft}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {hasDraft ? 'Committing...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {hasDraft ? 'Commit as v' + getNextVersion() : 'Create v' + getNextVersion()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveChangesModal;
