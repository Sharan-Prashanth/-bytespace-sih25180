import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const PreSubmissionInfo = ({ theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-300';

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <div className="flex items-start gap-3 mb-4">
        <FiAlertCircle className={`w-5 h-5 ${textColor} mt-0.5 flex-shrink-0`} />
        <div>
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
            Please read the following before proceeding to fill the details.
          </h3>
          <p className={`${textColor} mb-2`}>
            It is also requested to include the following in the project proposal in addition to the specified items in Form I along with Form IA, IX, X, XI & XII as per S&T guidelines for implementing coal research projects.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full border-collapse border ${borderColor}`}>
          <tbody>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top w-1/2`}>
                a) Brief details of the organization / institution
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top w-1/2`}>
                e) How the project could be beneficial to the coal industry
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                b) Details of Infrastructural resources available including R&D set up
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                f) Detailed web survey report for the specific research area
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                c) Details of expertise available, past experience and performance in the proposed field by the organization / institution concerned
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                g) Specific research or development content which is exclusive to the proposal shall be clearly indicated
              </td>
            </tr>
            <tr>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                d) R&D component under the proposed study
              </td>
              <td className={`border ${borderColor} p-3 ${textColor} align-top`}>
                h) Brief details of proposed collaboration / tie-up with other agencies, if applicable
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreSubmissionInfo;
