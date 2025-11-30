'use client';

const CollaborativeEditor = ({ 
  canEdit = false,
  canComment = false,
  isSuggestionMode = false,
  onlineUsers = [],
  onShowOnlineUsers,
  onSaveChanges,
  children 
}) => {
  // For investigators (PI/CI), no badge is shown
  // For reviewers/committee, show suggestion mode indicator
  const getModeBadge = () => {
    if (canEdit) {
      // PI and CI - no badge needed
      return null;
    } else if (canComment || isSuggestionMode) {
      // Reviewers and committee members - suggestion mode
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-xs font-medium text-amber-700">
            Suggestion Mode - You can highlight and comment only
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-black">Form I - Project Proposal</h2>
        </div>
        <div className="flex items-center gap-3">
          {getModeBadge()}
          {/* Online Users */}
          <button
            onClick={onShowOnlineUsers}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-black/20 rounded-lg hover:bg-black/5 transition-colors"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-black">{onlineUsers.length} online</span>
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="border border-black/10 rounded-lg overflow-hidden">
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-black text-sm">Loading editor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Changes Button - Below Editor, only for PI/CI */}
      {onSaveChanges && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onSaveChanges}
            className="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;
