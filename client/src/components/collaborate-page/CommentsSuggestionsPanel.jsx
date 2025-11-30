'use client';

import { useState } from 'react';

const CommentsSuggestionsPanel = ({ 
  comments = [], 
  canResolve = false,
  onReply,
  onResolve,
  onAddComment 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-black">Comments & Suggestions</h2>
          {unresolvedComments.length > 0 && (
            <span className="px-2 py-1 bg-black text-white text-xs font-medium rounded">
              {unresolvedComments.length} active
            </span>
          )}
        </div>
        <button className="p-1 hover:bg-black/5 rounded transition-colors">
          <svg 
            className={`w-5 h-5 text-black transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
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
            !showResolved ? 'bg-black text-white' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
        >
          Active ({unresolvedComments.length})
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            showResolved ? 'bg-black text-white' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
        >
          Resolved ({resolvedComments.length})
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
        {displayComments.length === 0 ? (
          <div className="text-center py-8 text-black">
            <p className="text-sm">
              {showResolved ? 'No resolved comments.' : 'No active comments.'}
            </p>
          </div>
        ) : (
          displayComments.map((comment) => (
            <div 
              key={comment.id || comment._id} 
              className={`p-3 rounded-lg border ${
                comment.resolved || comment.isResolved ? 'bg-black/5 border-black/10' : 'border-black/20'
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-black/10 rounded-full flex items-center justify-center text-xs font-semibold text-black">
                    {comment.author?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-black">
                      {comment.author?.fullName || 'Unknown'}
                    </span>
                    <span className="text-xs text-black ml-2">
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
              <p className="text-sm text-black mb-2">{comment.content}</p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 pl-3 border-l-2 border-black/10 space-y-1 mb-2">
                  {comment.replies.map((reply, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold text-black">{reply.author?.fullName || 'Unknown'}: </span>
                      <span className="text-black">{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!(comment.resolved || comment.isResolved) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReplyFor(showReplyFor === (comment.id || comment._id) ? null : (comment.id || comment._id))}
                    className="px-2 py-1 text-xs font-medium text-black border border-black/20 rounded hover:bg-black/5 transition-colors"
                  >
                    Reply
                  </button>
                  {canResolve && (
                    <button
                      onClick={() => onResolve && onResolve(comment.id || comment._id)}
                      className="px-2 py-1 text-xs font-medium text-white bg-black rounded hover:bg-black/90 transition-colors"
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
                    className="flex-1 px-3 py-1.5 border border-black/20 rounded text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                  <button
                    onClick={() => handleReply(comment.id || comment._id)}
                    className="px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-black/90 transition-colors"
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
          <div className="pt-4 border-t border-black/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/20"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
