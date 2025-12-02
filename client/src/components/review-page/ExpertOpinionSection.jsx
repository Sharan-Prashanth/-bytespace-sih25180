'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Send,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../utils/api';

const ExpertOpinionSection = ({ 
  proposalId,
  currentUser,
  userRoles = []
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

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (opinion.trim().length < 10) {
      setError('Please provide an opinion (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await apiClient.post(`/api/proposals/${proposalId}/opinions`, {
        rating,
        opinion: opinion.trim()
      });

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
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center mr-3">
            <MessageSquare className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-black">Expert Opinion</h2>
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
                <div className="p-4 bg-black/5 border border-black/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-black font-medium">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${star <= userOpinion.rating ? 'text-yellow-500 fill-yellow-500' : 'text-black/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-black">({userOpinion.rating}/5)</span>
                  </div>
                  <div>
                    <span className="text-sm text-black font-medium">Your Opinion:</span>
                    <p className="text-sm text-black mt-1">{userOpinion.opinion}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Show opinion form
            <div className="space-y-4">
              <p className="text-sm text-black">
                As a reviewer, please rate this proposal and provide your expert opinion. 
                This information will be visible to committee members and help in the evaluation process.
              </p>

              {/* Rating Section */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Rating (1-5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating) 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-black/30'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-sm text-black ml-2">({rating}/5)</span>
                  )}
                </div>
              </div>

              {/* Opinion Text */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Your Opinion
                </label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="Provide your detailed opinion about this proposal..."
                  rows={4}
                  className="w-full px-4 py-3 border border-black/20 rounded-lg text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                />
                <p className="text-xs text-black mt-1">
                  {opinion.length}/2000 characters (minimum 10)
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
                disabled={isSubmitting || rating === 0 || opinion.trim().length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-black text-white font-semibold rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Opinion'}
              </button>

              <p className="text-xs text-black text-center">
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
