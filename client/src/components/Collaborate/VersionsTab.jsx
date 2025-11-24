import { useState } from 'react';
import VersionHistory from '@/components/VersionHistory';

export default function VersionsTab({ 
  proposalId, 
  currentVersion,
  canCommit,
  onCommitVersion
}) {
  const [showVersionHistory, setShowVersionHistory] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {canCommit && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onCommitVersion}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Commit Current Changes
          </button>
          <p className="text-xs text-black mt-2 text-center">
            Current version: v{currentVersion}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <VersionHistory 
          proposalId={proposalId}
          formId={null}
          currentVersion={currentVersion}
          showVersionHistory={showVersionHistory}
          setShowVersionHistory={setShowVersionHistory}
          showSaarthi={false}
        />
      </div>
    </div>
  );
}
