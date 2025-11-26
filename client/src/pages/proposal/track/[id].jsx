'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import TimelineChart from '../../../components/TimelineChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
      pdf.text(`Proposal ID: ${proposal.id}`, pageWidth / 2, yPosition, { align: 'center' });
      
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
        [`Proposal ID:`, proposal.id],
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
      const fileName = `PRISM_Proposal_Report_${proposal.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <style jsx>{trackAnimationStyles}</style>
      <div className="min-h-screen bg-white">
        {/* Distinctive Header Section - Matching create.jsx and view.jsx */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[280px]" style={{ overflow: 'visible' }}>
          {/* Animated geometric patterns */}
          <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
            <div className="absolute top-6 left-10 w-12 h-12 border border-blue-400/30 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-10 h-10 border border-indigo-400/20 rounded-lg rotate-45 animate-spin-slow"></div>
            <div className="absolute bottom-12 left-32 w-8 h-8 bg-blue-500/10 rounded-full animate-bounce"></div>
            <div className="absolute top-12 right-40 w-4 h-4 bg-indigo-400/20 rounded-full animate-ping"></div>
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Header Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-10" style={{ overflow: 'visible' }}>
            <div className="group animate-fadeIn">
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-500 group-hover:scale-110">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-6 bg-green-400 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
                
                <div className="ml-6">
                  <div className="flex items-center mb-2">
                    <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-slideInUp">
                      Track Proposal
                    </h1>
                  </div>
                  <div className="flex items-center space-x-3 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                      <span className="text-blue-100 font-semibold text-lg">NaCCER Research Portal</span>
                    </div>
                    <div className="h-4 w-px bg-blue-300/50"></div>
                    <span className="text-blue-200 font-medium text-sm">Proposal Tracking System</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blue-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                    <span>Proposal ID: {proposal.id}</span>
                    <span>•</span>
                    <span>Status: {proposal.status.replace('_', ' ').toUpperCase()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      {completedMilestones}/{totalMilestones} milestones
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
                          <span className="text-white text-xs font-semibold drop-shadow-sm">TRACKING</span>
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
          
          {/* Navigation and Control Buttons */}
          <div className="flex justify-between items-center mb-6">
            {/* Back to Dashboard Button */}
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

            {/* Export Button */}
            <button 
              onClick={handleExportReport}
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
              {isExporting ? 'Generating...' : 'Export Report'}
            </button>
          </div>

          {/* Proposal Overview Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Proposal Overview
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-orange-600 text-sm font-semibold mb-1">Title</div>
                <div className="text-black font-semibold text-sm">{proposal.title}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-semibold mb-1">Principal Investigator</div>
                <div className="text-black font-semibold text-sm">{proposal.researcher}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-green-600 text-sm font-semibold mb-1">Current Phase</div>
                <div className="text-black font-semibold text-sm">{proposal.currentPhase}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-black">Overall Progress</span>
                <span className="text-sm font-bold text-orange-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out animate-pulse-gentle"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{proposal.budget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Budget (₹)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{proposal.submittedDate}</div>
                <div className="text-sm text-gray-500">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedMilestones}/{totalMilestones}</div>
                <div className="text-sm text-gray-500">Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{proposal.feedback.length}</div>
                <div className="text-sm text-gray-500">Reviews</div>
              </div>
            </div>
          </div>

          {/* Timeline and Milestones using TimelineChart component */}
          <TimelineChart 
            timeline={proposal.timeline}
            milestones={proposal.milestones}
            currentPhase={proposal.currentPhase}
          />

          {/* Recent Activity Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-200 animate-slideInUp" style={{ animationDelay: '0.8s' }}>
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {proposal.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    activity.type === 'reviewer_comment' ? 'bg-blue-500' :
                    activity.type === 'ai_suggestion' ? 'bg-purple-500' :
                    activity.type === 'proposal_edit' ? 'bg-orange-500' :
                    activity.type === 'reviewer_assigned' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}>
                    {activity.type === 'reviewer_comment' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ) : activity.type === 'ai_suggestion' ? (
                      <img src="/images/AI assistant logo.png" alt="AI" className="w-6 h-6 rounded-full" />
                    ) : activity.type === 'proposal_edit' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ) : activity.type === 'reviewer_assigned' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-black">{activity.actor}</span>
                      <span className="text-gray-500 text-sm">{activity.action}</span>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewer Feedback Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 animate-slideInUp" style={{ animationDelay: '1.0s' }}>
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                </svg>
              </div>
              Reviewer Feedback
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proposal.feedback.map((feedback, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  feedback.type === 'positive' ? 'bg-green-50 border-green-500' :
                  feedback.type === 'suggestion' ? 'bg-blue-50 border-blue-500' :
                  'bg-gray-50 border-gray-400'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      feedback.type === 'positive' ? 'bg-green-500' :
                      feedback.type === 'suggestion' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}>
                      {feedback.reviewer.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-black text-sm mb-1">{feedback.reviewer}</div>
                      <div className="text-xs text-gray-500 mb-2">{feedback.designation}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-2">{feedback.comment}</p>
                  <div className="text-xs text-gray-500">{feedback.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header Section with Government Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ⬅ Back to Dashboard
            </button>
            
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-blue-900 mb-2">Track Proposal Progress</h1>
              <p className="text-blue-700 text-lg">PRISM - Proposal Review & Innovation Support Mechanism</p>
              <p className="text-black mt-2">Real-time tracking for Department of Coal R&D proposals</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-black">Proposal ID</div>
                <div className="font-semibold text-blue-900">{proposal.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Proposal Overview Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="border-l-4 border-blue-600 pl-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{proposal.title}</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-black font-medium">Principal Investigator:</span>
                <span className="ml-2 text-blue-900">{proposal.researcher}</span>
              </div>
              <div>
                <span className="text-black font-medium">Institution:</span>
                <span className="ml-2 text-blue-900">{proposal.institution}</span>
              </div>
              <div>
                <span className="text-black font-medium">Domain:</span>
                <span className="ml-2 text-blue-900">{proposal.domain}</span>
              </div>
              <div>
                <span className="text-black font-medium">Budget:</span>
                <span className="ml-2 text-blue-900">₹{proposal.budget.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            {/* Status and Progress */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  proposal.status === 'under_review' 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : proposal.status === 'approved'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  ● {proposal.currentPhase}
                </div>
                <div className="text-sm text-black">
                  Submitted on {new Date(proposal.submittedDate).toLocaleDateString('en-IN')}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-black mb-1">Overall Progress</div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${proposal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-900 font-bold text-lg">{proposal.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-8">
          {/* Progress Timeline Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">🔄 Progress Timeline</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200"></div>
              <div className="space-y-6">
                {proposal.timeline.map((item, index) => (
                  <div key={index} className="relative flex items-start">
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                      item.status === 'completed' 
                        ? 'bg-green-500 border-green-200' 
                        : item.status === 'active' 
                        ? 'bg-blue-500 border-blue-200 animate-pulse' 
                        : 'bg-gray-300 border-gray-200'
                    }`}>
                      {item.status === 'completed' ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : item.status === 'active' ? (
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-6 flex-1 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${
                          item.status === 'completed' ? 'text-green-700' :
                          item.status === 'active' ? 'text-blue-700' :
                          'text-gray-600'
                        }`}>
                          {item.phase}
                        </h3>
                        {item.date && (
                          <span className="text-sm text-black bg-gray-100 px-2 py-1 rounded">
                            {new Date(item.date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="text-black">{item.description}</p>
                      {item.status === 'active' && (
                        <div className="mt-2 text-sm text-blue-600 font-medium">⚡ Currently in progress</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Milestones Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">📋 Key Milestones</h2>
              <div className="space-y-4">
                {proposal.milestones.map((milestone, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    milestone.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {milestone.completed ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h3 className={`font-semibold ${milestone.completed ? 'text-green-700' : 'text-black'}`}>
                          {milestone.title}
                        </h3>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        milestone.completed ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {milestone.completed ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-black">
                      <span className="font-medium">Due:</span> {new Date(milestone.dueDate).toLocaleDateString('en-IN')}
                      {milestone.completedDate && (
                        <span className="ml-4">
                          <span className="font-medium">Completed:</span> {new Date(milestone.completedDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">🔔 Recent Activity</h2>
              <div className="space-y-4">
                {proposal.recentActivity.map((activity, index) => {
                  const getIcon = (type) => {
                    switch(type) {
                      case 'reviewer_comment': return '💬';
                      case 'ai_suggestion': return '🤖';
                      case 'proposal_edit': return '✏️';
                      case 'reviewer_assigned': return '👤';
                      case 'milestone_completed': return '✅';
                      default: return '📝';
                    }
                  };
                  
                  const getTypeColor = (type) => {
                    switch(type) {
                      case 'reviewer_comment': return 'border-blue-200 bg-blue-50';
                      case 'ai_suggestion': return 'border-purple-200 bg-purple-50';
                      case 'proposal_edit': return 'border-orange-200 bg-orange-50';
                      case 'reviewer_assigned': return 'border-green-200 bg-green-50';
                      case 'milestone_completed': return 'border-green-200 bg-green-50';
                      default: return 'border-gray-200 bg-gray-50';
                    }
                  };
                  
                  return (
                    <div key={index} className={`border rounded-lg p-4 ${getTypeColor(activity.type)}`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="text-sm text-black mb-1">
                            <span className="font-semibold text-blue-900">{activity.actor}</span>
                            <span className="mx-1">•</span>
                            <span>{activity.action}</span>
                          </div>
                          <p className="text-sm text-black mb-2">{activity.details}</p>
                          <div className="text-xs text-gray-600">{activity.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback Highlights Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">💭 Reviewer Feedback Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposal.feedback.map((feedback, index) => {
                const getTypeColor = (type) => {
                  switch(type) {
                    case 'positive': return 'border-green-200 bg-green-50';
                    case 'suggestion': return 'border-blue-200 bg-blue-50';
                    case 'neutral': return 'border-gray-200 bg-gray-50';
                    default: return 'border-yellow-200 bg-yellow-50';
                  }
                };
                
                const getTypeIcon = (type) => {
                  switch(type) {
                    case 'positive': return '👍';
                    case 'suggestion': return '💡';
                    case 'neutral': return '📝';
                    default: return '⚠️';
                  }
                };
                
                return (
                  <div key={index} className={`border rounded-lg p-4 ${getTypeColor(feedback.type)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {feedback.reviewer.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-xs">{getTypeIcon(feedback.type)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < Math.floor(feedback.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <h4 className="font-semibold text-black mb-1">{feedback.reviewer}</h4>
                    <p className="text-xs text-black mb-2">{feedback.designation}</p>
                    <p className="text-sm text-black mb-2 leading-relaxed">{feedback.comment}</p>
                    <div className="text-xs text-gray-600">{new Date(feedback.date).toLocaleDateString('en-IN')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push(`/proposal/view/${id}`)}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📄</span>
                <span>View Proposal</span>
              </button>
              
              <button
                onClick={() => router.push(`/proposal/edit/${id}`)}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>✏️</span>
                <span>Edit Proposal</span>
              </button>
              
              <button
                onClick={() => router.push(`/proposal/collaborate/${id}`)}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span>👥</span>
                <span>Collaborate</span>
              </button>
              
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>🖨️</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackProposal() {
  return (
    <ProtectedRoute>
      <TrackProposalContent />
    </ProtectedRoute>
  );
}