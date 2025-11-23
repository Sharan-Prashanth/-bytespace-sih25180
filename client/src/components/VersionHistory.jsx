'use client';

import { useState, useEffect } from "react";
import apiClient from "@/utils/api";

export default function VersionHistory({ 
  proposalId, 
  formId = null,
  currentVersion = 1,
  showVersionHistory, 
  setShowVersionHistory, 
  showSaarthi 
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingRollback, setLoadingRollback] = useState(null);

  // Fetch version history when panel opens
  useEffect(() => {
    if (showVersionHistory && proposalId) {
      fetchVersionHistory();
      if (!formId) {
        // Only fetch stats for proposal-level versions
        fetchVersionStats();
      }
    }
  }, [showVersionHistory, proposalId, formId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use form-specific or proposal-level endpoint based on formId presence
      const url = formId 
        ? `/api/proposals/${proposalId}/forms/${formId}/versions?limit=50`
        : `/api/proposals/${proposalId}/versions?limit=50`;
      
      const response = await apiClient.get(url);
      setVersions(response.data.versions || []);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionStats = async () => {
    try {
      const response = await apiClient.get(`/api/proposals/${proposalId}/version-stats`);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleRollback = async (versionNumber) => {
    const confirmed = window.confirm(
      `Rollback to version ${versionNumber}?\n\n` +
      `This will restore the form to its previous state.\n` +
      `Current work will be saved as a new version.`
    );

    if (!confirmed) return;

    setLoadingRollback(versionNumber);

    try {
      const response = await apiClient.post(
        `/api/proposals/${proposalId}/forms/${formId}/versions/${versionNumber}/rollback`
      );

      alert(`✅ Successfully rolled back to version ${versionNumber}!\n\nNew version ${response.data.newVersion} created.`);
      
      // Refresh version list
      fetchVersionHistory();
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error rolling back:', err);
      alert(`❌ Rollback failed: ${err.message}`);
    } finally {
      setLoadingRollback(null);
    }
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

  return (
    <>
      {/* Version History Toggle Button removed - now controlled by editor */}

      {/* Version History Panel */}
      <div className={`fixed inset-y-0 left-0 z-40 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        showVersionHistory ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Version History</h2>
                <p className="text-blue-100 text-sm">Track changes and revisions</p>
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
        {!formId && currentVersion && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Current Version</div>
                <div className="text-2xl font-bold text-orange-700">v{currentVersion}</div>
              </div>
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Storage Statistics */}
        {stats && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Storage Statistics</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/70 p-2 rounded">
                <div className="text-slate-600">Total Versions</div>
                <div className="text-lg font-bold text-blue-600">{stats.totalVersions}</div>
              </div>
              <div className="bg-white/70 p-2 rounded">
                <div className="text-slate-600">Compression</div>
                <div className="text-lg font-bold text-green-600">{stats.compressionRatio?.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Version List */}
        <div className="h-full overflow-y-auto pb-24 p-4 bg-blue-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 font-medium">Error loading versions</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button 
                onClick={fetchVersionHistory}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <svg className="w-16 h-16 text-orange-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-orange-800 font-medium">No versions yet</p>
              <p className="text-orange-600 text-sm mt-1">Versions will appear after you save changes</p>
            </div>
          ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version._id}
                className="group bg-white border border-orange-200 rounded-lg p-4 hover:shadow-lg hover:border-orange-300 transition-all duration-200"
              >
                {/* Version Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      version.versionType === 'snapshot' ? 'bg-blue-500' : 'bg-orange-400'
                    }`}></div>
                    <span className="font-bold text-orange-900 text-lg">Version {version.versionNumber}</span>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                    version.versionType === 'snapshot'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}>
                    {version.versionType}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-orange-700 font-medium">
                    {formatDate(version.createdAt)} at {formatTime(version.createdAt)}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-orange-800 font-medium">
                    {version.createdBy?.name || 'Unknown'}
                  </span>
                </div>

                {/* Change Type & Metadata */}
                <div className="flex items-start gap-2 mb-3">
                  <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-sm text-orange-700 leading-relaxed">
                    <div className="font-medium">{version.changeType?.replace(/_/g, ' ')}</div>
                    {version.comment && <div className="text-xs mt-1">{version.comment}</div>}
                    {version.metadata?.wordCountDelta !== undefined && (
                      <div className="text-xs mt-1 text-slate-600">
                        {version.metadata.wordCountDelta > 0 ? '+' : ''}
                        {version.metadata.wordCountDelta} words
                      </div>
                    )}
                  </div>
                </div>

                {/* Rollback Button */}
                <div className="mt-4">
                  <button 
                    onClick={() => handleRollback(version.versionNumber)}
                    disabled={loadingRollback === version.versionNumber}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                  >
                    {loadingRollback === version.versionNumber ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Rolling back...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Rollback to This Version
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
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