'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  StarHalf,
  Send,
  ChevronDown,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';
import apiClient from '../../utils/api';

const ExpertOpinionSection = ({ 
  proposalId,
  currentUser,
  userRoles = [],
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [opinion, setOpinion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userOpinion, setUserOpinion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/20';
  const inputBg = isDark ? 'bg-slate-700 text-white placeholder-slate-400' : 'bg-white text-black placeholder-black/50';
  const infoBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-black/5 border-black/10';
  const btnBg = isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-black/90';
  const starMuted = isDark ? 'text-white/30' : 'text-black/30';

  // Check if user can submit opinions
  const canSubmitOpinion = userRoles.some(role => 
    ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
  );

  // Check if user has already submitted opinion
  useEffect(() => {
    const checkExistingOpinion = async () => {
      if (!proposalId || !canSubmitOpinion) return;

      try {
        const response = await apiClient.get(`/api/proposals/${proposalId}/opinions/check`);
        if (response.data.success && response.data.data.hasSubmitted) {
          setHasSubmitted(true);
          setUserOpinion(response.data.data.opinion);
        }
      } catch (err) {
        console.warn('Could not check existing opinion:', err);
      }
    };

    checkExistingOpinion();
  }, [proposalId, canSubmitOpinion]);

  // Handle star click - supports half stars
  const handleStarClick = (starIndex, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    
    // Click on left half = .5, right half = whole number
    const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;
    setRating(newRating);
  };

  // Handle star hover - supports half stars
  const handleStarHover = (starIndex, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const isLeftHalf = hoverX < rect.width / 2;
    
    const newHoverRating = isLeftHalf ? starIndex - 0.5 : starIndex;
    setHoverRating(newHoverRating);
  };

  // Render star with support for half-filled state
  const renderStar = (starIndex, displayRating) => {
    if (displayRating >= starIndex) {
      // Full star
      return <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 transition-colors" />;
    } else if (displayRating >= starIndex - 0.5) {
      // Half star
      return (
        <div className="relative w-8 h-8">
          <Star className={`w-8 h-8 ${starMuted} absolute`} />
          <div className="absolute overflow-hidden w-1/2">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      );
    } else {
      // Empty star
      return <Star className={`w-8 h-8 ${starMuted} transition-colors`} />;
    }
  };

  // Render star for display (read-only)
  const renderDisplayStar = (starIndex, displayRating) => {
    if (displayRating >= starIndex) {
      return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    } else if (displayRating >= starIndex - 0.5) {
      return (
        <div className="relative w-4 h-4">
          <Star className={`w-4 h-4 ${starMuted} absolute`} />
          <div className="absolute overflow-hidden w-1/2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      );
    } else {
      return <Star className={`w-4 h-4 ${starMuted}`} />;
    }
  };

  const handleSubmit = async () => {
    // Rating is now optional, so only validate opinion if provided
    if (opinion.trim().length > 0 && opinion.trim().length < 10) {
      setError('Opinion must be at least 10 characters if provided');
      return;
    }

    // At least opinion or rating should be provided
    if (rating === 0 && opinion.trim().length === 0) {
      setError('Please provide a rating or an opinion (or both)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        opinion: opinion.trim() || null
      };
      
      // Only include rating if set
      if (rating > 0) {
        payload.rating = rating;
      }

      const response = await apiClient.post(`/api/proposals/${proposalId}/opinions`, payload);

      if (response.data.success) {
        setSuccess('Your opinion has been submitted successfully');
        setHasSubmitted(true);
        setUserOpinion(response.data.data);
      }
    } catch (err) {
      console.error('Error submitting opinion:', err);
      setError(err.response?.data?.message || 'Failed to submit opinion');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show section if user cannot submit opinions
  if (!canSubmitOpinion) {
    return null;
  }

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mr-1`}>
            <MessageSquare className={`w-5 h-5 ${textColor}`} />
          </div>
          <h2 className={`text-xl font-semibold ${textColor}`}>Expert Opinion</h2>
          <span className={`text-xs px-2 py-0.5 ${infoBg} border rounded ${textColor}`}>Optional</span>
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
          {hasSubmitted ? (
            // Show submitted opinion
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-black font-medium">Opinion Submitted</p>
                  <p className="text-sm text-black mt-1">
                    You have already submitted your opinion for this proposal.
                  </p>
                </div>
              </div>

              {userOpinion && (
                <div className={`p-4 ${infoBg} border rounded-lg`}>
                  {userOpinion.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm ${textColor} font-medium`}>Your Rating:</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {renderDisplayStar(star, userOpinion.rating)}
                          </span>
                        ))}
                      </div>
                      <span className={`text-sm ${textColor}`}>({userOpinion.rating}/5)</span>
                    </div>
                  )}
                  {userOpinion.opinion && (
                    <div>
                      <span className={`text-sm ${textColor} font-medium`}>Your Opinion:</span>
                      <p className={`text-sm ${textColor} mt-1`}>{userOpinion.opinion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Show opinion form
            <div className="space-y-4">
              {/* Visibility Notice */}
              <div className={`flex items-start gap-2 p-3 ${infoBg} border rounded-lg`}>
                <Eye className={`w-4 h-4 ${textColor} flex-shrink-0 mt-0.5`} />
                <p className={`text-sm ${textColor}`}>
                  Your opinion will be visible to the Principal Investigator (PI) on their proposal tracking page.
                </p>
              </div>

              <p className={`text-sm ${textColor}`}>
                Share your expert assessment of this proposal. Both rating and opinion are optional - provide whichever you prefer.
              </p>

              {/* Rating Section */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  Rating (Optional - supports half stars)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={(e) => handleStarClick(star, e)}
                      onMouseMove={(e) => handleStarHover(star, e)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                    >
                      {renderStar(star, hoverRating || rating)}
                    </button>
                  ))}
                  {rating > 0 && (
                    <>
                      <span className={`text-sm ${textColor} ml-2`}>({rating}/5)</span>
                      <button
                        type="button"
                        onClick={() => setRating(0)}
                        className={`text-xs ${textColor} ml-2 underline`}
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
                <p className={`text-xs ${textColor} mt-1`}>
                  Click left half for .5 stars, right half for whole stars
                </p>
              </div>

              {/* Opinion Text */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  Your Opinion (Optional)
                </label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="Share your thoughts on this proposal..."
                  rows={4}
                  className={`w-full px-4 py-3 border ${borderColor} rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
                <p className={`text-xs ${textColor} mt-1`}>
                  {opinion.length}/2000 characters {opinion.length > 0 && opinion.length < 10 && '(minimum 10 if provided)'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (rating === 0 && opinion.trim().length === 0) || (opinion.trim().length > 0 && opinion.trim().length < 10)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 ${btnBg} font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Opinion'}
              </button>

              <p className={`text-xs ${textColor} text-center`}>
                You can only submit one opinion per proposal. This cannot be changed once submitted.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertOpinionSection;
