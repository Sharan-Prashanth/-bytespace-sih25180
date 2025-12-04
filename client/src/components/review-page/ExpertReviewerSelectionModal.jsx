'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../../utils/api';

const ExpertReviewerSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  proposalCode,
  isSubmitting = false,
  theme = 'light'
}) => {
  const [expertReviewers, setExpertReviewers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-slate-400' : 'text-black/60';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-gray-200';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const itemBg = isDark ? 'bg-white/5' : 'bg-gray-50';
  const selectedBg = isDark ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-50 border-blue-500';
  const btnPrimary = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90';
  const btnSecondary = isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5';

  // Fetch expert reviewers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExpertReviewers();
    }
  }, [isOpen]);

  const fetchExpertReviewers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/workflow/expert-reviewers');
      setExpertReviewers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching expert reviewers:', err);
      setError(err.response?.data?.message || 'Failed to load expert reviewers');
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewerSelection = (reviewerId) => {
    setSelectedReviewers(prev => {
      if (prev.includes(reviewerId)) {
        return prev.filter(id => id !== reviewerId);
      } else {
        return [...prev, reviewerId];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedReviewers.length > 0 && onConfirm) {
      onConfirm(selectedReviewers);
    }
  };

  // Filter reviewers by search query
  const filteredReviewers = expertReviewers.filter(reviewer => {
    const query = searchQuery.toLowerCase();
    return (
      reviewer.fullName?.toLowerCase().includes(query) ||
      reviewer.email?.toLowerCase().includes(query) ||
      reviewer.expertiseDomains?.some(domain => domain.toLowerCase().includes(query)) ||
      reviewer.organization?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative ${modalBg} rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div>
            <h2 className={`text-xl font-semibold ${textColor}`}>Select Expert Reviewers</h2>
            <p className={`text-sm ${subTextColor} mt-1`}>
              Choose one or more expert reviewers for proposal {proposalCode}
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 ${hoverBg} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${textColor}`} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-6 py-4 border-b ${borderColor}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${subTextColor}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, expertise, or organization..."
              className={`w-full pl-10 pr-4 py-3 ${inputBg} ${textColor} rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-8 h-8 ${textColor} animate-spin`} />
              <span className={`ml-3 ${textColor}`}>Loading expert reviewers...</span>
            </div>
          ) : error ? (
            <div className={`flex items-center justify-center py-12 ${textColor}`}>
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <span>{error}</span>
            </div>
          ) : filteredReviewers.length === 0 ? (
            <div className={`text-center py-12 ${subTextColor}`}>
              {searchQuery ? 'No expert reviewers match your search.' : 'No expert reviewers available.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviewers.map((reviewer) => {
                const isSelected = selectedReviewers.includes(reviewer._id);
                
                return (
                  <div
                    key={reviewer._id}
                    onClick={() => toggleReviewerSelection(reviewer._id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? selectedBg : `${itemBg} border-transparent ${hoverBg}`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'
                        }`}>
                          {reviewer.fullName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${textColor}`}>
                            {reviewer.fullName}
                          </h4>
                          <p className={`text-sm ${subTextColor}`}>
                            {reviewer.email}
                          </p>
                          {reviewer.organization && (
                            <p className={`text-sm ${subTextColor} mt-1`}>
                              {reviewer.organization}
                            </p>
                          )}
                          {reviewer.expertiseDomains && reviewer.expertiseDomains.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reviewer.expertiseDomains.map((domain, idx) => (
                                <span 
                                  key={idx}
                                  className={`px-2 py-0.5 text-xs rounded ${
                                    isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black'
                                  }`}
                                >
                                  {domain}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : isDark ? 'border-white/30' : 'border-black/20'
                      }`}>
                        {isSelected && (
                          <UserCheck className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${borderColor}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${subTextColor}`}>
              {selectedReviewers.length} reviewer{selectedReviewers.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-2 border ${btnSecondary} rounded-lg font-medium transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedReviewers.length === 0 || isSubmitting}
                className={`px-6 py-2 ${btnPrimary} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send for Expert Review'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertReviewerSelectionModal;
