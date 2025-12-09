'use client';

import React, { useState } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Eye, 
  Download, 
  ChevronDown,
  Upload,
  Cpu,
  ClipboardCheck,
  X
} from 'lucide-react';

const SupportingDocuments = ({ 
  userDocuments = [], 
  aiReports = [], 
  reviewerReports = [],
  proposalId = null,
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('user');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const iconBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const activeBtnBg = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const inactiveBtnBg = isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10';
  const docItemBg = isDarkest ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-black/5 border-black/10 hover:bg-black/10';
  const viewBtnBg = isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black';
  const docIconBg = isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10';

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFormName = (formName) => {
    if (!formName) return '';
    const formNameMap = {
      'coveringLetter': 'Covering Letter',
      'cv': 'CV / Resume',
      'formIPdf': 'Form I (PDF Upload)',
      'formia': 'Form IA (Endorsement)',
      'formix': 'Form IX (Equipment Details)',
      'formx': 'Form X (Computer & Software)',
      'formxi': 'Form XI (Manpower Cost)',
      'formxii': 'Form XII (Travel Expenditure)',
      'orgDetails': 'Organization Details',
      'infrastructure': 'Infrastructure Resources',
      'expertise': 'Expertise & Experience',
      'rdComponent': 'R&D Component',
      'benefits': 'Benefits to Coal Industry',
      'webSurvey': 'Web Survey Report',
      'researchContent': 'Research Content',
      'collaboration': 'Collaboration Details'
    };
    return formNameMap[formName] || formName;
  };

  const handleViewPdf = (url, title, isAIReport = false, proposalId = null) => {
    // If it's an AI report, route to the ai-evaluation page
    if (isAIReport && proposalId) {
      window.open(`/proposal/ai-evaluation/${proposalId}`, '_blank');
      return;
    }
    
    // For regular PDFs, open in modal
    setCurrentPdfUrl(url);
    setCurrentPdfTitle(title);
    setPdfViewerOpen(true);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdfUrl('');
    setCurrentPdfTitle('');
  };

  // Mock data if none provided
  const displayUserDocs = userDocuments.length > 0 ? userDocuments : [
    { name: 'Form I - Proposal Document', type: 'proposal', fileSize: 2457600, uploadedAt: '2024-01-15', fileUrl: '#' },
    { name: 'Technical Specifications', type: 'technical', fileSize: 1887436, uploadedAt: '2024-01-15', fileUrl: '#' },
    { name: 'Budget Breakdown', type: 'financial', fileSize: 876544, uploadedAt: '2024-01-15', fileUrl: '#' },
  ];

  // Always show the AI report entry (it will fetch the latest from backend)
  const displayAIReports = [
    { 
      name: 'AI Comprehensive Analysis Report', 
      title: 'AI Comprehensive Analysis Report',
      type: 'ai', 
      version: 1, 
      generatedAt: new Date().toISOString(),
      status: 'AVAILABLE',
      reportUrl: '#' // Will be replaced by HTML rendering
    },
    ...aiReports
  ];

  const displayReviewerReports = reviewerReports.length > 0 ? reviewerReports : [];

  const tabs = [
    { id: 'user', label: 'User Uploads', icon: Upload, count: displayUserDocs.length },
    { id: 'ai', label: 'AI Reports', icon: Cpu, count: displayAIReports.length },
    { id: 'reviewer', label: 'Reviewer Reports', icon: ClipboardCheck, count: displayReviewerReports.length }
  ];

  const getActiveDocuments = () => {
    switch (activeTab) {
      case 'ai':
        return displayAIReports;
      case 'reviewer':
        return displayReviewerReports;
      default:
        return displayUserDocs;
    }
  };

  const activeDocuments = getActiveDocuments();

  return (
    <div className={`${cardBg} border rounded-lg p-6 mb-6`}>
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
            <FolderOpen className={`w-5 h-5 ${textColor}`} />
          </div>
          <h2 className={`text-xl font-semibold ${textColor}`}>Supporting Documents</h2>
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
          {/* Tabs */}
          <div className={`flex items-center gap-2 mb-4 border-b ${borderColor} pb-2`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id 
                      ? activeBtnBg 
                      : inactiveBtnBg
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${activeTab === tab.id 
                      ? 'bg-white/20 text-inherit' 
                      : isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {activeDocuments.length === 0 ? (
              <div className={`text-center py-8 ${textColor}`}>
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No documents available in this category.</p>
              </div>
            ) : (
              activeDocuments.map((doc, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 ${docItemBg} border rounded-lg transition-colors`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${docIconBg} flex-shrink-0`}>
                      <FileText className={`w-5 h-5 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`${textColor} font-medium text-sm truncate`}>
                        {/* For user documents: show form name and file name */}
                        {activeTab === 'user' && doc.formName ? (
                          <span>
                            <span className="font-semibold">{formatFormName(doc.formName)}</span>
                            {doc.fileName && (
                              <span className="font-normal text-xs ml-1">({doc.fileName})</span>
                            )}
                          </span>
                        ) : (
                          /* For reports: show title or name */
                          doc.title || doc.name || `Report v${doc.version}`
                        )}
                      </div>
                      <div className={`${textColor} text-xs opacity-70 space-y-0.5`}>
                        {/* Primary line: Size and Date */}
                        <div>
                          {doc.fileSize ? formatFileSize(doc.fileSize) : ''} 
                          {doc.fileSize && (doc.uploadedAt || doc.generatedAt || doc.createdAt) ? ' - ' : ''}
                          {formatDate(doc.uploadedAt || doc.generatedAt || doc.createdAt)}
                        </div>
                        
                        {/* For AI reports: Show report type and status */}
                        {activeTab === 'ai' && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">AI Generated Report</span>
                            {doc.status && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                doc.status === 'SUBMITTED' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}>
                                {doc.status}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* For reviewer reports: Show author and role */}
                        {activeTab === 'reviewer' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {doc.createdBy?.fullName && (
                              <span className="font-medium">Submitted by: {doc.createdBy.fullName}</span>
                            )}
                            {doc.reportType && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {doc.reportType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewPdf(
                        doc.fileUrl || doc.reportUrl || doc.pdfUrl || '#',
                        activeTab === 'user' && doc.formName 
                          ? `${formatFormName(doc.formName)} - ${doc.fileName || 'Document'}` 
                          : doc.title || doc.name || `Report v${doc.version}`,
                        activeTab === 'ai', // isAIReport
                        proposalId // proposalId
                      )}
                      className={`px-3 py-2 ${viewBtnBg} rounded-lg text-sm transition-colors flex items-center gap-1.5`}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    {activeTab !== 'ai' && (
                      <a
                        href={doc.fileUrl || doc.reportUrl || doc.pdfUrl || '#'}
                        download={doc.fileName || doc.title || 'document.pdf'}
                        className={`px-3 py-2 ${activeBtnBg} rounded-lg text-sm transition-colors flex items-center gap-1.5`}
                      >
                        <Download size={14} />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`${cardBg} rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border ${borderColor}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
              <h3 className={`text-lg font-semibold ${textColor} truncate mr-4`}>
                {currentPdfTitle}
              </h3>
              <button
                onClick={closePdfViewer}
                className={`p-2 ${hoverBg} rounded-lg transition-colors flex-shrink-0`}
              >
                <X className={`w-5 h-5 ${textColor}`} />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={currentPdfUrl}
                className="w-full h-full"
                title={currentPdfTitle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportingDocuments;
