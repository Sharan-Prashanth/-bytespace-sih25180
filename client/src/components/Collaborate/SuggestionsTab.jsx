import { useState } from 'react';

export default function SuggestionsTab({ suggestions, canRespond, onRespond, onResolve }) {
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = (suggestionId) => {
    if (replyText.trim()) {
      onRespond(suggestionId, replyText);
      setReplyText('');
    }
  };

  const getAuthorBadge = (source) => {
    if (source === 'ai') {
      return (
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
          AI Assistant
        </span>
      );
    } else if (source === 'reviewer') {
      return (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
          Reviewer
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
          Team Member
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-black">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="font-semibold mb-1">No suggestions yet</p>
            <p className="text-sm text-black">Feedback from AI and reviewers will appear here</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div 
              key={suggestion._id}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                    {suggestion.authorAvatar}
                  </div>
                  <div>
                    <div className="font-semibold text-black">{suggestion.authorName}</div>
                    <div className="text-xs text-black">{new Date(suggestion.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAuthorBadge(suggestion.source)}
                  {suggestion.status === 'resolved' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-black mb-1">
                  <span className="font-semibold">Section:</span> {suggestion.section}
                </div>
                {suggestion.quote && (
                  <div className="bg-gray-50 border-l-4 border-orange-500 p-3 my-2 text-sm text-black italic">
                    {suggestion.quote}
                  </div>
                )}
                <p className="text-black mt-2">{suggestion.content}</p>
              </div>

              {suggestion.replies && suggestion.replies.length > 0 && (
                <div className="ml-6 space-y-2 mb-3">
                  {suggestion.replies.map((reply, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {reply.authorAvatar}
                        </div>
                        <span className="text-sm font-semibold text-black">{reply.authorName}</span>
                        <span className="text-xs text-black">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-black ml-8">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeThread === suggestion._id ? (
                <div className="ml-6 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your response..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(suggestion._id)}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
                    >
                      Send Reply
                    </button>
                    <button
                      onClick={() => setActiveThread(null)}
                      className="px-3 py-1.5 border border-gray-300 text-black rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {canRespond && suggestion.status !== 'resolved' && (
                    <button
                      onClick={() => setActiveThread(suggestion._id)}
                      className="px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reply
                    </button>
                  )}
                  {canRespond && suggestion.status !== 'resolved' && (
                    <button
                      onClick={() => onResolve(suggestion._id)}
                      className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
