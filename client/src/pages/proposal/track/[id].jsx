'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import apiClient from '../../../utils/api';
import { getProposalTracking } from '../../../utils/proposalApi';
import UserDashboardLayout from '../../../components/Dashboard/User/Layout/UserDashboardLayout';

// Custom CSS animations for the track page
const trackAnimationStyles = `
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
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
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
  
  .animate-pulse-gentle {
    animation: pulse 2s infinite;
  }
`;

function TrackProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [theme, setTheme] = useState('darkest');
  const [showProgressSuggestion, setShowProgressSuggestion] = useState(true);
  const [showFeedbackSuggestion, setShowFeedbackSuggestion] = useState(true);

  const detailsContainerRef = useRef(null);

  const handleSectionClick = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      setTimeout(() => {
        detailsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'darkest' : 'light');
  };

  // Mock data for coal R&D proposal tracking
  const [proposal] = useState({
    id: id || "COAL-2024-001",
    title: "Advanced Coal Gasification Technology for Clean Energy Production",
    researcher: "Dr. Rajesh Kumar",
    institution: "Indian Institute of Technology (Indian School of Mines), Dhanbad",
    description: "Development of advanced coal gasification technology to improve energy efficiency and reduce environmental impact in coal-based power generation.",
    domain: "Coal Technology & Clean Energy",
    budget: 2500000,
    status: "under_review",
    submittedDate: "2025-09-15",
    currentPhase: "Technical Review",
    progress: 65,
    timeline: [
      { phase: "Initial Submission", status: "completed", date: "Sep 15, 2025", description: "Proposal successfully submitted through PRISM portal with all required documentation and initial AI validation completed." },
      { phase: "AI-Powered Document Analysis", status: "completed", date: "Sep 16, 2025", description: "Advanced AI systems analyzed proposal structure, content quality, and compliance with NaCCER guidelines using natural language processing." },
      { phase: "Technical Feasibility Review", status: "completed", date: "Sep 18, 2025", description: "Expert committee evaluated technical approach, methodology, and potential impact on coal industry research objectives." },
      { phase: "Budget & Resource Assessment", status: "completed", date: "Sep 22, 2025", description: "Financial analysis completed with AI-assisted cost validation and resource allocation optimization recommendations." },
      { phase: "Novelty & Innovation Check", status: "active", date: "Ongoing", description: "AI-powered plagiarism detection and innovation assessment comparing against existing research databases and patent repositories." },
      { phase: "Expert Panel Review", status: "pending", date: "Expected: Oct 5, 2025", description: "Domain experts from coal research institutes will provide detailed feedback and recommendations on scientific merit." },
      { phase: "Stakeholder Feedback", status: "pending", date: "Expected: Oct 10, 2025", description: "Industry stakeholders and coal sector representatives will review practical applicability and implementation potential." },
      { phase: "Final Decision", status: "pending", date: "Expected: Oct 15, 2025", description: "Comprehensive evaluation results compiled and final funding decision made by NaCCER review board." }
    ],
    milestones: [
      { title: "Proposal Submitted", completed: true, dueDate: "Sep 15, 2025", completedDate: "Sep 15, 2025" },
      { title: "AI Validation Passed", completed: true, dueDate: "Sep 16, 2025", completedDate: "Sep 16, 2025" },
      { title: "Document Verification", completed: true, dueDate: "Sep 17, 2025", completedDate: "Sep 17, 2025" },
      { title: "Technical Review Completed", completed: true, dueDate: "Sep 20, 2025", completedDate: "Sep 18, 2025" },
      { title: "Budget Analysis Done", completed: true, dueDate: "Sep 23, 2025", completedDate: "Sep 22, 2025" },
      { title: "Innovation Assessment", completed: false, dueDate: "Oct 1, 2025", completedDate: null },
      { title: "Plagiarism Check", completed: false, dueDate: "Oct 3, 2025", completedDate: null },
      { title: "Expert Review Scheduled", completed: false, dueDate: "Oct 5, 2025", completedDate: null },
      { title: "Industry Feedback", completed: false, dueDate: "Oct 10, 2025", completedDate: null },
      { title: "Final Approval", completed: false, dueDate: "Oct 15, 2025", completedDate: null }
    ],
    recentActivity: [
      { 
        type: "reviewer_comment", 
        actor: "Dr. Amit Sharma", 
        action: "left a technical review comment", 
        timestamp: "2025-09-25 14:30", 
        details: "Methodology for coal characterization looks comprehensive. Please clarify the safety protocols for high-temperature gasification experiments."
      },
      { 
        type: "ai_suggestion", 
        actor: "AI System", 
        action: "provided optimization suggestion", 
        timestamp: "2025-09-25 11:15", 
        details: "AI analysis suggests adding environmental impact assessment data for the proposed gasification process to strengthen the proposal."
      },
      { 
        type: "proposal_edit", 
        actor: "Dr. Rajesh Kumar", 
        action: "updated technical specifications", 
        timestamp: "2025-09-24 16:45", 
        details: "Added detailed equipment specifications and updated timeline for pilot testing phase."
      },
      { 
        type: "reviewer_assigned", 
        actor: "AI System", 
        action: "auto-assigned expert reviewer", 
        timestamp: "2025-09-24 09:20", 
        details: "AI automatically assigned Prof. Sunita Mishra (Coal Chemistry Expert) based on domain expertise matching."
      },
      { 
        type: "milestone_completed", 
        actor: "AI System", 
        action: "verified milestone completion", 
        timestamp: "2025-09-21 18:00", 
        details: "AI system verified Technical Documentation Review milestone completion successfully."
      }
    ],
    feedback: [
      { 
        reviewer: "Dr. Amit Sharma", 
        designation: "Senior Coal Technology Researcher", 
        comment: "The gasification approach is innovative and addresses key efficiency challenges in coal energy production. The preliminary data looks promising.", 
        date: "2025-09-23", 
        type: "positive",
        rating: 4.5
      },
      { 
        reviewer: "Prof. Sunita Mishra", 
        designation: "Coal Chemistry Expert", 
        comment: "Environmental impact mitigation strategies need more detailed analysis. Consider adding carbon capture integration possibilities.", 
        date: "2025-09-24", 
        type: "suggestion",
        rating: 4.0
      },
      { 
        reviewer: "Dr. Pradeep Singh", 
        designation: "Energy Systems Analyst", 
        comment: "Budget allocation for equipment procurement seems reasonable. Timeline for pilot testing phase needs clarification.", 
        date: "2025-09-25", 
        type: "neutral",
        rating: 4.2
      }
    ]
  });

  useEffect(() => {
    const loadProposalTracking = async () => {
      try {
        console.log('📊 Initializing tracking view for proposal:', id);
        setLoading(true);
        
        // Simulate API call for tracking data
        setTimeout(() => {
          console.log('✅ Tracking view loaded successfully');
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('❌ Error loading tracking view:', error);
        setLoading(false);
      }
    };

    if (id) {
      loadProposalTracking();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-black text-xl mt-4">Loading proposal tracking...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = proposal.progress;
  const completedMilestones = proposal.milestones.filter(m => m.completed).length;
  const totalMilestones = proposal.milestones.length;

  // PDF Export Function
  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Create PDF using jsPDF
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

      // Official Government Logos Header Section
      try {
        // Government of India logo (left)
        await addImageToPDF('/images/GOI logo.png', 15, yPosition, 25, 15);
        
        // Coal India logo (center-left)
        await addImageToPDF('/images/coal india logo.webp', 45, yPosition, 25, 15);
        
        // PRISM logo (center)
        await addImageToPDF('/images/prism brand logo.png', 85, yPosition, 20, 15);
        
        // CMPDI logo (center-right)
        await addImageToPDF('/images/cmpdi logo.jpg', 115, yPosition, 25, 15);
        
        // AI Assistant logo (right)
        await addImageToPDF('/images/AI assistant logo.png', 150, yPosition, 20, 15);
        
      } catch (logoError) {
        console.warn('Some logos could not be loaded:', logoError);
      }

      yPosition += 20;

      // Main Header
      pdf.setFontSize(20);
      pdf.setTextColor(234, 88, 12); // Orange color
      pdf.text('PRISM - Proposal Tracking Report', pageWidth / 2, yPosition, { align: 'center' });
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
      yPosition += 20;

      // Cover Page Information Box
      pdf.setDrawColor(234, 88, 12);
      pdf.setFillColor(255, 247, 237); // Light orange background
      pdf.roundedRect(20, yPosition, pageWidth - 40, 40, 3, 3, 'FD');
      
      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(234, 88, 12);
      pdf.setFont(undefined, 'bold');
      pdf.text('OFFICIAL GOVERNMENT DOCUMENT', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Proposal ID: ${proposal.proposalCode || proposal._id}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 5;
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('This document contains confidential information for authorized personnel only', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;

      // Add a new page for content
      pdf.addPage();
      yPosition = 20;

      // Proposal Overview Section
      pdf.setFontSize(16);
      pdf.setTextColor(234, 88, 12);
      pdf.text('Proposal Overview', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      
      // Key information in professional format
      const infoItems = [
        [`Proposal ID:`, proposal.proposalCode || proposal._id],
        [`Title:`, proposal.title],
        [`Principal Investigator:`, proposal.researcher],
        [`Institution:`, proposal.institution],
        [`Domain:`, proposal.domain],
        [`Budget:`, `₹${proposal.budget.toLocaleString()}`],
        [`Status:`, proposal.status.replace('_', ' ').toUpperCase()],
        [`Current Phase:`, proposal.currentPhase],
        [`Progress:`, `${progressPercentage}%`],
        [`Submitted Date:`, proposal.submittedDate]
      ];

      infoItems.forEach(([label, value]) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(label, 20, yPosition);
        pdf.setFont(undefined, 'normal');
        
        // Handle long text wrapping
        const splitValue = pdf.splitTextToSize(value, pageWidth - 70);
        pdf.text(splitValue, 70, yPosition);
        yPosition += splitValue.length * 5 + 2;
      });

      yPosition += 10;

      // Project Description
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Project Description:', 20, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      const splitDescription = pdf.splitTextToSize(proposal.description, pageWidth - 40);
      pdf.text(splitDescription, 20, yPosition);
      yPosition += splitDescription.length * 5 + 15;

      // Review Timeline Section
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(234, 88, 12);
      pdf.text('Review Timeline', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);

      proposal.timeline.forEach((item, index) => {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = 20;
        }

        const statusColor = item.status === 'completed' ? [16, 185, 129] : 
                           item.status === 'active' ? [234, 88, 12] : [107, 114, 128];
        
        pdf.setDrawColor(...statusColor);
        pdf.setFillColor(...statusColor);
        pdf.circle(25, yPosition - 1, 1, 'F');

        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${index + 1}. ${item.phase}`, 30, yPosition);
        
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(107, 114, 128);
        if (item.date) {
          pdf.text(`Date: ${item.date}`, 30, yPosition + 4);
        }
        
        const splitDesc = pdf.splitTextToSize(item.description, pageWidth - 50);
        pdf.text(splitDesc, 30, yPosition + 8);
        yPosition += 8 + splitDesc.length * 4 + 5;
      });

      // Key Milestones Section
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(234, 88, 12);
      pdf.text('Key Milestones', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      proposal.milestones.forEach((milestone, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        const statusColor = milestone.completed ? [16, 185, 129] : [107, 114, 128];
        pdf.setDrawColor(...statusColor);
        pdf.setFillColor(...statusColor);
        pdf.circle(25, yPosition - 1, 1, 'F');

        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${index + 1}. ${milestone.title}`, 30, yPosition);
        
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Due: ${milestone.dueDate}`, 30, yPosition + 4);
        
        if (milestone.completedDate) {
          pdf.setTextColor(16, 185, 129);
          pdf.text(`Completed: ${milestone.completedDate}`, 30, yPosition + 8);
          yPosition += 12;
        } else {
          yPosition += 8;
        }
        yPosition += 3;
      });

      // AI-Driven Review Process Note
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      // AI Section Header with logo
      pdf.setFontSize(16);
      pdf.setTextColor(234, 88, 12);
      pdf.text('AI-Driven Review Process', 30, yPosition);
      
      // Add AI Assistant logo next to the title
      try {
        await addImageToPDF('/images/AI assistant logo.png', 20, yPosition - 5, 8, 8);
      } catch (aiLogoError) {
        console.warn('AI logo could not be loaded:', aiLogoError);
      }
      
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      pdf.setFont(undefined, 'normal');
      const aiProcessText = `This proposal is being processed through PRISM's AI-driven review system. The AI automatically assigns expert reviewers based on domain expertise, manages workflow transitions, and provides intelligent recommendations. Human reviewers make final decisions based on AI-assisted analysis and comprehensive evaluation metrics.

Key AI Features:
• Automated compliance and quality screening
• Intelligent reviewer assignment based on expertise matching
• Real-time progress tracking and milestone verification
• Smart recommendation system for proposal improvements
• Predictive analysis for success probability assessment`;
      
      const splitAiText = pdf.splitTextToSize(aiProcessText, pageWidth - 40);
      pdf.text(splitAiText, 20, yPosition);
      yPosition += splitAiText.length * 5 + 15;

      // Reviewer Feedback Section (if any)
      if (proposal.feedback.length > 0) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setTextColor(234, 88, 12);
        pdf.text('Expert Reviewer Feedback', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        proposal.feedback.forEach((feedback, index) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setTextColor(51, 51, 51);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${feedback.reviewer}`, 20, yPosition);
          
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(107, 114, 128);
          pdf.text(feedback.designation, 20, yPosition + 4);
          pdf.text(`Date: ${feedback.date}`, 20, yPosition + 8);
          
          pdf.setTextColor(51, 51, 51);
          const splitComment = pdf.splitTextToSize(feedback.comment, pageWidth - 40);
          pdf.text(splitComment, 20, yPosition + 12);
          yPosition += 12 + splitComment.length * 4 + 8;
        });
      }

      // Footer with logos and official information
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer line separator
        pdf.setDrawColor(234, 88, 12);
        pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
        
        // Footer logos (smaller)
        try {
          await addImageToPDF('/images/GOI logo.png', 20, pageHeight - 22, 12, 8);
          await addImageToPDF('/images/prism brand logo.png', 40, pageHeight - 22, 10, 8);
          await addImageToPDF('/images/cmpdi logo.jpg', 58, pageHeight - 22, 12, 8);
        } catch (footerLogoError) {
          console.warn('Footer logos could not be loaded:', footerLogoError);
        }
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 80, pageHeight - 18);
        pdf.text(`Page ${i} of ${totalPages}`, 80, pageHeight - 14);
        
        pdf.setFontSize(7);
        pdf.text('PRISM - Proposal Review & Innovation Support Mechanism', pageWidth - 20, pageHeight - 18, { align: 'right' });
        pdf.text('Department of Coal, Government of India', pageWidth - 20, pageHeight - 14, { align: 'right' });
        pdf.text('© 2025 Ministry of Coal, GoI', pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Save the PDF
      const fileName = `PRISM_Proposal_Report_${proposal.proposalCode || proposal._id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <UserDashboardLayout
      activeSection="proposals"
      user={user}
      logout={logout}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <style jsx>{trackAnimationStyles}</style>
      <div className="max-w-7xl mx-auto">
              <h1 className={`text-2xl font-bold mb-6 tracking-tight ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Proposal Tracking</h1>

              {/* Quick Stats Section */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div 
                  onClick={() => handleSectionClick('milestones')}
                  className={`rounded-xl shadow-md border p-4 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${activeSection === 'milestones' ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{completedMilestones}/{totalMilestones}</div>
                      <div className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Milestones Complete</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => handleSectionClick('feedback')}
                  className={`rounded-xl shadow-md border p-4 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${activeSection === 'feedback' ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{proposal.feedback.length}</div>
                      <div className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Expert Reviews</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => handleSectionClick('timeline')}
                  className={`rounded-xl shadow-md border p-4 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${activeSection === 'timeline' ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{proposal.currentPhase}</div>
                      <div className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Current Stage</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposal Card */}
              <div className={`rounded-xl shadow-md border p-6 mb-6 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                {/* Proposal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{proposal.proposalCode || proposal._id}</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        proposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                        proposal.status === 'under_review' ? 'bg-orange-100 text-orange-700' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{proposal.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <h2 className={`text-lg font-semibold mb-1 ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{proposal.title}</h2>
                    <p className={`text-sm mb-1 ${theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}><span className="font-medium">Principal Investigator:</span> {proposal.researcher}</p>
                    <p className={`text-sm ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}><span className="font-medium">Institution:</span> {proposal.institution}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium mb-1 ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Review Progress</div>
                    <div className={`text-3xl font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{proposal.progress}%</div>
                    <div className={`w-32 rounded-full h-2 mt-2 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${proposal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-8">
                    <div className={`text-sm font-medium mb-1 ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Decision Expected</div>
                    <div className={`text-lg font-semibold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Oct 15, 2025</div>
                    <div className={`text-sm font-medium ${theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{Math.ceil((new Date('2025-10-15') - new Date()) / (1000 * 60 * 60 * 24))} Days Remaining</div>
                  </div>
                </div>

                {/* Review Timeline */}
                <div className="mb-6">
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Review Stages</h3>
                  {/* Timeline Steps */}
                  <div className="relative">
                    {/* Progress Line */}
                    <div className={`absolute top-4 left-0 right-0 h-0.5 ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                    <div 
                      className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-500"
                      style={{ width: `${(proposal.timeline.filter(t => t.status === 'completed').length / proposal.timeline.length) * 100}%` }}
                    ></div>

                    {/* Timeline Items */}
                    <div className="relative flex justify-between">
                      {proposal.timeline.slice(0, 6).map((item, index) => (
                        <div key={index} className="flex flex-col items-center" style={{ width: '16.66%' }}>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 z-10 shadow-sm ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800' : 'bg-white'} ${
                            item.status === 'completed' 
                              ? 'border-blue-500' 
                              : item.status === 'active'
                              ? 'border-blue-500'
                              : (theme === 'darkest' || theme === 'dark' ? 'border-slate-600' : 'border-slate-300')
                          }`}>
                            {item.status === 'completed' ? (
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            ) : item.status === 'active' ? (
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            ) : (
                              <div className={`w-2 h-2 rounded-full ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                            )}
                          </div>
                          <span className={`text-xs text-center font-medium ${
                            item.status === 'completed' || item.status === 'active' ? (theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900') : (theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
                          }`}>
                            {item.phase.split(' ').slice(0, 2).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions Section */}
                <div className={`border-t pt-6 ${theme === 'darkest' || theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`text-base font-semibold mb-4 flex items-center space-x-2 ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI-Powered Suggestions</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {showProgressSuggestion && (
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'darkest' || theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                        <p className={`text-sm font-medium ${theme === 'darkest' || theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                          {proposal.progress}% increase in proposal completeness. Would you like to view detailed progress?
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => handleSectionClick('milestones')}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setShowProgressSuggestion(false)}
                          className={`px-4 py-1.5 border rounded-lg text-sm transition-colors ${theme === 'darkest' || theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    )}

                    {showFeedbackSuggestion && (
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'darkest' || theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></div>
                        <p className={`text-sm font-medium ${theme === 'darkest' || theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                          We recommend that you review expert feedback to improve your proposal quality.
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => handleSectionClick('feedback')}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          View Feedback
                        </button>
                        <button 
                          onClick={() => setShowFeedbackSuggestion(false)}
                          className={`px-4 py-1.5 border rounded-lg text-sm transition-colors ${theme === 'darkest' || theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                {/* Expandable Details */}
                <div className={`mt-6 pt-6 border-t ${theme === 'darkest' || theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button 
                    onClick={() => handleSectionClick(activeSection === 'all' ? null : 'all')}
                    className={`text-sm hover:text-blue-600 transition-colors flex items-center font-medium ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    <span>{activeSection === 'all' ? 'Hide Details' : 'View Full Details'}</span>
                    <svg 
                      className={`w-4 h-4 ml-1 transition-transform ${activeSection === 'all' ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Expanded Content */}
                {activeSection && (
                  <div ref={detailsContainerRef} className="mt-6 space-y-4 animate-slideInUp scroll-mt-20">
                    {/* Section 1: Detailed Timeline */}
                    {(activeSection === 'timeline' || activeSection === 'all') && (
                    <div className={`rounded-xl p-6 border ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center space-x-3 mb-5">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Review Timeline</h4>
                          <p className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Detailed progression of your proposal through review stages</p>
                        </div>
                      </div>
                      <div className="space-y-4 pl-2">
                        {proposal.timeline.map((item, index) => (
                          <div key={index} className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-600' 
                                : item.status === 'active'
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {item.status === 'completed' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : item.status === 'active' ? (
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className={`font-semibold ${
                                  item.status === 'completed' ? 'text-green-700' :
                                  item.status === 'active' ? 'text-blue-600' :
                                  (theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700')
                                }`}>
                                  {item.phase}
                                </h5>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  item.status === 'active' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{item.date}</span>
                              </div>
                              <p className={`text-sm leading-relaxed ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Section 2: Key Milestones */}
                    {(activeSection === 'milestones' || activeSection === 'all') && (
                    <div className={`rounded-xl p-6 border ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center space-x-3 mb-5">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Key Milestones</h4>
                          <p className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Track important checkpoints in the review process</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {proposal.milestones.map((milestone, index) => (
                          <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                            milestone.completed 
                              ? 'bg-white border-green-300 shadow-sm' 
                              : (theme === 'darkest' || theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {milestone.completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-semibold block ${
                                  milestone.completed ? 'text-green-700' : (theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700')
                                }`}>
                                  {milestone.title}
                                </span>
                                <div className={`text-xs mt-1 ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  <span className="font-medium">Due:</span> {milestone.dueDate}
                                </div>
                                {milestone.completedDate && (
                                  <div className="text-xs text-green-600 mt-0.5 font-medium">
                                    ✓ Completed: {milestone.completedDate}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Section 3: Expert Feedback */}
                    {(activeSection === 'feedback' || activeSection === 'all') && proposal.feedback.length > 0 && (
                      <div className={`rounded-xl p-6 border ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-5">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className={`text-lg font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Expert Feedback</h4>
                            <p className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Reviews and comments from domain experts</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {proposal.feedback.map((feedback, index) => (
                            <div key={index} className={`rounded-lg p-4 border shadow-sm ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className={`font-semibold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{feedback.reviewer}</h5>
                                  <p className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{feedback.designation}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className={`text-sm font-semibold ${theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{feedback.rating}</span>
                                </div>
                              </div>
                              <p className={`text-sm leading-relaxed ${theme === 'darkest' || theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{feedback.comment}</p>
                              <div className={`mt-2 text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className="font-medium">Date:</span> {feedback.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 4: Recent Activity */}
                    {activeSection === 'all' && (
                    <div className={`rounded-xl p-6 border ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center space-x-3 mb-5">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-bold ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Recent Activity</h4>
                          <p className={`text-xs ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Latest updates and actions on your proposal</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {proposal.recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-lg">
                              {activity.type === 'reviewer_comment' ? '💬' :
                               activity.type === 'ai_suggestion' ? '🤖' :
                               activity.type === 'proposal_edit' ? '✏️' :
                               activity.type === 'reviewer_assigned' ? '👤' : '✅'}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                <span className="font-semibold">{activity.actor}</span> {activity.action}
                              </p>
                              <p className={`text-xs mt-1 ${theme === 'darkest' || theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{activity.timestamp}</p>
                              {activity.details && (
                                <p className={`text-xs mt-2 p-2 rounded ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>{activity.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                  </div>
                )}

                {/* Action Buttons Section - Always Visible */}
                <div className={`mt-6 rounded-xl p-6 border ${theme === 'darkest' || theme === 'dark' ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 ${theme === 'darkest' || theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h4>
                  <div className="flex items-center flex-wrap gap-3">
                    <button 
                      onClick={() => router.push(`/proposal/view/${id}`)}
                      className={`px-5 py-2.5 border-2 rounded-lg text-sm font-medium transition-all shadow-sm ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Full Proposal</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => router.push(`/proposal/edit/${id}`)}
                      className={`px-5 py-2.5 border-2 rounded-lg text-sm font-medium transition-all shadow-sm ${theme === 'darkest' || theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Proposal</span>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportReport}
                      disabled={isExporting}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

      </div>
    </UserDashboardLayout>
  );
}

export default function TrackProposal() {
  return (
    <ProtectedRoute>
      <TrackProposalContent />
    </ProtectedRoute>
  );
}