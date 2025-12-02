import React from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';

const Guidelines = ({ theme = 'light' }) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedText = isDark ? 'text-slate-400' : 'text-black';

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/files/S&T-Guidelines-MoC.pdf';
    link.download = 'S&T-Guidelines-MoC.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDOCX = () => {
    const link = document.createElement('a');
    link.href = '/files/proposal-template.docx';
    link.download = 'proposal-template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
      <h2 className={`text-xl font-semibold ${textColor} mb-4`}>Guidelines & Templates</h2>
      <p className={`${mutedText} mb-4`}>
        Before starting your proposal submission, please download and review the guidelines and template documents.
      </p>
      <div className="flex gap-4">
        <button
          onClick={handleDownloadPDF}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
        >
          <FiDownload className="w-4 h-4" />
          Download Guidelines (PDF)
        </button>
        <button
          onClick={handleDownloadDOCX}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-slate-600 text-white hover:bg-white/5' : 'border-black text-black hover:bg-black/5'}`}
        >
          <FiFileText className="w-4 h-4" />
          Download Template (DOCX)
        </button>
      </div>
    </div>
  );
};

export default Guidelines;
