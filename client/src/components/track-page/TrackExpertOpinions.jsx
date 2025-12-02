'use client';

import React from 'react';
import { MessageSquare, Star, ChevronDown, User } from 'lucide-react';

const TrackExpertOpinions = ({ 
  opinions = [],
  averageRating = 0,
  isOpen,
  onToggle
}) => {
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

  return (
    <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-black">Expert Opinions</h3>
            <div className="flex items-center gap-2 text-sm text-black">
              <span>{opinions.length} opinion{opinions.length !== 1 ? 's' : ''}</span>
              {opinions.length > 0 && (
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
        <ChevronDown className={`w-5 h-5 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-black/10">
          {opinions.length === 0 ? (
            <div className="mt-4 text-center py-8">
              <MessageSquare className="w-12 h-12 text-black/20 mx-auto mb-3" />
              <p className="text-black">No expert opinions yet</p>
              <p className="text-sm text-black mt-1">
                Reviewers and committee members can submit their opinions from the review page.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {opinions.map((opinion, index) => (
                <div 
                  key={opinion._id || index} 
                  className="p-4 bg-black/5 border border-black/10 rounded-lg"
                >
                  {/* Reviewer Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-black/60" />
                      </div>
                      <div>
                        <h4 className="font-medium text-black">
                          {opinion.reviewer?.name || 'Anonymous'}
                        </h4>
                        <p className="text-xs text-black">
                          {formatRole(opinion.reviewerRole)}
                          {opinion.reviewer?.designation && ` - ${opinion.reviewer.designation}`}
                        </p>
                      </div>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${
                            star <= opinion.rating 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-black/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Opinion Text */}
                  <p className="text-sm text-black leading-relaxed">
                    {opinion.opinion}
                  </p>

                  {/* Date */}
                  <p className="text-xs text-black mt-3">
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
