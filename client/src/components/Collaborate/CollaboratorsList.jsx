export default function CollaboratorsList({ 
  collaborators, 
  activeCollaborators, 
  canInviteCollaborators,
  canInviteExperts,
  onAddCollaborator,
  onInviteExpert
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 p-6 animate-slideInUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-black">Collaborators</h2>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
          {activeCollaborators.length} Online
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {collaborators.map((collab) => (
          <div key={collab._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                {collab.avatar}
              </div>
              {collab.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-black truncate">{collab.fullName}</div>
              <div className="text-xs text-black truncate">{collab.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        {canInviteCollaborators && (
          <button
            onClick={onAddCollaborator}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Co-Investigator
          </button>
        )}
        
        {canInviteExperts && (
          <button
            onClick={onInviteExpert}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Expert/Reviewer
          </button>
        )}
      </div>
    </div>
  );
}
