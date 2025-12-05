'use client';

import { useState, useRef } from 'react';

const CommentsSuggestionsPanel = ({ 
  comments = [], 
  canResolve = false,
  currentUserId = null,
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
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const submitLockRef = useRef(false);

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
    // Prevent double submission
    if (!newComment.trim() || !onAddComment || isSubmitting || submitLockRef.current) {
      return;
    }
    
    submitLockRef.current = true;
    setIsSubmitting(true);
    
    const commentText = newComment.trim();
    setNewComment(''); // Clear immediately to prevent double submit
    
    try {
      await onAddComment(commentText);
    } catch (error) {
      // Restore comment if failed
      setNewComment(commentText);
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
      // Release lock after a short delay to prevent rapid re-submission
      setTimeout(() => {
        submitLockRef.current = false;
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleReply = (commentId) => {
    if (replyText[commentId]?.trim() && onReply) {
      onReply(commentId, replyText[commentId]);
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyFor(null);
    }
  };

  const formatRole = (roles) => {
    if (!roles) return 'User';
    // Handle array of roles
    if (Array.isArray(roles)) {
      const roleMap = {
        'USER': 'User',
        'CMPDI_MEMBER': 'CMPDI',
        'TSSRC_MEMBER': 'TSSRC',
        'SSRC_MEMBER': 'SSRC',
        'EXPERT_REVIEWER': 'Expert',
        'SUPER_ADMIN': 'Admin'
      };
      // Return the first meaningful role
      for (const role of roles) {
        if (roleMap[role]) return roleMap[role];
      }
      return 'User';
    }
    // Handle string role
    return roles.replace(/_/g, ' ');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if current user is the author of a comment
  const isCommentAuthor = (comment) => {
    if (!currentUserId || !comment.author) return false;
    const authorId = comment.author._id || comment.author;
    return authorId?.toString() === currentUserId?.toString();
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
          {/* Info Icon with Tooltip */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoTooltip(!showInfoTooltip);
              }}
              className={`p-1 rounded-full ${hoverBg} transition-colors`}
              aria-label="How to use comments"
            >
              <svg className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-black/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Tooltip */}
            {showInfoTooltip && (
              <div className={`absolute left-0 top-full mt-2 z-50 w-72 p-4 rounded-lg shadow-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/10'}`}>
                <h4 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  How Comments Work
                </h4>
                <ul className={`text-xs ${textColor} space-y-2`}>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Add comments to provide feedback or ask questions about the proposal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>All collaborators can reply to any comment to continue the discussion.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Only the person who created a comment can mark it as resolved.</span>
                  </li>
                </ul>
                <div className={`mt-3 pt-3 border-t ${borderColor} text-xs ${isDark ? 'text-slate-400' : 'text-black/60'}`}>
                  Click outside to close
                </div>
              </div>
            )}
          </div>
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
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${textColor}`}>
                        {comment.author?.fullName || 'Unknown'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} ${textColor}`}>
                        {formatRole(comment.author?.roles || comment.author?.role)}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-black/60'}`}>
                      {formatTime(comment.createdAt)}
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
                <div className={`ml-4 pl-3 border-l-2 ${borderColor} space-y-2 mb-2`}>
                  {comment.replies.map((reply, idx) => (
                    <div key={reply._id || idx} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${textColor}`}>
                          {reply.author?.fullName || 'Unknown'}
                        </span>
                        <span className={`text-xs px-1 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} ${textColor}`}>
                          {formatRole(reply.author?.roles || reply.author?.role)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-black/60'}`}>
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
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
                  {/* Only show resolve button if user is the comment author */}
                  {isCommentAuthor(comment) && (
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
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className={`flex-1 px-3 py-2 border ${borderColor} rounded-lg text-sm ${inputBg} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isSubmitting}
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
