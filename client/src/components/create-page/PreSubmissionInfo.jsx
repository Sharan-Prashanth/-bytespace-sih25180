import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const PreSubmissionInfo = ({ theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-300';
  const stageBadge = isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-black/5 text-black border border-black/10';

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <div className="flex items-start gap-3 mb-4">
        <FiAlertCircle className={`w-5 h-5 ${textColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
            Please read the following before proceeding to fill the details.
          </h3>
          <p className={`${textColor} mb-4`}>
            It is also requested to include the following in the project proposal in addition to the specified items in Form I along with Form IA, IX, X, XI & XII as per S&T guidelines for implementing coal research projects.
          </p>
          <p className={`${textColor} text-sm mb-3`}>
            The proposal submission is divided into 5 stages. Each document will be requested at the appropriate stage:
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full border-collapse border ${borderColor}`}>
          <tbody>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top w-1/2`}>
                <div className="flex items-start justify-between gap-2">
                  <span>a) Brief details of the organization / institution</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top w-1/2`}>
                <div className="flex items-start justify-between gap-2">
                  <span>e) How the project could be beneficial to the coal industry</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>b) Details of Infrastructural resources available including R&D set up</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>f) Detailed web survey report for the specific research area</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>c) Details of expertise available, past experience and performance in the proposed field by the organization / institution concerned</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>g) Specific research or development content which is exclusive to the proposal shall be clearly indicated</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>d) R&D component under the proposed study</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span>h) Brief details of proposed collaboration / tie-up with other agencies, if applicable</span>
                  <span className={`${stageBadge} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}>Stage 5</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
        <p className={`${textColor} text-sm`}>
          <span className="font-semibold">Note:</span> Form I is required at Stage 3, Form IA, IX, X, XI & XII at Stage 4, and the supporting documents (a-h) at Stage 5.
        </p>
      </div>
    </div>
  );
};

export default PreSubmissionInfo;
