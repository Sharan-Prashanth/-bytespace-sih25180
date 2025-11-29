import React from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';

const Guidelines = () => {
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
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-black mb-4">Guidelines & Templates</h2>
      <p className="text-black mb-4">
        Before starting your proposal submission, please download and review the guidelines and template documents.
      </p>
      <div className="flex gap-4">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
        >
          <FiDownload className="w-4 h-4" />
          Download Guidelines (PDF)
        </button>
        <button
          onClick={handleDownloadDOCX}
          className="flex items-center gap-2 px-4 py-2 border border-black text-black rounded-lg hover:bg-black/5 transition-colors"
        >
          <FiFileText className="w-4 h-4" />
          Download Template (DOCX)
        </button>
      </div>
    </div>
  );
};

export default Guidelines;
