'use client';

import apiClient from "@/utils/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function VersionHistory({
  proposalId,
  currentVersion = 0,
  showVersionHistory,
  setShowVersionHistory
}) {
  const router = useRouter();
  const [versions, setVersions] = useState([]);
  const [draftVersion, setDraftVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch version history when panel opens
  useEffect(() => {
    if (showVersionHistory && proposalId) {
      fetchVersionHistory();
    }
  }, [showVersionHistory, proposalId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both versions and draft in parallel
      const [versionsRes, draftRes] = await Promise.all([
        apiClient.get(`/api/proposals/${proposalId}/versions`),
        apiClient.get(`/api/proposals/${proposalId}/versions/draft`).catch(() => ({ data: { data: null } }))
      ]);
      
      setVersions(versionsRes.data.data || []);
      setDraftVersion(draftRes.data.data || null);
    } catch (err) {
      console.error('[VersionHistory] Error fetching versions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (versionNumber) => {
    // Navigate to view page with version parameter
    router.push(`/proposal/view/${proposalId}?version=${versionNumber}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVersionLabel = (version) => {
    if (version.versionNumber === 1) {
      return 'Initial Submission';
    }
    return version.commitMessage || `Version ${version.versionNumber}`;
  };

  return (
    <>
      {/* Version History Panel */}
      <div className={`fixed inset-y-0 left-0 z-40 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${showVersionHistory ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Header */}
        <div className="bg-black text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Version History</h2>
                <p className="text-white/70 text-sm">View previous versions</p>
              </div>
            </div>
            <button
              onClick={() => setShowVersionHistory(false)}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Version Display */}
        <div className="p-4 bg-black/5 border-b border-black/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-black uppercase tracking-wide">Current Version</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-black">v{currentVersion}</span>
                {draftVersion && (
                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium rounded">
                    {draftVersion.versionLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Version List */}
        <div className="h-full overflow-y-auto pb-24 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-black text-sm">Loading versions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error loading versions</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={fetchVersionHistory}
                className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : versions.length === 0 && !draftVersion ? (
            <div className="bg-black/5 border border-black/10 rounded-lg p-6 text-center">
              <svg className="w-16 h-16 text-black/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-black font-medium">No versions yet</p>
              <p className="text-black/60 text-sm mt-1">Versions will appear after the proposal is submitted</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Draft Version Card (if exists) */}
              {draftVersion && (
                <div className="group bg-amber-50 border border-amber-200 rounded-lg p-4 transition-all duration-200">
                  {/* Draft Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500 text-white font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-black">
                          {draftVersion.versionLabel}
                        </span>
                        <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded">
                          Working Draft
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Draft Message */}
                  <div className="mb-3">
                    <p className="text-sm text-black font-medium">
                      Uncommitted changes
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-black/70">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Last modified: {formatDate(draftVersion.updatedAt || draftVersion.createdAt)} at {formatTime(draftVersion.updatedAt || draftVersion.createdAt)}</span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{draftVersion.createdBy?.fullName || draftVersion.createdBy?.email || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800">
                    This draft will become v{draftVersion.versionNumber} when committed.
                  </div>
                </div>
              )}

              {/* Major Versions */}
              {versions.map((version, index) => (
                <div
                  key={version._id}
                  className={`group bg-white border rounded-lg p-4 transition-all duration-200 ${
                    version.versionNumber === currentVersion 
                      ? 'border-black/40 shadow-md' 
                      : 'border-black/10 hover:border-black/20 hover:shadow-sm'
                  }`}
                >
                  {/* Version Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        version.versionNumber === currentVersion ? 'bg-black' : 'bg-black/60'
                      }`}>
                        {version.versionNumber}
                      </div>
                      <div>
                        <span className="font-semibold text-black">
                          {version.versionLabel || `Version ${version.versionNumber}`}
                        </span>
                        {version.versionNumber === currentVersion && (
                          <span className="ml-2 px-2 py-0.5 bg-black text-white text-xs font-medium rounded">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Commit Message */}
                  <div className="mb-3">
                    <p className="text-sm text-black font-medium">
                      {getVersionLabel(version)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-black/70">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(version.createdAt)} at {formatTime(version.createdAt)}</span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{version.createdBy?.fullName || version.createdBy?.email || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* View Button - only for non-current versions */}
                  {version.versionNumber !== currentVersion && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleViewVersion(version.versionNumber)}
                        className="w-full bg-black/5 hover:bg-black text-black hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-black/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View This Version
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Note */}
          {(versions.length > 0 || draftVersion) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-800">
                  {draftVersion 
                    ? 'You have uncommitted draft changes. Use "Save Changes" to commit your draft as a new permanent version.'
                    : 'Click "View This Version" to open a previous version in read-only mode. The current version remains unchanged.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {showVersionHistory && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setShowVersionHistory(false)}
        />
      )}
    </>
  );
}