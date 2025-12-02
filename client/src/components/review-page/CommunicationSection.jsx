'use client';

import React, { useState } from 'react';
import { MessageSquare, ChevronDown, Send, Reply, CheckCircle } from 'lucide-react';

const CommunicationSection = ({ 
  comments = [], 
  currentUser,
  onAddComment,
  onReply,
  onResolve,
  canResolve = false
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter comments - only show comments from reviewers and committee members
  const filterReviewerComments = (commentList) => {
    return commentList.filter(c => {
      const authorRoles = c.author?.roles || [];
      return authorRoles.some(role => 
        ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
      );
    });
  };

  const filteredComments = filterReviewerComments(comments);
  const unresolvedComments = filteredComments.filter(c => !c.resolved && !c.isResolved);
  const resolvedComments = filteredComments.filter(c => c.resolved || c.isResolved);
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

  const handleReply = async (commentId) => {
    if (replyText[commentId]?.trim() && onReply) {
      await onReply(commentId, replyText[commentId]);
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyFor(null);
    }
  };

  const formatRole = (roles) => {
    if (!roles || roles.length === 0) return 'User';
    // Return the most relevant role
    if (roles.includes('SUPER_ADMIN')) return 'Admin';
    if (roles.includes('CMPDI_MEMBER')) return 'CMPDI';
    if (roles.includes('TSSRC_MEMBER')) return 'TSSRC';
    if (roles.includes('SSRC_MEMBER')) return 'SSRC';
    if (roles.includes('EXPERT_REVIEWER')) return 'Expert';
    return 'User';
  };

  const getRoleBadgeColor = (roles) => {
    if (!roles || roles.length === 0) return 'bg-black/10 text-black';
    if (roles.includes('SUPER_ADMIN')) return 'bg-purple-100 text-purple-800';
    if (roles.includes('CMPDI_MEMBER')) return 'bg-blue-100 text-blue-800';
    if (roles.includes('TSSRC_MEMBER')) return 'bg-green-100 text-green-800';
    if (roles.includes('SSRC_MEMBER')) return 'bg-orange-100 text-orange-800';
    if (roles.includes('EXPERT_REVIEWER')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-black/10 text-black';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-black">Communication</h2>
          {unresolvedComments.length > 0 && (
            <span className="px-2 py-1 bg-black text-white text-xs font-medium rounded">
              {unresolvedComments.length} active
            </span>
          )}
        </div>
        <button className="p-1 hover:bg-black/5 rounded transition-colors">
          <ChevronDown 
            className={`w-5 h-5 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4">
          {/* Description */}
          <p className="text-sm text-black mb-4">
            This section shows comments and discussions from reviewers and committee members only.
          </p>

          {/* Toggle between Active and Resolved */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResolved(false);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                !showResolved ? 'bg-black text-white' : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              Active ({unresolvedComments.length})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResolved(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showResolved ? 'bg-black text-white' : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              Resolved ({resolvedComments.length})
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {displayComments.length === 0 ? (
              <div className="text-center py-8 text-black">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {showResolved ? 'No resolved comments.' : 'No active comments from reviewers.'}
                </p>
              </div>
            ) : (
              displayComments.map((comment) => (
                <div 
                  key={comment.id || comment._id} 
                  className={`p-4 rounded-lg border ${
                    comment.resolved || comment.isResolved 
                      ? 'bg-black/5 border-black/10' 
                      : 'border-black/20 bg-white'
                  }`}
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-sm font-semibold text-black">
                        {getInitials(comment.author?.fullName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black">
                            {comment.author?.fullName || 'Unknown'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(comment.author?.roles)}`}>
                            {formatRole(comment.author?.roles)}
                          </span>
                        </div>
                        <span className="text-xs text-black">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    {(comment.resolved || comment.isResolved) && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        <CheckCircle className="w-3 h-3" />
                        Resolved
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-black mb-3 leading-relaxed">{comment.content}</p>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-black/10 space-y-3 mb-3">
                      {comment.replies.map((reply, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-black">
                              {reply.author?.fullName || 'Unknown'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(reply.author?.roles)}`}>
                              {formatRole(reply.author?.roles)}
                            </span>
                            <span className="text-xs text-black">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-black">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {!(comment.resolved || comment.isResolved) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplyFor(showReplyFor === (comment.id || comment._id) ? null : (comment.id || comment._id));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black border border-black/20 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                      {canResolve && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolve && onResolve(comment.id || comment._id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-black/90 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reply Input */}
                  {showReplyFor === (comment.id || comment._id) && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText[comment.id || comment._id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id || comment._id]: e.target.value }))}
                        placeholder="Type your reply..."
                        className="flex-1 px-3 py-2 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/20"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(comment.id || comment._id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-black/90 transition-colors"
                      >
                        <Send className="w-3 h-3" />
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
                className="flex-1 px-4 py-2.5 border border-black/20 rounded-lg text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/20"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddComment();
                }}
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationSection;
