'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import AdvancedProposalEditor from '../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor';
import apiClient from '../../../utils/api';

// Custom CSS animations for the view page
const viewAnimationStyles = `
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

function ViewProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProposal = async () => {
      try {
        if (id) {
          console.log('Loading proposal for view:', id);
          setLoading(true);
          
          const response = await apiClient.get(`/api/proposals/${id}`);
          const proposalData = response.data.data || response.data;
          console.log('✅ Proposal loaded for view:', proposalData.proposalCode);
          console.log('📋 Forms available:', proposalData.forms ? Object.keys(proposalData.forms) : 'none');
          setProposal(proposalData);
        }
      } catch (error) {
        console.error('❌ Error loading proposal for view:', error);
        alert('Failed to load proposal: ' + (error.response?.data?.message || error.message));
      } finally{
        setLoading(false);
      }
    };

    loadProposal();
  }, [id]);

  // Dummy function to satisfy old code structure
  const getProposalContent = () => {
    if (!proposal) return '';
    
    // Backend stores forms as: { formI, formIA, formIX, formX, formXI, formXII }
    // Each form contains Plate.js JSON content
    if (proposal.forms) {
      // Combine all form contents into one HTML view
      const formKeys = ['formI', 'formIA', 'formIX', 'formX', 'formXI', 'formXII'];
      const formNames = {
        formI: 'Form I - Project Details',
        formIA: 'Form IA - Additional Information',
        formIX: 'Form IX - Budget Details',
        formX: 'Form X - Technical Specifications',
        formXI: 'Form XI - Timeline',
        formXII: 'Form XII - References'
      };
      
      let combinedContent = '';
      formKeys.forEach(formKey => {
        if (proposal.forms[formKey]) {
          combinedContent += `<h2 style="color: black; font-size: 1.5em; font-weight: bold; margin: 2em 0 1em 0; padding-top: 1em; border-top: 2px solid #f97316;">${formNames[formKey]}</h2>`;
          combinedContent += convertPlateToHTML(proposal.forms[formKey]);
        }
      });
      
      if (combinedContent) return combinedContent;
    }
    
    // Generate basic content from proposal metadata
    return generateBasicContent(proposal);
  };

  // Convert Plate.js editor content to HTML
  const convertPlateToHTML = (content) => {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    
    return content.map(node => {
      if (node.type === 'h1') return `<h1 style="color: black; font-size: 2em; font-weight: bold; margin: 1em 0;">${node.children.map(c => c.text || '').join('')}</h1>`;
      if (node.type === 'h2') return `<h2 style="color: black; font-size: 1.5em; font-weight: bold; margin: 1em 0;">${node.children.map(c => c.text || '').join('')}</h2>`;
      if (node.type === 'h3') return `<h3 style="color: black; font-size: 1.25em; font-weight: bold; margin: 0.75em 0;">${node.children.map(c => c.text || '').join('')}</h3>`;
      if (node.type === 'p') return `<p style="color: black; line-height: 1.6; margin-bottom: 1em;">${node.children.map(c => c.text || '').join('')}</p>`;
      if (node.type === 'ul') return `<ul style="color: black; margin-left: 2em; margin-bottom: 1em;">${node.children.map(li => `<li>${li.children.map(c => c.text || '').join('')}</li>`).join('')}</ul>`;
      if (node.type === 'ol') return `<ol style="color: black; margin-left: 2em; margin-bottom: 1em;">${node.children.map(li => `<li>${li.children.map(c => c.text || '').join('')}</li>`).join('')}</ol>`;
      return `<p style="color: black;">${node.children ? node.children.map(c => c.text || '').join('') : ''}</p>`;
    }).join('');
  };

  // Generate basic content from proposal metadata
  const generateBasicContent = (prop) => {
    return `
      <h2 style="color: black; font-weight: bold; font-size: 1.5em; margin: 1.5em 0 1em 0;">Project Overview</h2>
      <p style="color: black; line-height: 1.6; margin-bottom: 1em;">${prop.title || 'No title available.'}</p>
      
      <h2 style="color: black; font-weight: bold; font-size: 1.5em; margin: 1.5em 0 1em 0;">Project Details</h2>
      <p style="color: black; line-height: 1.6;"><strong>Funding Method:</strong> ${prop.fundingMethod || 'N/A'}</p>
      <p style="color: black; line-height: 1.6;"><strong>Budget:</strong> ₹${(prop.outlayLakhs || 0).toLocaleString()} Lakhs</p>
      <p style="color: black; line-height: 1.6;"><strong>Duration:</strong> ${prop.durationMonths || 0} months</p>
      <p style="color: black; line-height: 1.6;"><strong>Status:</strong> ${(prop.status || 'DRAFT').replace('_', ' ').toUpperCase()}</p>
      
      <h2 style="color: black; font-weight: bold; font-size: 1.5em; margin: 1.5em 0 1em 0;">Research Team</h2>
      <p style="color: black; line-height: 1.6;"><strong>Project Leader:</strong> ${prop.projectLeader || 'N/A'}</p>
      <p style="color: black; line-height: 1.6;"><strong>Project Coordinator:</strong> ${prop.projectCoordinator || 'N/A'}</p>
      <p style="color: black; line-height: 1.6;"><strong>Principal Agency:</strong> ${prop.principalAgency || 'N/A'}</p>
      ${prop.subAgencies && prop.subAgencies.length > 0 ? `<p style="color: black; line-height: 1.6;"><strong>Sub-Agencies:</strong> ${prop.subAgencies.join(', ')}</p>` : ''}
    `;
  };

  const handleExport = async (type) => {
    console.log(`📄 Starting export as ${type.toUpperCase()}`);
    setIsExporting(true);
    setExportType(type);
    setExportProgress(0);
    
    try {
      const proposalContent = getProposalContent();
      const filename = `${(proposal.title || 'Proposal').replace(/\s+/g, '_')}_Proposal.${type}`;
      
      if (type === 'pdf') {
        // Generate professionally formatted PDF
        const pdf = new jsPDF();
        let yPosition = 20;
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const maxWidth = pageWidth - (2 * margin);
        
        setExportProgress(10);
        
        // Title
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        const titleLines = pdf.splitTextToSize(proposal.title, maxWidth);
        pdf.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 8 + 15;
        
        setExportProgress(20);
        
        // Proposal Information
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('PROPOSAL INFORMATION', margin, yPosition);
        yPosition += 12;
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        
        const infoItems = [
          [`Proposal Code:`, proposal.proposalCode || 'N/A'],
          [`Project Leader:`, proposal.projectLeader || 'N/A'],
          [`Project Coordinator:`, proposal.projectCoordinator || 'N/A'],
          [`Principal Agency:`, proposal.principalAgency || 'N/A'],
          [`Funding Method:`, proposal.fundingMethod || 'N/A'],
          [`Budget (Lakhs):`, `₹${(proposal.outlayLakhs || 0).toLocaleString()}`],
          [`Duration:`, `${proposal.durationMonths || 0} months`],
          [`Status:`, (proposal.status || 'DRAFT').replace('_', ' ').toUpperCase()],
          [`Submitted Date:`, proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A']
        ];
        
        infoItems.forEach(([label, value]) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFont(undefined, 'bold');
          pdf.text(label, margin, yPosition);
          pdf.setFont(undefined, 'normal');
          const valueLines = pdf.splitTextToSize(value, maxWidth - 60);
          pdf.text(valueLines, margin + 60, yPosition);
          yPosition += Math.max(valueLines.length * 6, 8) + 2;
        });
        
        yPosition += 10;
        setExportProgress(40);
        
        // Content Section
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text('PROPOSAL CONTENT', margin, yPosition);
        yPosition += 15;
        
        // Process HTML content
        const contentSections = proposalContent.split(/<h2[^>]*>/);
        
        contentSections.forEach((section, index) => {
          if (index === 0 && !section.trim()) return;
          
          setExportProgress(40 + (index * 30 / contentSections.length));
          
          const headingMatch = section.match(/^([^<]+)/);
          const heading = headingMatch ? headingMatch[1].trim() : '';
          
          if (heading) {
            if (yPosition > 260) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(heading, margin, yPosition);
            yPosition += 10;
          }
          
          const contentPart = section.replace(/^[^<]*<\/h2>/, '');
          let cleanContent = contentPart
            .replace(/<\/h2>/g, '')
            .replace(/<p[^>]*>/g, '\n')
            .replace(/<\/p>/g, '\n')
            .replace(/<ul[^>]*>/g, '\n')
            .replace(/<\/ul>/g, '\n')
            .replace(/<li[^>]*>/g, '• ')
            .replace(/<\/li>/g, '\n')
            .replace(/<strong[^>]*>/g, '')
            .replace(/<\/strong>/g, '')
            .replace(/<table[^>]*>[\s\S]*?<\/table>/g, '[TABLE CONTENT]')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .trim();
          
          if (cleanContent) {
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            const contentLines = pdf.splitTextToSize(cleanContent, maxWidth);
            
            contentLines.forEach(line => {
              if (yPosition > 275) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, margin, yPosition);
              yPosition += 5;
            });
            yPosition += 5;
          }
        });
        
        setExportProgress(90);
        
        // Add footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pdf.internal.pageSize.height - 10);
          pdf.text('PRISM - NaCCER Research Portal', margin, pdf.internal.pageSize.height - 10);
        }
        
        setExportProgress(100);
        console.log('✅ PDF export complete');
        pdf.save(filename);
        
      } else if (type === 'docx') {
        setExportProgress(10);
        
        const contentSections = proposalContent.split(/<h2[^>]*>/);
        const docChildren = [];
        
        // Title
        docChildren.push(
          new Paragraph({
            text: proposal.title,
            heading: HeadingLevel.TITLE,
            alignment: 'center',
            spacing: { after: 400 }
          })
        );
        
        setExportProgress(20);
        
        // Info section
        docChildren.push(
          new Paragraph({
            text: 'PROPOSAL INFORMATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 }
          })
        );
        
        const infoItems = [
          [`Project Leader:`, proposal.author?.name || proposal.projectLeader || 'N/A'],
          [`Implementing Agency:`, proposal.implementingAgency || 'N/A'],
          [`Research Domain:`, proposal.domain || 'N/A'],
          [`Budget:`, `₹${(proposal.budget || 0).toLocaleString()}`],
          [`Duration:`, proposal.duration || '24 months'],
          [`Status:`, (proposal.status || 'draft').replace('_', ' ').toUpperCase()]
        ];
        
        infoItems.forEach(([label, value]) => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: label, bold: true }),
                new TextRun({ text: ` ${value}` })
              ],
              spacing: { after: 100 }
            })
          );
        });
        
        setExportProgress(40);
        
        // Content
        docChildren.push(
          new Paragraph({
            text: 'PROPOSAL CONTENT',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );
        
        contentSections.forEach((section, index) => {
          if (index === 0 && !section.trim()) return;
          
          setExportProgress(40 + (index * 40 / contentSections.length));
          
          const headingMatch = section.match(/^([^<]+)/);
          const heading = headingMatch ? headingMatch[1].trim() : '';
          
          if (heading) {
            docChildren.push(
              new Paragraph({
                text: heading,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 }
              })
            );
          }
          
          const contentPart = section.replace(/^[^<]*<\/h2>/, '');
          let cleanContent = contentPart
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleanContent) {
            docChildren.push(
              new Paragraph({
                text: cleanContent,
                spacing: { after: 150 }
              })
            );
          }
        });
        
        setExportProgress(80);
        
        const doc = new Document({
          sections: [{
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
              }
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    text: "PRISM - NaCCER Research Portal",
                    alignment: 'right',
                    spacing: { after: 200 }
                  })
                ]
              })
            },
            children: docChildren
          }]
        });
        
        setExportProgress(90);
        
        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        setExportProgress(100);
        console.log('✅ DOCX export complete');
        saveAs(blob, filename);
      }
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportType('');
        setExportProgress(0);
      }, 1000);
    }
  };



  if (loading) {
    return <LoadingScreen />;
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
      <style jsx>{viewAnimationStyles}</style>
      <div className="min-h-screen bg-white">
      {/* Distinctive Header Section - Matching create.jsx and edit.jsx */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[280px]">
        {/* Animated geometric patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-6 left-10 w-12 h-12 border border-blue-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-10 h-10 border border-indigo-400/20 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-12 left-32 w-8 h-8 bg-blue-500/10 rounded-full animate-bounce"></div>
          <div className="absolute top-12 right-40 w-4 h-4 bg-indigo-400/20 rounded-full animate-ping"></div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        
        {/* Header Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="group animate-fadeIn">
            <div className="flex items-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              <div className="ml-6">
                <div className="flex items-center mb-2">
                  <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-slideInUp">
                    View R&D Proposal
                  </h1>
                </div>
                <div className="flex items-center space-x-3 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-blue-100 font-semibold text-lg">NaCCER Research Portal</span>
                  </div>
                  <div className="h-4 w-px bg-blue-300/50"></div>
                  <span className="text-blue-200 font-medium text-sm">Department of Coal</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                  <span>Proposal Code: {proposal?.proposalCode || id}</span>
                  <span>•</span>
                  <span>Project Leader: {proposal?.projectLeader || 'Loading...'}</span>
                  <span>•</span>
                  <span>Status: {proposal?.status ? proposal.status.replace('_', ' ').toUpperCase() : 'LOADING'}</span>
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
                      <div className="ml-3 px-2 py-0.5 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full flex items-center justify-center border border-green-300/40 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-green-300 rounded-full mr-1.5 animate-pulse"></div>
                        <span className="text-white text-xs font-semibold drop-shadow-sm">VIEWING</span>
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
      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        
        {/* Back to Dashboard Button - Separate */}
        <div className="flex justify-start mb-6">
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
        </div>



        {/* Proposal Information Section - Scaled to Match Create.jsx */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Proposal Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Project Title</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.title || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Proposal Code</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.proposalCode || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Project Leader</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.projectLeader || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Project Coordinator</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.projectCoordinator || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Principal Agency</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.principalAgency || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Funding Method</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.fundingMethod || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Budget (Lakhs)</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                ₹{(proposal.outlayLakhs || 0).toLocaleString()}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-black mb-1">Sub-Agencies</label>
              <div className="w-full px-2 py-1.5 border border-orange-200 rounded-md bg-orange-50 text-black text-xs">
                {proposal.subAgencies && proposal.subAgencies.length > 0 ? proposal.subAgencies.join(', ') : 'None'}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="text-orange-600 text-xs font-semibold mb-1">Duration</div>
              <div className="text-black font-semibold text-sm">{proposal.durationMonths || 0} months</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-green-600 text-xs font-semibold mb-1">Status</div>
              <div className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${
                proposal.status === 'ACCEPTED' || proposal.status === 'SSRC_APPROVED' ? 'bg-green-100 text-green-800' :
                proposal.status?.includes('REJECTED') ? 'bg-red-100 text-red-800' :
                proposal.status?.includes('REVIEW') ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {(proposal.status || 'DRAFT').replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-blue-600 text-xs font-semibold mb-1">Created</div>
              <div className="text-black font-semibold text-sm">{proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Proposal Content Section - Using AdvancedProposalEditor in View-Only Mode */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">View-Only Mode</h4>
                <p className="text-sm text-blue-700">
                  This proposal is displayed in read-only mode. You can view all forms, switch between tabs, and export as PDF. 
                  Editing and commenting features are disabled.
                </p>
              </div>
            </div>
          </div>
          
          {/* Advanced Proposal Editor in View-Only Mode */}
          <AdvancedProposalEditor
            proposalId={id}
            mode="view"
            initialContent={proposal?.forms || null}
            proposalTitle={proposal?.title || 'Research Proposal'}
            showStats={false}
            readOnly={true}
          />
        </div>

        {/* Action Buttons - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideInUp" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={() => router.push(`/proposal/edit/${id}`)}
            className="p-6 bg-white rounded-xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105 group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-300">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <div className="text-black font-semibold text-lg">Edit Proposal</div>
                <div className="text-gray-500 text-sm">Make changes and updates</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push(`/proposal/collaborate/${id}`)}
            className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105 group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-black font-semibold text-lg">Collaborate</div>
                <div className="text-gray-500 text-sm">Join team discussion</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push(`/proposal/track/${id}`)}
            className="p-6 bg-white rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105 group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-black font-semibold text-lg">Track Progress</div>
                <div className="text-gray-500 text-sm">Monitor review status</div>
              </div>
            </div>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

export default function ViewProposal() {
  return (
    <ProtectedRoute>
      <ViewProposalContent />
    </ProtectedRoute>
  );
}