'use client';

import React, { useState } from 'react';
import { MessageSquare, ChevronDown, Send, Reply } from 'lucide-react';

const CommunicationSection = ({ 
  comments = [], 
  currentUser,
  onAddComment,
  onReply,
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const activeBtnBg = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const inputBg = isDark ? 'bg-slate-700 text-white' : 'bg-white text-black';
  const avatarBg = isDark ? 'bg-slate-600' : 'bg-black/10';
  const commentBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/20';

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
    if (!roles || roles.length === 0) return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
    if (roles.includes('SUPER_ADMIN')) return 'bg-purple-100 text-purple-800';
    if (roles.includes('CMPDI_MEMBER')) return 'bg-blue-100 text-blue-800';
    if (roles.includes('TSSRC_MEMBER')) return 'bg-green-100 text-green-800';
    if (roles.includes('SSRC_MEMBER')) return 'bg-orange-100 text-orange-800';
    if (roles.includes('EXPERT_REVIEWER')) return 'bg-indigo-100 text-indigo-800';
    return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
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
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
            <MessageSquare className={`w-5 h-5 ${textColor}`} />
          </div>
          <h2 className={`text-xl font-semibold ${textColor}`}>Communication</h2>
          {filteredComments.length > 0 && (
            <span className={`px-2 py-1 ${activeBtnBg} text-xs font-medium rounded`}>
              {filteredComments.length} {filteredComments.length === 1 ? 'thread' : 'threads'}
            </span>
          )}
        </div>
        <button className={`p-1 ${hoverBg} rounded transition-colors`}>
          <ChevronDown 
            className={`w-5 h-5 ${textColor} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4">
          {/* Description */}
          <p className={`text-sm ${textColor} mb-4`}>
            Discussion threads from reviewers and committee members.
          </p>

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {filteredComments.length === 0 ? (
              <div className={`text-center py-8 ${textColor}`}>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No comments from reviewers yet.</p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div 
                  key={comment.id || comment._id} 
                  className={`p-4 rounded-lg border ${commentBg}`}
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center text-sm font-semibold ${textColor}`}>
                        {getInitials(comment.author?.fullName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${textColor}`}>
                            {comment.author?.fullName || 'Unknown'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(comment.author?.roles)}`}>
                            {formatRole(comment.author?.roles)}
                          </span>
                        </div>
                        <span className={`text-xs ${textColor} opacity-70`}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p className={`text-sm ${textColor} mb-3 leading-relaxed`}>{comment.content}</p>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className={`ml-6 pl-4 border-l-2 ${borderColor} space-y-3 mb-3`}>
                      {comment.replies.map((reply, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${textColor}`}>
                              {reply.author?.fullName || 'Unknown'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(reply.author?.roles)}`}>
                              {formatRole(reply.author?.roles)}
                            </span>
                            <span className={`text-xs ${textColor} opacity-70`}>
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className={textColor}>{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReplyFor(showReplyFor === (comment.id || comment._id) ? null : (comment.id || comment._id));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${textColor} border ${borderColor} rounded-lg ${hoverBg} transition-colors`}
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  </div>

                  {/* Reply Input */}
                  {showReplyFor === (comment.id || comment._id) && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText[comment.id || comment._id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id || comment._id]: e.target.value }))}
                        placeholder="Type your reply..."
                        className={`flex-1 px-3 py-2 border ${borderColor} rounded-lg text-sm ${inputBg} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(comment.id || comment._id);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 ${activeBtnBg} text-sm rounded-lg transition-colors`}
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
          <div className={`pt-4 border-t ${borderColor}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Start a new discussion..."
                className={`flex-1 px-4 py-2.5 border ${borderColor} rounded-lg text-sm ${inputBg} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddComment();
                }}
                disabled={!newComment.trim() || isSubmitting}
                className={`flex items-center gap-2 px-5 py-2.5 ${activeBtnBg} text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationSection;
