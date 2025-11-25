'use client';

import jsPDF from 'jspdf';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Chatbot from '../../../components/Saarthi';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../utils/api';

// Custom CSS animations matching other pages
const reviewAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { 
      opacity: 0;
      transform: translateY(30px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out forwards;
    animation-fill-mode: both;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.5s ease-out forwards;
  }
`;

function ReviewProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState('under_review');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDecisionConfirm, setShowDecisionConfirm] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showDecisionSuccess, setShowDecisionSuccess] = useState(false);
  const [submittedDecision, setSubmittedDecision] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showChatbot, setShowChatbot] = useState(true);

  useEffect(() => {
    const loadProposal = async () => {
      try {
        if (id) {
          console.log('📖 Loading proposal for review:', id);
          setLoading(true);

          const response = await apiClient.get(`/api/proposals/${id}`);
          const proposalData = response.data.proposal || response.data;
          setProposal(proposalData);
          setReviewStatus(proposalData.status || 'under_review');
          console.log('✅ Proposal loaded for review');
        }
      } catch (error) {
        console.error('❌ Error loading proposal for review:', error);
        alert('Failed to load proposal: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      console.log('⚠️  Feedback submission blocked: empty feedback');
      alert("Please enter feedback before submitting.");
      return;
    }

    try {
      console.log('💬 Submitting feedback for proposal:', id);

      // Call backend API to submit feedback
      const response = await apiClient.post(`/api/proposals/${id}/feedback`, {
        feedback,
        reviewStatus
      });

      // Update local state with the updated proposal
      setProposal(response.data.proposal || response.data);
      setFeedback('');
      setShowSuccessModal(true);

      console.log('✅ Feedback submitted successfully');

      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      alert("Failed to submit feedback: " + error.message);
    }
  };

  // PDF Export Function with Government Logos
  const handleExportReview = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 10;

      // Helper function to load and add image to PDF
      const addImageToPDF = (imagePath, x, y, width, height) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', x, y, width, height);
              resolve();
            } catch (error) {
              console.warn('Error adding image:', imagePath, error);
              resolve();
            }
          };
          img.onerror = () => {
            console.warn('Could not load image:', imagePath);
            resolve();
          };
          img.src = imagePath;
        });
      };

      // Official Government Logos Header
      try {
        await addImageToPDF('/images/GOI logo.png', 15, yPosition, 25, 15);
        await addImageToPDF('/images/coal india logo.webp', 45, yPosition, 25, 15);
        await addImageToPDF('/images/prism brand logo.png', 85, yPosition, 20, 15);
        await addImageToPDF('/images/cmpdi logo.jpg', 115, yPosition, 25, 15);
        await addImageToPDF('/images/AI assistant logo.png', 150, yPosition, 20, 15);
      } catch (logoError) {
        console.warn('Some logos could not be loaded:', logoError);
      }

      yPosition += 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(234, 88, 12);
      pdf.text('PRISM - Expert Review Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text('Proposal Review & Innovation Support Mechanism', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text('Department of Coal - Advanced Research Platform', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 3;
      pdf.text('Government of India', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Line separator
      pdf.setDrawColor(234, 88, 12);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // Proposal Information
      pdf.setFontSize(16);
      pdf.setTextColor(234, 88, 12);
      pdf.text('Proposal Under Review', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);

      const reviewInfo = [
        [`Proposal ID:`, proposal.id],
        [`Title:`, proposal.title],
        [`Principal Investigator:`, proposal.researcher],
        [`Institution:`, proposal.institution],
        [`Domain:`, proposal.domain],
        [`Budget:`, `₹${proposal.budget.toLocaleString()}`],
        [`Current Status:`, reviewStatus.replace('_', ' ').toUpperCase()],
        [`Review Phase:`, proposal.currentPhase],
        [`Submitted Date:`, proposal.submittedDate],
        [`Reviewer:`, user?.name || 'Expert Reviewer']
      ];

      reviewInfo.forEach(([label, value]) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(label, 20, yPosition);
        pdf.setFont(undefined, 'normal');

        const splitValue = pdf.splitTextToSize(value, pageWidth - 70);
        pdf.text(splitValue, 70, yPosition);
        yPosition += splitValue.length * 5 + 2;
      });

      yPosition += 10;

      // Expert Review Comments
      if (proposal.existingFeedback.length > 0) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setTextColor(234, 88, 12);
        pdf.text('Expert Review Comments', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        proposal.existingFeedback.forEach((feedback, index) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setTextColor(51, 51, 51);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${feedback.reviewer} (${feedback.date})`, 20, yPosition);
          yPosition += 6;

          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(107, 114, 128);
          const splitComment = pdf.splitTextToSize(feedback.comment, pageWidth - 40);
          pdf.text(splitComment, 20, yPosition);
          yPosition += splitComment.length * 4 + 8;
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`, 20, pageHeight - 10);
        pdf.text('PRISM - Department of Coal, Government of India', pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Save PDF
      const fileName = `PRISM_Review_Report_${proposal.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setReviewStatus(newStatus);
  };

  const handleSubmitDecision = async () => {
    // First show confirmation modal
    setShowDecisionConfirm(true);
  };

  const handleConfirmDecision = () => {
    // After confirmation, show commit modal
    setShowDecisionConfirm(false);
    setCommitMessage(`Review decision: ${reviewStatus.replace('_', ' ').toUpperCase()}`);
    setShowCommitModal(true);
  };

  const handleCommitDecision = async () => {
    if (!commitMessage.trim()) {
      alert("Please enter a commit message.");
      return;
    }

    setCommitting(true);

    try {
      // API call to submit decision (real implementation would go here)
      console.log("Submitting decision:", { proposalId: id, reviewStatus, commitMessage });

      // Mock decision submission
      setProposal(prev => ({
        ...prev,
        status: reviewStatus
      }));

      setShowCommitModal(false);
      setCommitting(false);

      // Show success popup
      setSubmittedDecision(reviewStatus);
      setShowDecisionSuccess(true);

      // Auto-hide success modal after 4 seconds
      setTimeout(() => {
        setShowDecisionSuccess(false);
      }, 4000);

    } catch (error) {
      console.error("Error submitting decision:", error);
      alert("Failed to submit decision. Please try again.");
      setCommitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-black text-xl mt-4">Loading proposal for review...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl">Proposal not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{reviewAnimationStyles}</style>
      <div className="min-h-screen bg-white">
        {/* Header Section - Matching other pages */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[280px]" style={{ overflow: 'visible' }}>
          {/* Animated geometric patterns */}
          <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
            <div className="absolute top-6 left-10 w-12 h-12 border border-blue-400/30 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-10 h-10 border border-indigo-400/20 rounded-lg rotate-45 animate-spin-slow"></div>
            <div className="absolute bottom-12 left-32 w-8 h-8 bg-blue-500/10 rounded-full animate-bounce"></div>
            <div className="absolute top-12 right-40 w-4 h-4 bg-indigo-400/20 rounded-full animate-ping"></div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>

          {/* Header Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-10" style={{ overflow: 'visible' }}>
            <div className="group animate-fadeIn">
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-500 group-hover:scale-110">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>

                <div className="ml-6">
                  <div className="flex items-center mb-2">
                    <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-slideInUp">
                      Review Proposal
                    </h1>
                  </div>
                  <div className="flex items-center space-x-3 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                      <span className="text-blue-100 font-semibold text-lg">Expert Review Portal</span>
                    </div>
                    <div className="h-4 w-px bg-blue-300/50"></div>
                    <span className="text-blue-200 font-medium text-sm">Proposal Assessment System</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blue-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                    <span>Proposal ID: {proposal.id}</span>
                    <span>•</span>
                    <span>Reviewer: {user?.name || 'Expert Reviewer'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      {proposal.currentPhase}
                    </span>
                  </div>
                </div>
              </div>

              {/* PRISM Banner */}
              <div className="bg-orange-600 backdrop-blur-md rounded-2xl p-4 border border-orange-300/40 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-white to-orange-50 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border border-orange-200/50">
                        <img
                          src="/images/prism brand logo.png"
                          alt="PRISM Logo"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-xl mb-1 flex items-center">
                        <span className="text-white drop-shadow-md tracking-wide">PRISM</span>
                        <div className="ml-3 px-2 py-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full flex items-center justify-center border border-blue-300/40 backdrop-blur-sm">
                          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-white text-xs font-semibold drop-shadow-sm">REVIEW</span>
                        </div>
                      </h2>
                      <p className="text-orange-50 text-sm leading-relaxed font-medium opacity-95 drop-shadow-sm">
                        Proposal Review & Innovation Support Mechanism for Department of Coal's Advanced Research Platform
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Navigation and Export Buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border border-green-300 transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105 animate-fadeIn cursor-pointer"
            >
              <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              Back to Dashboard
            </button>

            <button
              onClick={handleExportReview}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border border-blue-300 transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105 animate-fadeIn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center">
                {isExporting ? (
                  <svg className="w-3 h-3 text-blue-700 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              {isExporting ? 'Generating...' : 'Export Review Report'}
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - Left 2 columns */}
            <div className="lg:col-span-2 space-y-6">

              {/* Proposal Overview */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Proposal Overview
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{proposal.title}</h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="text-orange-600 text-sm font-semibold mb-1">Principal Investigator</div>
                        <div className="text-black font-semibold text-sm">{proposal.researcher}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-blue-600 text-sm font-semibold mb-1">Institution</div>
                        <div className="text-black font-semibold text-sm">{proposal.institution}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-green-600 text-sm font-semibold mb-1">Domain</div>
                        <div className="text-black font-semibold text-sm">{proposal.domain}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-500 text-sm font-semibold mb-1">Budget</div>
                      <div className="text-black font-bold text-lg">₹{proposal.budget.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-500 text-sm font-semibold mb-1">Submitted Date</div>
                      <div className="text-black font-bold text-lg">{new Date(proposal.submittedDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Project Description</h4>
                    <p className="text-gray-500 leading-relaxed">{proposal.description}</p>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Supporting Documents
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {proposal.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.type === 'proposal' ? 'bg-orange-100 text-orange-600' :
                            doc.type === 'technical' ? 'bg-blue-100 text-blue-600' :
                              doc.type === 'financial' ? 'bg-green-100 text-green-600' :
                                doc.type === 'research' ? 'bg-purple-100 text-purple-600' :
                                  'bg-gray-100 text-gray-600'
                          }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-black font-medium text-sm">{doc.name}</div>
                          <div className="text-gray-500 text-xs">{doc.size} • {doc.uploadDate}</div>
                        </div>
                      </div>
                      <button className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review History */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 animate-slideInUp" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  Review History
                </h3>

                <div className="space-y-4">
                  {proposal.existingFeedback.map((feedback) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-sm font-bold">
                            {feedback.reviewer.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-black">{feedback.reviewer}</div>
                            <div className="text-xs text-gray-500">{feedback.date}</div>
                          </div>
                          <p className="text-gray-500 text-sm leading-relaxed">{feedback.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review Panel - Right column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">

                {/* Review Decision */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 animate-slideInUp" style={{ animationDelay: '0.8s' }}>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    Review Decision
                  </h3>

                  <div className="space-y-3">
                    {[
                      { value: 'approved', label: 'Approve', color: 'green' },
                      { value: 'needs_revision', label: 'Needs Revision', color: 'yellow' },
                      { value: 'rejected', label: 'Reject', color: 'red' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value={option.value}
                          checked={reviewStatus === option.value}
                          onChange={(e) => setReviewStatus(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${reviewStatus === option.value
                            ? `border-${option.color}-500 bg-${option.color}-500`
                            : 'border-gray-300'
                          }`}>
                          {reviewStatus === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className={`font-medium ${reviewStatus === option.value ? 'text-black' : 'text-gray-500'
                          }`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {reviewStatus !== 'under_review' && (
                    <button
                      onClick={handleSubmitDecision}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                    >
                      Submit Decision
                    </button>
                  )}
                </div>

                {/* Feedback Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '1.0s' }}>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    Review Comments
                  </h3>

                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter your detailed review comments, suggestions, and recommendations here..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-500"
                  />

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                  >
                    Submit Review
                  </button>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Review Submitted Successfully!</h3>
                <p className="text-gray-500 mb-6">Your expert review has been recorded and will be processed by the PRISM system.</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Decision Confirmation Modal */}
        {showDecisionConfirm && createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Confirm Review Decision</h3>
                <p className="text-gray-500 mb-2">Are you sure you want to submit this decision?</p>
                <p className="text-black font-semibold mb-6">
                  Decision: {reviewStatus.replace('_', ' ').toUpperCase()}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDecisionConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDecision}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Commit Modal */}
        {showCommitModal && createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl">
              {committing ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Submitting Decision...</h3>
                  <p className="text-gray-500">Processing your review decision</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Add Commit Message</h3>
                  <p className="text-gray-500 mb-6">Describe your review decision for tracking purposes</p>

                  <div className="mb-6">
                    <textarea
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Enter commit message..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black resize-none"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCommitModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCommitDecision}
                      disabled={!commitMessage.trim()}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Submit Decision
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Decision Success Modal */}
        {showDecisionSuccess && createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 animate-scaleIn shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Decision Submitted Successfully!</h3>
                <div className="mb-4">
                  <p className="text-gray-500 mb-2">Your review decision has been recorded:</p>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${submittedDecision === 'approved' ? 'bg-green-100 text-green-800' :
                      submittedDecision === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {submittedDecision === 'approved' && (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {submittedDecision === 'needs_revision' && (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {submittedDecision === 'rejected' && (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {submittedDecision.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <p className="text-gray-500 mb-6">The proposal status has been updated and all stakeholders have been notified through the PRISM system.</p>
                <button
                  onClick={() => setShowDecisionSuccess(false)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                >
                  Continue Review
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* AI Chatbot - Always visible */}
        <div className="fixed bottom-6 right-6 z-40">
          <Chatbot
            context="reviewer"
            proposalData={proposal}
          />
        </div>
      </div>
    </>
  );
}

export default function ReviewProposal() {
  return (
    <ProtectedRoute>
      <ReviewProposalContent />
    </ProtectedRoute>
  );
}