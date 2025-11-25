'use client';

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../components/LoadingScreen";
import AdvancedProposalEditor from "../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Chatbot from "../../../components/Saarthi";
import VersionHistory from "../../../components/VersionHistory";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../utils/api";

// Custom CSS animations for the commit modal
const modalAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInScale {
    from { 
      opacity: 0;
      transform: scale(0.8) translateY(20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideOutScale {
    from { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to { 
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-fadeOut {
    animation: fadeOut 0.2s ease-in forwards;
  }
  
  .animate-slideInScale {
    animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .animate-slideOutScale {
    animation: slideOutScale 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.5s ease-out forwards;
    animation-fill-mode: both;
  }
  
  .animate-shake {
    animation: shake 0.6s ease-in-out;
  }
`;

function EditProposalContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { id } = router.query;
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showSaarthi, setShowSaarthi] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [characterCount, setCharacterCount] = useState(0);
    const [editorContent, setEditorContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [submissionStage, setSubmissionStage] = useState('');
    const [showEvaluation, setShowEvaluation] = useState(false);
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [commitMessage, setCommitMessage] = useState('Updated proposal content and methodology');
    const [proposalData, setProposalData] = useState({
        projectTitle: '',
        fundingMethod: 'S&T of MoC',
        implementingAgency: '',
        subImplementingAgency: '',
        projectLeader: '',
        projectCoordinator: '',
        coInvestigators: '',
        domain: 'Coal Technology & Clean Energy',
        projectOutlayLakhs: '',
        durationMonths: ''
    });

    // Initial proposal content
    const initialContent = `
  <h1 style="color: black; text-align: center;">
    PROJECT PROPOSAL FOR S&T GRANT OF MoC
  </h1>

  <h2 style="color: black;">1. Project Title</h2>
  <p style="color: black;">Enter project title here.</p>

  <h2 style="color: black;">2. Principal Implementing Agency</h2>
  <p style="color: black;">Name and address of principal Implementing Agency(s)</p>

  <h2 style="color: black;">3. Project Leader / Coordinator / Principal Investigator</h2>
  <p style="color: black;">Name of Project Leader/Coordinator/Principal Investigator</p>

  <h2 style="color: black;">4. Sub-Implementing Agency</h2>
  <p style="color: black;">Name and address of Sub-Implementing Agency(s)</p>

  <h2 style="color: black;">5. Co-Investigator(s)</h2>
  <p style="color: black;">Name of Co-Investigator(s)</p>

  <h2 style="color: black;">6. Definition of the Issue (Max. 300 words)</h2>
  <p style="color: black;">Provide definition of the issue here.</p>

  <h2 style="color: black;">7. Research Objectives (2–3 Specific Objectives)</h2>
  <ul style="color: black;">
    <li>Objective 1</li>
    <li>Objective 2</li>
    <li>Objective 3</li>
  </ul>

  <h2 style="color: black;">8. Justification for Subject Area (Max. 200 words)</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">9. Benefits to the Coal Industry</h2>
  <p style="color: black;">Explain how the project is beneficial to the coal industry.</p>

  <h2 style="color: black;">10. Work Plan (Max. 100 words)</h2>
  <p style="color: black;">Provide summary of work plan here.</p>

  <h2 style="color: black;">10.1 Methodology (Max. 200 words)</h2>
  <p style="color: black;">Describe methodology here.</p>

  <h2 style="color: black;">10.2 Organization of Work Elements (Max. 200 words)</h2>
  <p style="color: black;">Describe organization of work elements here.</p>

  <h2 style="color: black;">10.3 Time Schedule & Milestones</h2>
  <p style="color: black;">Provide timeline & milestones. Add Bar Chart/PERT Chart if required.</p>

  <h2 style="color: black;">11. Proposed Outlay (Rs. in Lakhs)</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Sl. No.</th><th>Items</th><th>Total Cost</th><th>1st Year</th><th>2nd Year</th></tr>
    <tr><td></td><td>Capital Expenditure</td><td></td><td></td><td></td></tr>
    <tr><td>9.1</td><td>Land & Building</td><td></td><td></td><td></td></tr>
    <tr><td>9.2</td><td>Equipment</td><td></td><td></td><td></td></tr>
    <tr><td>9.3</td><td>Total Capital (9.1+9.2)</td><td></td><td></td><td></td></tr>
    <tr><td></td><td>Revenue Expenditure</td><td></td><td></td><td></td></tr>
    <tr><td>9.4</td><td>Salaries / Allowances</td><td></td><td></td><td></td></tr>
    <tr><td>9.5</td><td>Consumables</td><td></td><td></td><td></td></tr>
    <tr><td>9.6</td><td>Travel</td><td></td><td></td><td></td></tr>
    <tr><td>9.7</td><td>Workshop/Seminar</td><td></td><td></td><td></td></tr>
    <tr><td>9.8</td><td>Total Revenue Expenditure (9.4+9.5+9.6+9.7)</td><td></td><td></td><td></td></tr>
    <tr><td>9.9</td><td>Contingency</td><td></td><td></td><td></td></tr>
    <tr><td>9.10</td><td>Institutional Overhead</td><td></td><td></td><td></td></tr>
    <tr><td>9.11</td><td>Applicable taxes/duties/charges</td><td></td><td></td><td></td></tr>
    <tr><td>9.12</td><td>Grand Total (9.3+9.8+9.9+9.10+9.11)</td><td></td><td></td><td></td></tr>
  </table>

  <h2 style="color: black;">12. Foreign Exchange Component</h2>
  <p style="color: black;">
    Foreign Currency: <br/>
    Exchange Rate: <br/>
    Date: 
  </p>

  <h2 style="color: black;">13. Phasing of Fund Requirement (%)</h2>
  <p style="color: black;">Provide fund phasing with respect to milestones.</p>

  <h2 style="color: black;">14. Outlay for Land & Building (Rs. in Lakhs)</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Sl. No.</th><th>Item</th><th>Plinth Area</th><th>Type of Building</th><th>Estimated Cost</th></tr>
    <tr><td>1</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>2</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>Total</td><td colspan="4"></td></tr>
  </table>

  <h2 style="color: black;">15. Justification for Land & Building</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">16. Outlay for Equipment</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Equipment & Specifications</th><th>Number</th><th>Imported/Indigenous</th><th>Estimated Cost (Lakhs)</th><th>Foreign Exchange Component</th></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>Total</td><td colspan="4"></td></tr>
  </table>

  <h2 style="color: black;">17. Justification for Equipment</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">18. Outlay for Consumable Materials</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Head</th><th>Particulars</th><th>1st Year</th><th>2nd Year</th><th>3rd Year</th><th>Total</th></tr>
    <tr><td>Q</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>B</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>F</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>E</td><td></td><td></td><td></td><td></td><td></td></tr>
  </table>

  <h2 style="color: black;">19. Mandatory Proposal Components</h2>
  <ul style="color: black;">
    <li>Brief details of the organization / institution</li>
    <li>Details of infrastructural resources available including R&D setup</li>
    <li>Details of expertise, past experience, and performance</li>
    <li>R&D component under the proposed study</li>
    <li>How the project benefits the coal industry</li>
    <li>Detailed web survey report</li>
    <li>Exclusive research or development content</li>
    <li>Details of proposed collaboration / tie-up (if applicable)</li>
  </ul>
`;


    useEffect(() => {
        if (id) {
            loadProposal();
        }
    }, [id]);

    const loadProposal = async () => {
        try {
            console.log('📖 Loading proposal for editing:', id);
            setLoading(true);

            const response = await apiClient.get(`/api/proposals/${id}`);
            const proposalData = response.data.proposal || response.data;

            setProposal(proposalData);
            setProposalData({
                projectTitle: proposalData.title || '',
                fundingMethod: proposalData.fundingMethod || 'S&T of MoC',
                implementingAgency: proposalData.implementingAgency || '',
                subImplementingAgency: proposalData.subImplementingAgency || '',
                projectLeader: proposalData.projectLeader || '',
                projectCoordinator: proposalData.projectCoordinator || '',
                coInvestigators: proposalData.coInvestigators || '',
                domain: proposalData.domain || 'Coal Technology & Clean Energy',
                projectOutlayLakhs: proposalData.budget ? (proposalData.budget / 100000).toFixed(2) : '',
                durationMonths: proposalData.durationMonths || ''
            });

            // Load word and character counts from forms
            const totalWords = proposalData.forms?.reduce((sum, form) => sum + (form.wordCount || 0), 0) || 0;
            const totalChars = proposalData.forms?.reduce((sum, form) => sum + (form.characterCount || 0), 0) || 0;
            setWordCount(totalWords);
            setCharacterCount(totalChars);

            console.log('✅ Proposal loaded successfully for editing');
            console.log('📊 Loaded forms:', proposalData.forms?.length || 0);
        } catch (error) {
            console.error('❌ Error loading proposal:', error);
            alert('Failed to load proposal: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handler functions for editor
    const handleEditorContentChange = (content) => {
        setEditorContent(content);
    };

    const handleWordCountChange = (count) => {
        setWordCount(count);
    };

    const handleCharacterCountChange = (count) => {
        setCharacterCount(count);
    };

    // Form Input Handlers
    const handleInputChange = (field, value) => {
        setProposalData(prev => ({ ...prev, [field]: value }));
    };

    // Submission Handler with AI Analysis
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Show commit message modal
        setShowCommitModal(true);
    };

    // Handle modal close with animation
    const handleCloseModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setShowCommitModal(false);
            setIsModalClosing(false);
            setCommitMessage('Updated proposal content and methodology'); // Reset to default
        }, 300); // Match the animation duration
    };

    // Handle commit message confirmation
    const handleCommitConfirm = async () => {
        if (!commitMessage.trim()) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
            return;
        }

        setIsModalClosing(true);
        setTimeout(() => {
            setShowCommitModal(false);
            setIsModalClosing(false);
        }, 300);
        setIsSubmitting(true);
        setSubmissionProgress(0);
        setShowEvaluation(false);

        // Save the proposal with updated version
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/proposals/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: proposalData.projectTitle,
                    description: `${proposalData.implementingAgency} - ${proposalData.domain}`,
                    domain: proposalData.domain,
                    budget: parseFloat(proposalData.projectOutlayLakhs) * 100000,
                    fundingMethod: proposalData.fundingMethod,
                    implementingAgency: proposalData.implementingAgency,
                    subImplementingAgency: proposalData.subImplementingAgency,
                    projectLeader: proposalData.projectLeader,
                    projectCoordinator: proposalData.projectCoordinator,
                    coInvestigators: proposalData.coInvestigators,
                    durationMonths: proposalData.durationMonths ? parseInt(proposalData.durationMonths) : null,
                    versionComment: commitMessage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update proposal');
            }

            const data = await response.json();
            console.log('✅ Proposal updated successfully');
        } catch (error) {
            console.error('❌ Error updating proposal:', error);
            alert('Failed to update proposal: ' + error.message);
            setIsSubmitting(false);
            return;
        }

        const stages = [
            { stage: 'Analyzing content changes...', duration: 2000 },
            { stage: 'Comparing with previous versions...', duration: 2500 },
            { stage: 'Validating technical improvements...', duration: 1800 },
            { stage: 'Generating evaluation metrics...', duration: 2200 },
            { stage: 'Securely storing new version on blockchain...', duration: 1500 }
        ];

        let currentProgress = 0;

        // In real implementation, progress would be tracked from actual API calls
        for (let i = 0; i < stages.length; i++) {
            setSubmissionStage(stages[i].stage);
            setSubmissionProgress((i + 1) * 20);
        }

        setSubmissionProgress(100);
        setSubmissionStage('Version created and stored successfully!');

        // Reload the proposal to get the updated version number
        await loadProposal();

        setShowEvaluation(true);
        setIsSubmitting(false);

        // Auto-hide evaluation after 8 seconds
        setTimeout(() => {
            setShowEvaluation(false);
        }, 8000);
    };

    // Mock Evaluation Scores
    const evaluationScores = {
        technicalExcellence: Math.floor(Math.random() * 15) + 85,
        financialViability: Math.floor(Math.random() * 20) + 75,
        strategicAlignment: Math.floor(Math.random() * 10) + 90,
        teamCompetency: Math.floor(Math.random() * 18) + 80,
        impactPotential: Math.floor(Math.random() * 12) + 88
    };

    const overallScore = Math.round(
        (evaluationScores.technicalExcellence +
            evaluationScores.financialViability +
            evaluationScores.strategicAlignment +
            evaluationScores.teamCompetency +
            evaluationScores.impactPotential) / 5
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            // Simulate saving with loading time
            setTimeout(() => {
                alert('Proposal changes saved successfully! New version 3.3 created.');
                setSaving(false);
                // Update version in proposal data
                setProposal(prev => ({
                    ...prev,
                    version: "3.3",
                    lastModified: new Date().toISOString().split('T')[0]
                }));
            }, 2000);
        } catch (error) {
            console.error("Error saving proposal:", error);
            alert('Error saving proposal. Please try again.');
            setSaving(false);
        }
    };







    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <style jsx>{modalAnimationStyles}</style>
            <div className="min-h-screen bg-white">
                {/* Distinctive Header Section - Matching create.jsx */}
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
                        <div className="group">
                            <div className="flex items-center mb-5">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-500 group-hover:scale-110">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                </div>

                                <div className="ml-6">
                                    <div className="flex items-center mb-2">
                                        <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                            Edit R&D Proposal
                                        </h1>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                                            <span className="text-blue-100 font-semibold text-lg">NaCCER Research Portal</span>
                                        </div>
                                        <div className="h-4 w-px bg-blue-300/50"></div>
                                        <span className="text-blue-200 font-medium text-sm">Department of Coal</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-blue-200">
                                        <span>Proposal ID: #{id}</span>
                                        <span>•</span>
                                        <span>Version: {proposal?.version || "3.2"}</span>
                                        <span>•</span>
                                        <span>Last Modified: {proposal?.lastModified || "2025-09-26"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* PRISM Banner */}
                            <div className="bg-orange-600 backdrop-blur-md rounded-2xl p-4 border border-orange-300/40 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
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
                                                    <span className="text-white text-xs font-semibold drop-shadow-sm">ACTIVE</span>
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
                    {/* SAARTHI AI Assistant - Modularized Component */}
                    <Chatbot
                        showSaarthi={showSaarthi}
                        setShowSaarthi={setShowSaarthi}
                        showVersionHistory={showVersionHistory}
                        setShowVersionHistory={setShowVersionHistory}
                    />

                    {/* Version History - Modularized Component */}
                    <VersionHistory
                        showVersionHistory={showVersionHistory}
                        setShowVersionHistory={setShowVersionHistory}
                        showSaarthi={showSaarthi}
                        proposalId={id}
                        currentVersion={proposal?.version || 1}
                    />

                    {/* Action Buttons - Top Right */}
                    <div className="flex justify-end gap-4 mb-6">
                        <div className="group relative">
                            <button
                                onClick={() => {
                                    setShowVersionHistory(!showVersionHistory);
                                    if (showSaarthi) setShowSaarthi(false); // Close AI if open
                                }}
                                className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105 ${showVersionHistory
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
                                    : 'bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-800 border border-orange-300'
                                    }`}
                            >
                                <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Version History
                            </button>
                        </div>
                        <div className="group relative">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border border-green-300 transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105"
                            >
                                <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </div>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Proposal Information Section - Scaled to Match Create.jsx */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
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
                                <label className="block text-xs font-semibold text-black mb-1">Project Title *</label>
                                <input
                                    type="text"
                                    value={proposalData.projectTitle}
                                    onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    placeholder="Enter your innovative project title"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-black mb-1">Implementing Agency *</label>
                                <input
                                    type="text"
                                    value={proposalData.implementingAgency}
                                    onChange={(e) => handleInputChange('implementingAgency', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    placeholder="Name of implementing organization"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-black mb-1">Project Leader *</label>
                                <input
                                    type="text"
                                    value={proposalData.projectLeader}
                                    onChange={(e) => handleInputChange('projectLeader', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    placeholder="Principal investigator name"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-black mb-1">Co-Investigators</label>
                                <input
                                    type="text"
                                    value={proposalData.coInvestigators}
                                    onChange={(e) => handleInputChange('coInvestigators', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    placeholder="Names of co-investigators"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-black mb-1">Research Domain *</label>
                                <select
                                    value={proposalData.domain}
                                    onChange={(e) => handleInputChange('domain', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    required
                                >
                                    <option>Coal Technology & Clean Energy</option>
                                    <option>Mining & Extraction</option>
                                    <option>Environmental Impact</option>
                                    <option>Processing & Utilization</option>
                                    <option>Safety & Health</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-black mb-1">Budget *</label>
                                <input
                                    type="text"
                                    value={proposalData.budget}
                                    onChange={(e) => handleInputChange('budget', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                                    placeholder="Enter total budget"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Section */}
                    <div className="w-full">
                        {/* Advanced Proposal Editor Component */}
                        <AdvancedProposalEditor
                            initialContent={editorContent}
                            onContentChange={handleEditorContentChange}
                            onWordCountChange={handleWordCountChange}
                            onCharacterCountChange={handleCharacterCountChange}
                            proposalTitle={proposal?.title || "Advanced Coal Gasification Technology for Enhanced Energy Production"}
                            showStats={true}
                            showExportButtons={true}
                            className="bg-white rounded-xl shadow-lg border border-orange-200"
                            proposalId={id}
                            existingForms={proposal?.forms || []}
                            mode="edit"
                        />

                        {/* Submit New Version Button - Hidden During Progress */}
                        {!isSubmitting && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Submit New Version of Proposal
                                </button>
                            </div>
                        )}

                        {/* Progress Bar - Matching Create.jsx */}
                        {isSubmitting && (
                            <div className="mt-8 relative overflow-hidden bg-orange-50 rounded-2xl border border-orange-200 shadow-2xl p-8">

                                {/* Floating Particles */}
                                <div className="absolute inset-0">
                                    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-orange-300/20 rounded-full animate-pulse animation-delay-1000"></div>
                                    <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse animation-delay-2000"></div>
                                    <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-orange-200/40 rounded-full animate-pulse animation-delay-3000"></div>
                                    <div className="absolute top-1/3 left-2/3 w-1.5 h-1.5 bg-orange-500/25 rounded-full animate-pulse animation-delay-4000"></div>
                                </div>

                                <div className="relative z-10 text-center">
                                    {/* AI Loading Animation - Match Upload Loader */}
                                    <div className="flex justify-center items-center mb-6">
                                        <div className="relative">
                                            {/* Orange-White-Green Ring with Visible White */}
                                            <div className="w-20 h-20 rounded-full animate-spin" style={{
                                                animationDuration: '2s',
                                                background: 'conic-gradient(from 0deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                                                padding: '4px'
                                            }}>
                                                <div className="w-full h-full bg-orange-50 rounded-full"></div>
                                            </div>
                                            {/* Inner Ring with Visible White */}
                                            <div className="absolute inset-2 w-16 h-16 rounded-full animate-spin" style={{
                                                animationDuration: '1.5s',
                                                animationDirection: 'reverse',
                                                background: 'conic-gradient(from 180deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                                                padding: '3px'
                                            }}>
                                                <div className="w-full h-full bg-orange-50 rounded-full"></div>
                                            </div>
                                            {/* Prism Logo in Center */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-orange-200 flex items-center justify-center">
                                                    <img
                                                        src="/images/prism brand logo.png"
                                                        alt="Prism Logo"
                                                        className="w-6 h-6 object-contain animate-pulse"
                                                    />
                                                </div>
                                            </div>
                                            {/* Simplified Particles */}
                                            <div className="absolute -top-2 -left-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                                            <div className="absolute -top-2 -right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                            <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                                            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl text-black mb-2 tracking-tight">AI Analysis in Progress</h3>
                                    <p className="text-black mb-6 text-lg">{submissionStage}</p>
                                </div>

                                {/* Advanced Progress Bar */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-black">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                            Analysis Progress
                                        </span>
                                        <span className="text-black bg-orange-100 px-3 py-1 rounded-full text-sm border border-orange-200">
                                            {Math.round(submissionProgress)}%
                                        </span>
                                    </div>

                                    <div className="relative">
                                        {/* Clean Progress Bar - Match Upload Progress Bar */}
                                        <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                                            {/* Simple Clean Progress Fill */}
                                            <div
                                                className="h-full transition-all duration-1000 ease-out rounded-full"
                                                style={{
                                                    width: `${submissionProgress}%`,
                                                    background: submissionProgress <= 50 ? 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)' :
                                                        'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #22c55e 100%)'
                                                }}
                                            ></div>
                                        </div>

                                        {/* Progress Stages Indicators */}
                                        <div className="flex justify-between mt-3 px-1">
                                            {['Analyzing', 'Processing', 'Evaluating', 'Complete'].map((stage, index) => {
                                                const stageColors = ['text-orange-600', 'text-orange-500', 'text-green-600', 'text-green-700'];
                                                const stageBgColors = ['bg-orange-600 border-orange-600', 'bg-orange-500 border-orange-500', 'bg-green-600 border-green-600', 'bg-green-700 border-green-700'];

                                                return (
                                                    <div key={stage} className={`flex flex-col items-center ${submissionProgress > (index * 25) ? stageColors[index] : 'text-black/40'
                                                        }`}>
                                                        <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${submissionProgress > (index * 25)
                                                            ? `${stageBgColors[index]} animate-pulse`
                                                            : 'bg-white border-gray-300'
                                                            }`}></div>
                                                        <span className="text-xs mt-1">{stage}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Evaluation Results - Matching Create.jsx */}
                        {showEvaluation && (
                            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-green-200 animate-fade-in">
                                <div className="space-y-6">
                                    <div className="text-center pb-6 border-b border-gray-200">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl text-black mb-2">AI Evaluation Complete</h3>
                                        <p className="text-black">Version {proposal?.version} has been created and analyzed</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-black">Evaluation Scores</h4>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <span className="text-sm text-black">Technical Excellence</span>
                                                    <span className="text-black">{evaluationScores.technicalExcellence}/100</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <span className="text-sm text-black">Financial Viability</span>
                                                    <span className="text-black">{evaluationScores.financialViability}/100</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <span className="text-sm text-black">Strategic Alignment</span>
                                                    <span className="text-black">{evaluationScores.strategicAlignment}/100</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <span className="text-sm text-black">Team Competency</span>
                                                    <span className="text-black">{evaluationScores.teamCompetency}/100</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <span className="text-sm text-black">Impact Potential</span>
                                                    <span className="text-black">{evaluationScores.impactPotential}/100</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center">
                                            <div className="relative w-32 h-32 mb-4">
                                                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                                                <div
                                                    className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent animate-pulse"
                                                    style={{
                                                        background: `conic-gradient(from 0deg, #10b981 0%, #10b981 ${overallScore}%, transparent ${overallScore}%, transparent 100%)`
                                                    }}
                                                ></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-3xl text-black">{overallScore}</div>
                                                        <div className="text-sm text-black">Overall</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-center text-sm text-black mb-4">
                                                Excellent proposal quality! Your submission shows strong technical merit and strategic alignment.
                                            </p>
                                            <button
                                                onClick={() => router.push('/dashboard')}
                                                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                Continue to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Commit Message Modal */}
                {showCommitModal && (
                    <div
                        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isModalClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-orange-200 ${isModalClosing ? 'animate-slideOutScale' : 'animate-slideInScale'
                                } ${isShaking ? 'animate-shake' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse hover:animate-bounce transition-all duration-300 hover:bg-orange-200 cursor-pointer">
                                    <svg className="w-8 h-8 text-orange-600 transition-all duration-300 hover:text-orange-700 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-black mb-2 animate-fadeInUp">Version Commit Message</h3>
                                <p className="text-gray-500 text-sm animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                    Describe the changes you made in this version. This will help you and your collaborators track the evolution of your proposal.
                                </p>
                            </div>

                            <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                <label className="block text-sm font-semibold text-black mb-3 transform transition-all duration-300 hover:text-orange-600">
                                    What changes did you make? <span className="text-red-500 animate-pulse">*</span>
                                </label>
                                <textarea
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-orange-50 hover:bg-white focus:bg-white text-black resize-none transform hover:scale-[1.02] focus:scale-[1.02] hover:shadow-lg focus:shadow-xl"
                                    rows="3"
                                    placeholder="e.g., Updated methodology section, revised budget allocation, added new research objectives..."
                                    maxLength="200"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1 transition-all duration-300 hover:text-orange-500">
                                    <span className={`transition-colors duration-300 ${commitMessage.length > 180 ? 'text-orange-500' : commitMessage.length > 150 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {commitMessage.length}/200 characters
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg active:scale-95 hover:-translate-y-0.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCommitConfirm}
                                    disabled={!commitMessage.trim()}
                                    className={`flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-medium transform active:scale-95 ${commitMessage.trim()
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    Submit Version
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function EditProposal() {
    return (
        <ProtectedRoute>
            <EditProposalContent />
        </ProtectedRoute>
    );
}
