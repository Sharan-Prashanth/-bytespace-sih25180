'use client';

import { useState } from 'react';

export default function TimelineChart({ timeline, milestones, currentPhase }) {
  const [activeTimelineItem, setActiveTimelineItem] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-400"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'active':
        return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'pending':
        return 'text-gray-500 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-500 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Timeline Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-xl font-bold text-black mb-6 flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          Review Timeline
        </h3>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-orange-500 to-gray-300"></div>
          
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div
                key={index}
                className={`relative pl-16 pb-4 cursor-pointer transition-all duration-300 hover:bg-orange-50 rounded-lg p-3 -ml-3 ${
                  activeTimelineItem === index ? 'bg-orange-50 shadow-md' : ''
                }`}
                onClick={() => setActiveTimelineItem(activeTimelineItem === index ? null : index)}
              >
                {/* Timeline Icon */}
                <div className="absolute left-4 top-4 transform -translate-x-1/2">
                  {getStatusIcon(item.status)}
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-black text-lg">{item.phase}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </span>
                      {item.status === 'active' && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full animate-pulse">
                          CURRENT
                        </div>
                      )}
                    </div>
                    
                    {item.date && (
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-orange-700 font-medium">{item.date}</span>
                      </div>
                    )}
                    
                    <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                  </div>
                  
                  <button className="ml-4 text-orange-600 hover:text-orange-800">
                    <svg className={`w-5 h-5 transform transition-transform ${activeTimelineItem === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Expanded Content */}
                {activeTimelineItem === index && (
                  <div className="mt-4 pt-4 border-t border-orange-200 animate-slideInUp">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="text-orange-600 text-sm font-semibold mb-1">Phase Details</div>
                        <div className="text-black text-sm">
                          This phase involves comprehensive evaluation of the proposal components and alignment with research objectives.
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-blue-600 text-sm font-semibold mb-1">Expected Duration</div>
                        <div className="text-black text-sm">
                          Typically takes 3-5 business days depending on complexity and reviewer availability.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 animate-slideInUp" style={{ animationDelay: '0.6s' }}>
        <h3 className="text-xl font-bold text-black mb-6 flex items-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          Key Milestones
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-300 hover:shadow-md ${
                milestone.completed 
                  ? 'bg-green-50 border-green-500 hover:bg-green-100' 
                  : 'bg-gray-50 border-gray-400 hover:bg-gray-100'
              } ${activeMilestone === index ? 'shadow-lg' : ''}`}
              onClick={() => setActiveMilestone(activeMilestone === index ? null : index)}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                  milestone.completed ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {milestone.completed ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-black text-sm mb-1">{milestone.title}</h4>
                  <div className="text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Due: {milestone.dueDate}
                    </div>
                    {milestone.completedDate && (
                      <div className="flex items-center gap-1 text-green-600 mt-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed: {milestone.completedDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {activeMilestone === index && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-slideInUp">
                  <div className="text-xs text-gray-500">
                    {milestone.completed 
                      ? "This milestone has been successfully completed and verified by the AI system and review committee."
                      : "This milestone is pending completion and is part of the ongoing AI-assisted evaluation process."
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
