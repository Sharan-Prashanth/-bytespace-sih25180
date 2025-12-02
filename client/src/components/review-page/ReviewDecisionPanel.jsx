'use client';

import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  ChevronDown,
  AlertTriangle,
  Lock,
  Info
} from 'lucide-react';

const ReviewDecisionPanel = ({ 
  userRoles = [],
  proposalStatus,
  onSubmitDecision,
  isSubmitting = false,
  hasUserMadeDecision = false,
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState('');

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const infoBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-black/5 border-black/10';
  const btnBg = isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-black/90';

  // Check if user is an expert reviewer - experts cannot see this panel
  const isExpert = userRoles.includes('EXPERT_REVIEWER') && 
                   !userRoles.some(role => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role));
  
  // Check if user is CMPDI member
  const isCMPDI = userRoles.includes('CMPDI_MEMBER');
  const isTSSRC = userRoles.includes('TSSRC_MEMBER');
  const isSSRC = userRoles.includes('SSRC_MEMBER');
  const isAdmin = userRoles.includes('SUPER_ADMIN');

  // If user is only an expert reviewer, do not render this panel
  if (isExpert) {
    return null;
  }

  // Check if user can make a decision based on proposal status
  const canMakeDecision = () => {
    // If user already made decision for this status, they cannot make another
    if (hasUserMadeDecision) {
      return false;
    }

    // Admin can make decisions at any stage
    if (isAdmin) {
      return true;
    }

    // CMPDI members can make decisions at CMPDI_REVIEW and CMPDI_EXPERT_REVIEW status
    if (isCMPDI && (proposalStatus === 'CMPDI_REVIEW' || proposalStatus === 'CMPDI_EXPERT_REVIEW')) {
      return true;
    }

    // TSSRC members can only make decisions at TSSRC_REVIEW status
    if (isTSSRC && proposalStatus === 'TSSRC_REVIEW') {
      return true;
    }

    // SSRC members can only make decisions at SSRC_REVIEW status
    if (isSSRC && proposalStatus === 'SSRC_REVIEW') {
      return true;
    }

    return false;
  };

  // Determine available decision options based on role and proposal status
  const getDecisionOptions = () => {
    const options = [];

    if ((isCMPDI || isAdmin) && proposalStatus === 'CMPDI_REVIEW') {
      // First CMPDI decision - can send for expert review
      options.push(
        { value: 'CMPDI_ACCEPTED', label: 'Accept Proposal', icon: CheckCircle, color: 'green' },
        { value: 'CMPDI_REJECTED', label: 'Reject Proposal', icon: XCircle, color: 'red' },
        { value: 'CMPDI_EXPERT_REVIEW', label: 'Send for Expert Review', icon: UserPlus, color: 'blue' }
      );
    } else if ((isCMPDI || isAdmin) && proposalStatus === 'CMPDI_EXPERT_REVIEW') {
      // Second CMPDI decision - after expert review, only accept or reject
      options.push(
        { value: 'CMPDI_ACCEPTED', label: 'Accept Proposal', icon: CheckCircle, color: 'green' },
        { value: 'CMPDI_REJECTED', label: 'Reject Proposal', icon: XCircle, color: 'red' }
      );
    } else if ((isTSSRC || isAdmin) && proposalStatus === 'TSSRC_REVIEW') {
      options.push(
        { value: 'TSSRC_ACCEPTED', label: 'Accept Proposal', icon: CheckCircle, color: 'green' },
        { value: 'TSSRC_REJECTED', label: 'Reject Proposal', icon: XCircle, color: 'red' }
      );
    } else if ((isSSRC || isAdmin) && proposalStatus === 'SSRC_REVIEW') {
      options.push(
        { value: 'SSRC_ACCEPTED', label: 'Accept Proposal', icon: CheckCircle, color: 'green' },
        { value: 'SSRC_REJECTED', label: 'Reject Proposal', icon: XCircle, color: 'red' }
      );
    }

    return options;
  };

  const decisionOptions = getDecisionOptions();
  const userCanMakeDecision = canMakeDecision();

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: {
        border: isSelected ? 'border-green-500 bg-green-50' : borderColor,
        icon: 'text-green-600',
        radio: isSelected ? 'border-green-500 bg-green-500' : isDark ? 'border-white/30' : 'border-black/30'
      },
      red: {
        border: isSelected ? 'border-red-500 bg-red-50' : borderColor,
        icon: 'text-red-600',
        radio: isSelected ? 'border-red-500 bg-red-500' : isDark ? 'border-white/30' : 'border-black/30'
      },
      blue: {
        border: isSelected ? 'border-blue-500 bg-blue-50' : borderColor,
        icon: 'text-blue-600',
        radio: isSelected ? 'border-blue-500 bg-blue-500' : isDark ? 'border-white/30' : 'border-black/30'
      }
    };
    return colors[color] || colors.green;
  };

  const handleSubmit = () => {
    if (selectedDecision && onSubmitDecision) {
      onSubmitDecision(selectedDecision);
    }
  };

  // Get message explaining why user cannot make decision
  const getRestrictedMessage = () => {
    if (hasUserMadeDecision) {
      return 'You have already submitted your decision for this review stage. Only one decision per status is allowed.';
    }

    if (isCMPDI && !['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW'].includes(proposalStatus)) {
      return 'This proposal is not currently under CMPDI review. You can only make decisions when the proposal is at CMPDI review stage.';
    }

    if (isTSSRC && proposalStatus !== 'TSSRC_REVIEW') {
      return 'This proposal is not currently under TSSRC review. You can only make decisions when the proposal is at TSSRC review stage.';
    }

    if (isSSRC && proposalStatus !== 'SSRC_REVIEW') {
      return 'This proposal is not currently under SSRC review. You can only make decisions when the proposal is at SSRC review stage.';
    }

    return 'You are not authorized to make a decision at the current review stage.';
  };

  // If no decision options available and user cannot make decision, show locked state
  if (decisionOptions.length === 0 && !userCanMakeDecision) {
    return (
      <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
        {/* Header */}
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center">
            <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
              <Lock className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>
            <h2 className={`text-xl font-semibold ${textColor}`}>Review Decision</h2>
          </div>
          <button className={`p-1 ${hoverBg} rounded transition-colors`}>
            <ChevronDown className={`w-5 h-5 ${textColor} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div className="mt-4">
            <div className={`flex items-start gap-3 p-4 ${infoBg} border rounded-lg`}>
              <Info className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`text-sm ${textColor} font-medium`}>Decision Not Available</p>
                <p className={`text-sm ${textColor} mt-1`}>{getRestrictedMessage()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no options at all (user has no role that can make decisions), don't render
  if (decisionOptions.length === 0) {
    return null;
  }

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
            <ClipboardCheck className={`w-5 h-5 ${textColor}`} />
          </div>
          <h2 className={`text-xl font-semibold ${textColor}`}>Review Decision</h2>
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
          {/* Warning about decision permanence */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-black font-medium">Important Notice</p>
              <p className="text-sm text-black mt-1">
                Your decision will require a detailed report and will be final once submitted. 
                Please review the proposal thoroughly before making a decision.
              </p>
            </div>
          </div>

          {/* Decision Options */}
          <div className="space-y-3 mb-4">
            {decisionOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedDecision === option.value;
              const colorClasses = getColorClasses(option.color, isSelected);
              
              return (
                <label 
                  key={option.value} 
                  className={`flex items-center cursor-pointer p-4 rounded-lg border-2 transition-all ${colorClasses.border} ${isSelected ? '' : isDark ? 'bg-transparent' : ''}`}
                >
                  <input
                    type="radio"
                    name="reviewDecision"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => setSelectedDecision(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${colorClasses.radio}`}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <Icon className={`w-5 h-5 mr-3 ${colorClasses.icon}`} />
                  <span className={`font-medium ${isSelected ? 'font-semibold text-black' : textColor}`}>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedDecision || isSubmitting}
            className={`w-full py-3 px-6 ${btnBg} font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Processing...' : 'Proceed with Decision'}
          </button>

          <p className={`text-xs ${textColor} text-center mt-3`}>
            You will be asked to provide a detailed report before the decision is finalized.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewDecisionPanel;
