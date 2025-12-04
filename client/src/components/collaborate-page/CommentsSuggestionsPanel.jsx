'use client';

import { useState } from 'react';

const CommentsSuggestionsPanel = ({ 
  comments = [], 
  canResolve = false,
  onReply,
  onResolve,
  onAddComment,
  theme = 'light'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const inputBg = isDark ? 'bg-slate-700 text-white' : 'bg-white text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const activeBtnBg = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const inactiveBtnBg = isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10';
  const commentBg = isDark ? 'bg-slate-700/50 border-slate-600' : 'border-black/20';
  const resolvedBg = isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-black/5 border-black/10';
  const avatarBg = isDark ? 'bg-slate-600' : 'bg-black/10';

  const unresolvedComments = comments.filter(c => !c.resolved && !c.isResolved);
  const resolvedComments = comments.filter(c => c.resolved || c.isResolved);
  const displayComments = showResolved ? resolvedComments : unresolvedComments;

  const handleAddComment = async () => {
    if (newComment.trim() && onAddComment && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onAddComment(newComment);
        setNewComment('');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReply = (commentId) => {
    if (replyText[commentId]?.trim() && onReply) {
      onReply(commentId, replyText[commentId]);
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyFor(null);
    }
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    return role.replace(/_/g, ' ');
  };

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-semibold ${textColor}`}>Comments & Suggestions</h2>
          {unresolvedComments.length > 0 && (
            <span className={`px-2 py-1 ${activeBtnBg} text-xs font-medium rounded`}>
              {unresolvedComments.length} active
            </span>
          )}
        </div>
        <button className={`p-1 ${hoverBg} rounded transition-colors`}>
          <svg 
            className={`w-5 h-5 ${textColor} transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-4">

      {/* Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowResolved(false)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            !showResolved ? activeBtnBg : inactiveBtnBg
          }`}
        >
          Active ({unresolvedComments.length})
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            showResolved ? activeBtnBg : inactiveBtnBg
          }`}
        >
          Resolved ({resolvedComments.length})
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
        {displayComments.length === 0 ? (
          <div className={`text-center py-8 ${textColor}`}>
            <p className="text-sm">
              {showResolved ? 'No resolved comments.' : 'No active comments.'}
            </p>
          </div>
        ) : (
          displayComments.map((comment) => (
            <div 
              key={comment.id || comment._id} 
              className={`p-3 rounded-lg border ${
                comment.resolved || comment.isResolved ? resolvedBg : commentBg
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center text-xs font-semibold ${textColor}`}>
                    {comment.author?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${textColor}`}>
                      {comment.author?.fullName || 'Unknown'}
                    </span>
                    <span className={`text-xs ${textColor} ml-2`}>
                      {formatRole(comment.author?.role)}
                    </span>
                  </div>
                </div>
                {(comment.resolved || comment.isResolved) && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                    Resolved
                  </span>
                )}
              </div>

              {/* Content */}
              <p className={`text-sm ${textColor} mb-2`}>{comment.content}</p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className={`ml-4 pl-3 border-l-2 ${borderColor} space-y-1 mb-2`}>
                  {comment.replies.map((reply, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={`font-semibold ${textColor}`}>{reply.author?.fullName || 'Unknown'}: </span>
                      <span className={textColor}>{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!(comment.resolved || comment.isResolved) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReplyFor(showReplyFor === (comment.id || comment._id) ? null : (comment.id || comment._id))}
                    className={`px-2 py-1 text-xs font-medium ${textColor} border ${borderColor} rounded ${hoverBg} transition-colors`}
                  >
                    Reply
                  </button>
                  {canResolve && (
                    <button
                      onClick={() => onResolve && onResolve(comment.id || comment._id)}
                      className={`px-2 py-1 text-xs font-medium ${activeBtnBg} rounded transition-colors`}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              )}

              {/* Reply Input */}
              {showReplyFor === (comment.id || comment._id) && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyText[comment.id || comment._id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id || comment._id]: e.target.value }))}
                    placeholder="Type your reply..."
                    className={`flex-1 px-3 py-1.5 border ${borderColor} rounded text-sm ${inputBg} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <button
                    onClick={() => handleReply(comment.id || comment._id)}
                    className={`px-3 py-1.5 ${activeBtnBg} text-sm rounded transition-colors`}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

          {/* Add Comment */}
          <div className={`pt-4 border-t ${borderColor}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={`flex-1 px-3 py-2 border ${borderColor} rounded-lg text-sm ${inputBg} focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className={`px-4 py-2 ${activeBtnBg} text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsSuggestionsPanel;
