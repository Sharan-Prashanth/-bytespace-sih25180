'use client';

import { useState, useEffect } from 'react';

export default function WeightageMeterSection({ theme }) {
  const [weightages, setWeightages] = useState({
    novelty: 40,
    feasibility: 20,
    cost: 10,
    aiScore: 10,
    benefitToCoal: 10,
    deliverables: 10
  });

  const [isEditing, setIsEditing] = useState(false);

  // Added distinct start/end color classes for the SVG gradients
  const criteria = [
    { key: 'novelty', label: 'Novelty', startColor: 'text-blue-500', endColor: 'text-blue-700', bgColor: 'bg-blue-500', bgBorder: 'border-blue-100', shadow: 'shadow-blue-100' },
    { key: 'feasibility', label: 'Feasibility', startColor: 'text-teal-500', endColor: 'text-teal-700', bgColor: 'bg-teal-500', bgBorder: 'border-teal-100', shadow: 'shadow-teal-100' },
    { key: 'cost', label: 'Cost', startColor: 'text-yellow-500', endColor: 'text-yellow-700', bgColor: 'bg-yellow-500', bgBorder: 'border-yellow-100', shadow: 'shadow-yellow-100' },
    { key: 'aiScore', label: 'AI Score', startColor: 'text-cyan-500', endColor: 'text-cyan-700', bgColor: 'bg-cyan-500', bgBorder: 'border-cyan-100', shadow: 'shadow-cyan-100' },
    { key: 'benefitToCoal', label: 'Benefit to Coal', startColor: 'text-purple-500', endColor: 'text-purple-700', bgColor: 'bg-purple-500', bgBorder: 'border-purple-100', shadow: 'shadow-purple-100' },
    { key: 'deliverables', label: 'Deliverables', startColor: 'text-pink-500', endColor: 'text-pink-700', bgColor: 'bg-pink-500', bgBorder: 'border-pink-100', shadow: 'shadow-pink-100' }
  ];

  const totalWeight = Object.values(weightages).reduce((sum, val) => sum + val, 0);

  const handleWeightChange = (key, value) => {
    // Allow empty string for clearing the input
    if (value === '' || value === null || value === undefined) {
      setWeightages(prev => ({
        ...prev,
        [key]: 0
      }));
      return;
    }
    
    let numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;
    
    setWeightages(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleSave = async () => {
    // Prevent saving if total is not exactly 100
    if (totalWeight !== 100) {
      console.warn('Cannot save: Total weight must equal 100%');
      return;
    }
    
    console.log('Saving weightages:', weightages);
    setIsEditing(false);
  };

  const handleReset = () => {
    setWeightages({
      novelty: 20,
      feasibility: 20,
      cost: 15,
      aiScore: 15,
      benefitToCoal: 20,
      deliverables: 10
    });
  };

  const getGradeFromTotal = (total) => {
    if (total === 100) return { grade: 'Perfect', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    if (total > 100) return { grade: 'Over Limit', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    return { grade: 'Under Limit', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
  };

  const gradeInfo = getGradeFromTotal(totalWeight);

  // Circular Progress Component Helper
  const CircularProgress = ({ value, size = 160, strokeWidth = 12, criterion, isEditing, onChange }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const uniqueId = `gradient-${criterion.key}`;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* SVG Ring */}
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={criterion.startColor} stopColor="currentColor" />
              <stop offset="100%" className={criterion.endColor} stopColor="currentColor" />
            </linearGradient>
          </defs>
          
          {/* Background Circle (Track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className={`${theme === 'dark' || theme === 'darkest' ? 'text-gray-700' : 'text-gray-100'}`}
          />
          
          {/* Progress Circle (Indicator) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${uniqueId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Text / Input */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-1">
             {isEditing ? (
                <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      onChange(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const newVal = Math.min(100, value + 1);
                        onChange(newVal.toString());
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const newVal = Math.max(0, value - 1);
                        onChange(newVal.toString());
                      }
                    }}
                    className={`w-20 text-center text-3xl font-black bg-transparent border-b-2 outline-none focus:border-blue-500 transition-colors ${
                        theme === 'dark' || theme === 'darkest' ? 'text-white border-gray-600' : 'text-gray-800 border-gray-300'
                    }`}
                    placeholder="0"
                />
             ) : (
                <span className={`text-4xl font-black ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-gray-800'}`}>
                    {value}
                </span>
             )}
            <span className={`text-lg font-bold ${theme === 'dark' || theme === 'darkest' ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : theme === 'darkest' ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-gray-900'}`}>
                Weightage Configuration
              </h1>
              <p className={`text-sm mt-2 ${theme === 'dark' || theme === 'darkest' ? 'text-gray-400' : 'text-gray-600'}`}>
                Adjust the circular metrics to distribute scoring logic.
              </p>
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={totalWeight !== 100}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all shadow-lg ${
                      totalWeight === 100
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30'
                        : 'bg-gray-600 cursor-not-allowed text-gray-400 opacity-50'
                    }`}
                  >
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30"
                  >
                    Edit Weights
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/30"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Total Weight Status Bar */}
          <div className={`p-6 rounded-xl ${gradeInfo.bg} transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-5xl font-black ${gradeInfo.color}`}>{totalWeight}%</span>
                <div>
                    <h3 className={`font-bold text-xl ${gradeInfo.color}`}>Total Allocation</h3>
                    <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' || theme === 'darkest' ? 'text-gray-400' : 'text-gray-500'}`}>
                      MUST EQUAL EXACTLY 100%
                    </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider border-2 ${gradeInfo.color} border-current ${gradeInfo.bg}`}>
                  {gradeInfo.grade}
                </span>
                {totalWeight !== 100 && (
                  <span className={`text-sm font-semibold ${gradeInfo.color}`}>
                    {totalWeight < 100 ? `Add ${100 - totalWeight}% more` : `Remove ${totalWeight - 100}%`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Circular Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {criteria.map((criterion) => (
            <div
              key={criterion.key}
              className={`relative rounded-2xl p-6 transition-all duration-300 group ${
                theme === 'dark' ? 'bg-gray-800' : theme === 'darkest' ? 'bg-gray-900' : 'bg-white'
              } ${isEditing ? 'ring-2 ring-offset-2 ring-blue-500/30 cursor-pointer' : 'shadow-xl hover:shadow-2xl'}`}
            >
              {/* Card Header */}
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-1 ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-gray-800'}`}>
                    {criterion.label}
                </h3>
              </div>

              {/* Circular Metric */}
              <div className="flex flex-col items-center justify-center">
                 <CircularProgress 
                    value={weightages[criterion.key]} 
                    criterion={criterion}
                    theme={theme}
                    isEditing={isEditing}
                    onChange={(val) => handleWeightChange(criterion.key, val)}
                 />
              </div>

              {/* Slider (Only visible when editing) */}
              <div className={`mt-6 transition-all duration-300 overflow-hidden ${isEditing ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                 <input
                    type="range"
                    min="0"
                    max="100"
                    value={weightages[criterion.key]}
                    onChange={(e) => handleWeightChange(criterion.key, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
                 <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                 </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend / Info */}
        <div className={`p-8 rounded-2xl ${theme === 'dark' || theme === 'darkest' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
             <h3 className={`font-bold text-lg mb-6 ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-gray-900'}`}>
                Configuration Guide
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {criteria.map(c => (
                    <div key={c.key} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${c.bgColor}`}></div>
                        <span className={`text-base font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-gray-200' : 'text-gray-700'}`}>{c.label}</span>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
}