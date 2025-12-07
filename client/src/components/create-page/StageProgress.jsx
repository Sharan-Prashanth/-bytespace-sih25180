import React from 'react';
import { FiCheck } from 'react-icons/fi';

const StageProgress = ({ currentStage, completedStages, theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const stages = [
    { id: 1, name: 'Proposal Information' },
    { id: 2, name: 'Initial Documents' },
    { id: 3, name: 'Form I' },
    { id: 4, name: 'Additional Forms' },
    { id: 5, name: 'Supporting Documents' }
  ];

  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const activeBg = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const completedBg = isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black';
  const inactiveBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-300';
  const lineCompleted = isDark ? 'bg-white/30' : 'bg-black/20';
  const lineIncomplete = isDarkest ? 'bg-neutral-700' : isDark ? 'bg-slate-700' : 'bg-slate-200';

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <h3 className={`text-lg font-semibold ${textColor} mb-6`}>Progress</h3>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  stage.id === currentStage
                    ? activeBg
                    : completedStages.includes(stage.id)
                    ? completedBg
                    : `${inactiveBg} border ${mutedText}`
                }`}
              >
                {completedStages.includes(stage.id) ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  stage.id
                )}
              </div>
              <span
                className={`mt-2 text-xs text-center ${
                  stage.id === currentStage ? textColor + ' font-semibold' : mutedText
                }`}
              >
                {stage.name}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-30px]">
                <div
                  className={`h-full ${
                    completedStages.includes(stage.id) ? lineCompleted : lineIncomplete
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StageProgress;
