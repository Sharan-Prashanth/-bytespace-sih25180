import { useState } from 'react';

export default function ProposalInfo({ proposal }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 p-6 animate-slideInUp">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 text-left group"
      >
        <h2 className="text-lg font-bold text-black">Proposal Information</h2>
        <svg 
          className={`w-5 h-5 text-black transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <div className="text-xs font-semibold text-black mb-1">Funding Scheme</div>
            <div className="text-sm text-black">{proposal.fundingScheme}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black mb-1">Funding Agencies</div>
            <div className="flex flex-wrap gap-2">
              {proposal.fundingAgencies?.map((agency, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
                >
                  {agency}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black mb-1">Requested Budget</div>
            <div className="text-sm font-bold text-black">
              ₹ {proposal.requestedBudget?.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black mb-1">Duration</div>
            <div className="text-sm text-black">{proposal.duration} months</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black mb-1">Submitted On</div>
            <div className="text-sm text-black">
              {new Date(proposal.submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>

          {proposal.department && (
            <div>
              <div className="text-xs font-semibold text-black mb-1">Department</div>
              <div className="text-sm text-black">{proposal.department}</div>
            </div>
          )}

          {proposal.institution && (
            <div>
              <div className="text-xs font-semibold text-black mb-1">Institution</div>
              <div className="text-sm text-black">{proposal.institution}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
