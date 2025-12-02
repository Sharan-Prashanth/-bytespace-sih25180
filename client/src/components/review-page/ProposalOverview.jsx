'use client';

import React from 'react';
import { FileText, User, Building2, Layers, IndianRupee, Calendar } from 'lucide-react';

const ProposalOverview = ({ proposal, isDark }) => {
  if (!proposal) return null;

  const cardBgClass = isDark ? 'bg-slate-900/50 border-slate-800 backdrop-blur-sm' : 'bg-white border-orange-200 shadow-lg';
  const textClass = isDark ? 'text-white' : 'text-black';
  const subTextClass = isDark ? 'text-slate-400' : 'text-black';

  return (
    <div className={`${cardBgClass} border rounded-xl shadow-lg p-6 animate-slideInUp`} style={{ animationDelay: '0.2s' }}>
      <h2 className={`text-2xl font-bold ${textClass} mb-4 flex items-center`}>
        <div className={`w-10 h-10 ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'} rounded-lg flex items-center justify-center mr-3`}>
          <FileText className="w-6 h-6 text-orange-600" />
        </div>
        Proposal Overview
      </h2>
      
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h3 className={`text-xl font-bold ${textClass} mb-2`}>{proposal.title}</h3>
          
          {/* Key Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className={`${isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold mb-1">
                <User size={14} />
                Principal Investigator
              </div>
              <div className={`${textClass} font-semibold text-sm`}>
                {proposal.researcher || proposal.projectLeader || 'N/A'}
              </div>
            </div>
            
            <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-1">
                <Building2 size={14} />
                Institution
              </div>
              <div className={`${textClass} font-semibold text-sm`}>
                {proposal.institution || proposal.principalAgency || 'N/A'}
              </div>
            </div>
            
            <div className={`${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold mb-1">
                <Layers size={14} />
                Domain
              </div>
              <div className={`${textClass} font-semibold text-sm`}>
                {proposal.domain || proposal.fundingMethod || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Budget and Date */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-orange-50/50 border-orange-100'} rounded-lg p-4 border`}>
            <div className={`flex items-center gap-2 ${subTextClass} text-sm font-semibold mb-1`}>
              <IndianRupee size={14} />
              Budget
            </div>
            <div className={`${textClass} font-bold text-lg`}>
              {proposal.budget 
                ? `Rs. ${proposal.budget.toLocaleString()}` 
                : proposal.outlayLakhs 
                  ? `Rs. ${proposal.outlayLakhs} Lakhs` 
                  : 'N/A'
              }
            </div>
          </div>
          
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-orange-50/50 border-orange-100'} rounded-lg p-4 border`}>
            <div className={`flex items-center gap-2 ${subTextClass} text-sm font-semibold mb-1`}>
              <Calendar size={14} />
              Submitted Date
            </div>
            <div className={`${textClass} font-bold text-lg`}>
              {proposal.submittedDate 
                ? new Date(proposal.submittedDate).toLocaleDateString() 
                : proposal.createdAt 
                  ? new Date(proposal.createdAt).toLocaleDateString()
                  : 'N/A'
              }
            </div>
          </div>
        </div>

        {/* Description */}
        {proposal.description && (
          <div>
            <h4 className={`text-lg font-bold ${textClass} mb-2`}>Project Description</h4>
            <p className={`${subTextClass} leading-relaxed`}>{proposal.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalOverview;
