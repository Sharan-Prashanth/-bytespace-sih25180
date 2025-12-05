'use client';

import React from 'react';
import { MessageSquare, Star, ChevronDown, User } from 'lucide-react';

const TrackExpertOpinions = ({ 
  opinions = [],
  averageRating = 0,
  isOpen,
  onToggle,
  theme = 'light'
}) => {
  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const itemBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-black/5 border-black/10';
  const starMuted = isDark ? 'text-white/20' : 'text-black/20';

  const formatRole = (role) => {
    const roleMap = {
      'EXPERT_REVIEWER': 'Expert Reviewer',
      'CMPDI_MEMBER': 'CMPDI Member',
      'TSSRC_MEMBER': 'TSSRC Member',
      'SSRC_MEMBER': 'SSRC Member',
      'SUPER_ADMIN': 'Administrator'
    };
    return roleMap[role] || role;
  };

  // Render star with support for half-filled state
  const renderStar = (starIndex, rating, size = 'w-4 h-4') => {
    if (rating >= starIndex) {
      // Full star
      return <Star className={`${size} text-yellow-500 fill-yellow-500`} />;
    } else if (rating >= starIndex - 0.5) {
      // Half star
      return (
        <div className={`relative ${size}`}>
          <Star className={`${size} ${starMuted} absolute`} />
          <div className="absolute overflow-hidden w-1/2">
            <Star className={`${size} text-yellow-500 fill-yellow-500`} />
          </div>
        </div>
      );
    } else {
      // Empty star
      return <Star className={`${size} ${starMuted}`} />;
    }
  };

  return (
    <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 ${hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
            <MessageSquare className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="text-left">
            <h3 className={`text-lg font-semibold ${textColor}`}>Expert Opinions</h3>
            <div className={`flex items-center gap-2 text-sm ${textColor}`}>
              <span>{opinions.length} opinion{opinions.length !== 1 ? 's' : ''}</span>
              {opinions.length > 0 && averageRating > 0 && (
                <>
                  <span>|</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{averageRating.toFixed(1)}/5</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 ${textColor} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className={`px-6 pb-6 border-t ${borderColor}`}>
          {opinions.length === 0 ? (
            <div className="mt-4 text-center py-8">
              <MessageSquare className={`w-12 h-12 ${isDark ? 'text-white/20' : 'text-black/20'} mx-auto mb-3`} />
              <p className={textColor}>No expert opinions yet</p>
              <p className={`text-sm ${textColor} mt-1`}>
                Reviewers and committee members can submit their opinions from the review page.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {opinions.map((opinion, index) => (
                <div 
                  key={opinion._id || index} 
                  className={`p-4 ${itemBg} border rounded-lg`}
                >
                  {/* Reviewer Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-full flex items-center justify-center`}>
                        <User className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${textColor}`}>
                          {opinion.reviewer?.fullName || opinion.reviewer?.name || 'Unknown Reviewer'}
                        </h4>
                        <p className={`text-xs ${textColor}`}>
                          {formatRole(opinion.reviewerRole)}
                          {opinion.reviewer?.designation && ` - ${opinion.reviewer.designation}`}
                        </p>
                      </div>
                    </div>
                    {/* Rating - with half star support */}
                    {opinion.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {renderStar(star, opinion.rating)}
                          </span>
                        ))}
                        <span className={`ml-1 text-sm ${textColor}`}>({opinion.rating})</span>
                      </div>
                    )}
                  </div>

                  {/* Opinion Text */}
                  {opinion.opinion && (
                    <p className={`text-sm ${textColor} leading-relaxed`}>
                      {opinion.opinion}
                    </p>
                  )}

                  {/* Date */}
                  <p className={`text-xs ${textColor} mt-3`}>
                    Submitted on {new Date(opinion.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackExpertOpinions;
