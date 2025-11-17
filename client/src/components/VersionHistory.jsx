import { useState } from "react";

export default function VersionHistory({ showVersionHistory, setShowVersionHistory, showSaarthi }) {
  console.log('VersionHistory render - showVersionHistory:', showVersionHistory);
  
  // Version history data
  const versionHistory = [
    {
      id: 1,
      version: "Version 3.2",
      date: "2025-09-26",
      time: "14:30",
      author: "Dr. Sarah Chen",
      changes: "Updated methodology section and budget allocation",
      status: "current"
    },
    {
      id: 2,
      version: "Version 3.1", 
      date: "2025-09-25",
      time: "16:45",
      author: "Dr. Sarah Chen",
      changes: "Added environmental impact assessment details",
      status: "saved"
    },
    {
      id: 3,
      version: "Version 3.0",
      date: "2025-09-24",
      time: "11:20",
      author: "Prof. Michael Kumar",
      changes: "Major revision: restructured objectives and timeline",
      status: "saved"
    },
    {
      id: 4,
      version: "Version 2.5",
      date: "2025-09-23",
      time: "09:15",
      author: "Dr. Sarah Chen", 
      changes: "Incorporated reviewer feedback on coal processing methods",
      status: "saved"
    },
    {
      id: 5,
      version: "Version 2.0",
      date: "2025-09-20",
      time: "13:30",
      author: "Dr. Sarah Chen",
      changes: "Initial draft submitted for peer review",
      status: "saved"
    }
  ];

  const loadVersion = (versionData) => {
    // Simulate loading different version content
    alert(`Loading ${versionData.version}... (Demo: This would load the actual content from that version)`);
  };

  return (
    <>
      {/* Version History Toggle Button - Middle position between Chat and AI */}
      {!showSaarthi && (
        <div className="fixed bottom-28 right-8 z-40 group">
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`w-16 h-16 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:rotate-3 ${
              showVersionHistory 
                ? 'bg-orange-700 text-white scale-110 rotate-3' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Tooltip - Matching Chatbot Style */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 pointer-events-none z-60">
            <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <span>Version History</span>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-t-4 border-t-black/90 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
            </div>
          </div>
        </div>
      )}

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

        {/* Version List */}
        <div className="h-full overflow-y-auto pb-24 p-4 bg-blue-50">
          <div className="space-y-3">
            {versionHistory.map((version, index) => (
              <div
                key={version.id}
                className="group bg-white border border-orange-200 rounded-lg p-4 hover:shadow-lg hover:border-orange-300 cursor-pointer transition-all duration-200"
                onClick={() => loadVersion(version)}
              >
                {/* Version Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      version.status === 'current' ? 'bg-green-500' : 'bg-orange-400'
                    }`}></div>
                    <span className="font-bold text-orange-900 text-lg">{version.version}</span>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                    version.status === 'current' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}>
                    {version.status === 'current' ? 'Current' : 'Saved'}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-orange-700 font-medium">
                    {version.date} at {version.time}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-orange-800 font-medium">{version.author}</span>
                </div>

                {/* Changes */}
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-orange-700 leading-relaxed">{version.changes}</p>
                </div>

                {/* Load Button - Always Visible */}
                <div className="mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      loadVersion(version);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load This Version
                  </button>
                </div>
              </div>
            ))}
          </div>
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
import { useState } from "react";

export default function VersionHistory({ showVersionHistory, setShowVersionHistory, showSaarthi }) {
  console.log('VersionHistory render - showVersionHistory:', showVersionHistory);
  
  // Version history data
  const versionHistory = [
    {
      id: 1,
      version: "Version 3.2",
      date: "2025-09-26",
      time: "14:30",
      author: "Dr. Sarah Chen",
      changes: "Updated methodology section and budget allocation",
      status: "current"
    },
    {
      id: 2,
      version: "Version 3.1", 
      date: "2025-09-25",
      time: "16:45",
      author: "Dr. Sarah Chen",
      changes: "Added environmental impact assessment details",
      status: "saved"
    },
    {
      id: 3,
      version: "Version 3.0",
      date: "2025-09-24",
      time: "11:20",
      author: "Prof. Michael Kumar",
      changes: "Major revision: restructured objectives and timeline",
      status: "saved"
    },
    {
      id: 4,
      version: "Version 2.5",
      date: "2025-09-23",
      time: "09:15",
      author: "Dr. Sarah Chen", 
      changes: "Incorporated reviewer feedback on coal processing methods",
      status: "saved"
    },
    {
      id: 5,
      version: "Version 2.0",
      date: "2025-09-20",
      time: "13:30",
      author: "Dr. Sarah Chen",
      changes: "Initial draft submitted for peer review",
      status: "saved"
    }
  ];

  const loadVersion = (versionData) => {
    // Simulate loading different version content
    alert(`Loading ${versionData.version}... (Demo: This would load the actual content from that version)`);
  };

  return (
    <>
      {/* Version History Toggle Button - Middle position between Chat and AI */}
      {!showSaarthi && (
        <div className="fixed bottom-28 right-8 z-40 group">
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`w-16 h-16 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:rotate-3 ${
              showVersionHistory 
                ? 'bg-orange-700 text-white scale-110 rotate-3' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Tooltip - Matching Chatbot Style */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 pointer-events-none z-60">
            <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <span>Version History</span>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-t-4 border-t-black/90 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
            </div>
          </div>
        </div>
      )}

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

        {/* Version List */}
        <div className="h-full overflow-y-auto pb-24 p-4 bg-blue-50">
          <div className="space-y-3">
            {versionHistory.map((version, index) => (
              <div
                key={version.id}
                className="group bg-white border border-orange-200 rounded-lg p-4 hover:shadow-lg hover:border-orange-300 cursor-pointer transition-all duration-200"
                onClick={() => loadVersion(version)}
              >
                {/* Version Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      version.status === 'current' ? 'bg-green-500' : 'bg-orange-400'
                    }`}></div>
                    <span className="font-bold text-orange-900 text-lg">{version.version}</span>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                    version.status === 'current' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}>
                    {version.status === 'current' ? 'Current' : 'Saved'}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-orange-700 font-medium">
                    {version.date} at {version.time}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-orange-800 font-medium">{version.author}</span>
                </div>

                {/* Changes */}
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-orange-700 leading-relaxed">{version.changes}</p>
                </div>

                {/* Load Button - Always Visible */}
                <div className="mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      loadVersion(version);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load This Version
                  </button>
                </div>
              </div>
            ))}
          </div>
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