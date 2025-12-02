'use client';

import React, { useState } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Eye, 
  Download, 
  ChevronDown,
  Upload,
  Bot,
  UserCheck
} from 'lucide-react';

const SupportingDocuments = ({ 
  userDocuments = [], 
  aiReports = [], 
  reviewerReports = [] 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('user');

  const getDocumentTypeStyles = (type) => {
    switch (type) {
      case 'proposal':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'technical':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'financial':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'research':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'ai':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'reviewer':
        return 'bg-teal-100 text-teal-600 border-teal-200';
      default:
        return 'bg-black/5 text-black border-black/10';
    }
  };

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

  // Mock data if none provided
  const displayUserDocs = userDocuments.length > 0 ? userDocuments : [
    { name: 'Form I - Proposal Document', type: 'proposal', fileSize: 2457600, uploadedAt: '2024-01-15', fileUrl: '#' },
    { name: 'Technical Specifications', type: 'technical', fileSize: 1887436, uploadedAt: '2024-01-15', fileUrl: '#' },
    { name: 'Budget Breakdown', type: 'financial', fileSize: 876544, uploadedAt: '2024-01-15', fileUrl: '#' },
  ];

  const displayAIReports = aiReports.length > 0 ? aiReports : [
    { name: 'AI Evaluation Report v1', type: 'ai', version: 1, generatedAt: '2024-01-16', reportUrl: '#' },
  ];

  const displayReviewerReports = reviewerReports.length > 0 ? reviewerReports : [];

  const tabs = [
    { id: 'user', label: 'User Uploads', icon: Upload, count: displayUserDocs.length },
    { id: 'ai', label: 'AI Reports', icon: Bot, count: displayAIReports.length },
    { id: 'reviewer', label: 'Reviewer Reports', icon: UserCheck, count: displayReviewerReports.length }
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
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* Header - Always visible, clickable to toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center mr-3">
            <FolderOpen className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-black">Supporting Documents</h2>
        </div>
        <button className="p-1 hover:bg-black/5 rounded transition-colors">
          <ChevronDown 
            className={`w-5 h-5 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4 border-b border-black/10 pb-2">
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
                      ? 'bg-black text-white' 
                      : 'bg-black/5 text-black hover:bg-black/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-black/10 text-black'
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
              <div className="text-center py-8 text-black">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No documents available in this category.</p>
              </div>
            ) : (
              activeDocuments.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-black/5 border border-black/10 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getDocumentTypeStyles(doc.type || activeTab)}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-black font-medium text-sm">
                        {doc.name || doc.title || `Report v${doc.version}`}
                      </div>
                      <div className="text-black text-xs">
                        {doc.fileSize ? formatFileSize(doc.fileSize) : ''} 
                        {doc.fileSize && (doc.uploadedAt || doc.generatedAt) ? ' - ' : ''}
                        {formatDate(doc.uploadedAt || doc.generatedAt)}
                        {doc.author?.fullName && ` by ${doc.author.fullName}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl || doc.reportUrl || doc.pdfUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-black/10 hover:bg-black/20 text-black rounded-lg text-sm transition-colors flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      View
                    </a>
                    <a
                      href={doc.fileUrl || doc.reportUrl || doc.pdfUrl || '#'}
                      download
                      className="px-3 py-2 bg-black text-white hover:bg-black/90 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportingDocuments;
