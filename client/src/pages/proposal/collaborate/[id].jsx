import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import AdvancedProposalEditor from '../../../components/AdvancedProposalEditor';
import Chatbot from '../../../components/Chatbot';
import VersionHistory from '../../../components/VersionHistory';
import ChatWindow from '../../../components/ChatWindow';
import { createPortal } from 'react-dom';

// Custom CSS animations for the collaborate page
const collaborateAnimationStyles = `
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
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(300px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(300px);
    }
  }
  
  @keyframes fadeInScale {
    from { 
      opacity: 0;
      transform: scale(0.8) translateY(20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes slideInScale {
    from { 
      opacity: 0;
      transform: scale(0.7) translateY(20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes slideOutScale {
    from { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to { 
      opacity: 0;
      transform: scale(0.7) translateY(20px);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out forwards;
    animation-fill-mode: both;
  }
  
  .animate-slideInRight {
    animation: slideInRight 0.3s ease-out forwards;
  }
  
  .animate-slideOutRight {
    animation: slideOutRight 0.2s ease-in forwards;
  }
  
  .animate-fadeInScale {
    animation: fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .animate-slideInScale {
    animation: slideInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .animate-slideOutScale {
    animation: slideOutScale 0.2s ease-in forwards;
  }
  
  .animate-fadeOut {
    animation: fadeOut 0.2s ease-in forwards;
  }
  
  .animate-shake {
    animation: shake 0.6s ease-in-out;
  }
  
  .animate-pulse-gentle {
    animation: pulse 2s infinite;
  }
`;



function CollaborateContent() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showSaarthi, setShowSaarthi] = useState(false);
    const [showChatWindow, setShowChatWindow] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [characterCount, setCharacterCount] = useState(0);
    const [editorContent, setEditorContent] = useState('');

    // Collaboration modal state
    const [showCollaborateModal, setShowCollaborateModal] = useState(false);
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [collaboratorRole, setCollaboratorRole] = useState('');
    const [collaboratorDescription, setCollaboratorDescription] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    // Tooltip state
    const [hoveredCollaborator, setHoveredCollaborator] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Reply window state
    const [replyWindows, setReplyWindows] = useState({});
    const [replyMessages, setReplyMessages] = useState({});

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Commit Modal States (from edit page)
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [commitMessage, setCommitMessage] = useState('Updated collaboration version with team feedback');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [submissionStage, setSubmissionStage] = useState('');

    // Chat messages state
    const [chatMessages, setChatMessages] = useState([
        {
            type: 'team',
            sender: 'Dr. Raj Patel',
            role: 'Principal Investigator',
            content: 'Welcome everyone! Excited to collaborate on this coal gasification project. Please review the methodology section.',
            time: '2:30 PM'
        },
        {
            type: 'team',
            sender: 'Prof. Michael Chen',
            role: 'Technical Reviewer',
            content: 'The gasification approach looks promising. I suggest we focus on the reactor design specifications in section 3.',
            time: '2:45 PM'
        },
        {
            type: 'ai',
            sender: 'AI Assistant',
            role: 'Collaboration Bot',
            content: 'Based on the current discussion, I recommend reviewing budget allocation for equipment procurement. There might be optimization opportunities.',
            time: '3:00 PM'
        }
    ]);

    // Inline comments state
    const [inlineComments, setInlineComments] = useState([
        {
            id: 1,
            type: 'ai',
            position: { x: 750, y: 280 },
            author: 'AI Assistant',
            content: 'Consider adding specific efficiency metrics here. Current coal plants achieve 35-40%, your target of 60-65% needs justification.',
            timestamp: '2 hours ago',
            resolved: false
        },
        {
            id: 2,
            type: 'reviewer',
            position: { x: 650, y: 420 },
            author: 'Prof. Michael Chen',
            content: 'The carbon capture percentage of 45% seems ambitious. Do you have preliminary studies supporting this figure?',
            timestamp: '1 hour ago',
            resolved: false
        },
        {
            id: 3,
            type: 'reviewer',
            position: { x: 580, y: 580 },
            author: 'Dr. Sarah Kumar',
            content: 'Excellent methodology outline. Consider adding timeline estimates for each testing phase.',
            timestamp: '30 mins ago',
            resolved: false
        }
    ]);

    const [selectedComment, setSelectedComment] = useState(null);

    const [suggestions] = useState([
        {
            id: 1,
            type: 'ai',
            category: 'Technical Enhancement',
            title: 'Optimize Gasification Temperature',
            content: 'Consider implementing variable temperature control (800-1200°C) based on coal grade. This could improve efficiency by 8-12%.',
            confidence: 87,
            author: 'AI Assistant',
            timestamp: '1 hour ago'
        },
        {
            id: 2,
            type: 'reviewer',
            category: 'Budget Optimization',
            title: 'Partnership Opportunity',
            content: 'BHEL has existing gasification infrastructure. A partnership could reduce equipment costs by 20-25% and accelerate development.',
            author: 'Prof. Michael Chen',
            timestamp: '45 mins ago'
        },
        {
            id: 3,
            type: 'ai',
            category: 'Risk Mitigation',
            title: 'Environmental Compliance',
            content: 'Add contingency plans for meeting stricter emission standards. Consider integrating NOx reduction catalysts.',
            confidence: 92,
            author: 'AI Assistant',
            timestamp: '20 mins ago'
        }
    ]);
    // Sample proposal data
    const sampleProposal = {
        id: id || 1,
        title: "Advanced Coal Gasification Technology for Enhanced Energy Production",
        author: "Dr. Raj Patel",
        status: "under_collaborative_review",
        domain: "Coal Technology & Energy Systems",
        budget: 20000000,
        collaborators: [
            { name: "Dr. Raj Patel", role: "Principal Investigator", status: "online", avatar: "RP" },
            { name: "Prof. Michael Chen", role: "Technical Reviewer", status: "online", avatar: "MC" },
            { name: "Dr. Sarah Kumar", role: "Research Coordinator", status: "away", avatar: "SK" },
            { name: "Dr. Priya Sharma", role: "Environmental Specialist", status: "offline", avatar: "PS" }
        ]
    };

    // Initial proposal content
    const initialContent = `
    <h1 style="color: black; text-align: center; font-size: 1.8em; margin-bottom: 1.5em;">Advanced Coal Gasification Technology for Enhanced Energy Production</h1>
    
    <h2 style="color: black; font-weight: bold; font-size: 1.4em; margin: 1.5em 0 1em 0;">1. Problem Statement</h2>
    <p style="color: black; line-height: 1.6; margin-bottom: 1em;">The coal sector faces significant challenges in optimizing energy extraction while minimizing environmental impact. Traditional coal combustion methods result in only 35-40% energy efficiency, with substantial CO2 emissions and particulate matter release. There is an urgent need for innovative gasification technologies that can improve energy output to 60-65% efficiency while reducing harmful emissions by 40-50%.</p>
    
    <p style="color: black; line-height: 1.6; margin-bottom: 1.5em;">Current coal processing facilities in India operate with outdated equipment that struggles to meet environmental compliance standards set by the Ministry of Coal. The lack of advanced gasification infrastructure limits the country's ability to maximize coal utilization for power generation and industrial applications.</p>
    
    <h2 style="color: black; font-weight: bold; font-size: 1.4em; margin: 1.5em 0 1em 0;">2. Research Objectives</h2>
    <p style="color: black; font-weight: bold; margin-bottom: 0.5em;">Primary Objectives:</p>
    <ul style="color: black; line-height: 1.6; margin-bottom: 1em; padding-left: 2em;">
      <li style="margin-bottom: 0.5em;">Develop an integrated coal gasification system achieving 60%+ energy efficiency</li>
      <li style="margin-bottom: 0.5em;">Design carbon capture mechanisms reducing CO2 emissions by 45%</li>
      <li style="margin-bottom: 0.5em;">Create automated monitoring systems for real-time process optimization</li>
      <li style="margin-bottom: 0.5em;">Establish economic viability models for large-scale implementation</li>
    </ul>
    
    <h2 style="color: black; font-weight: bold; font-size: 1.4em; margin: 1.5em 0 1em 0;">3. Methodology & Approach</h2>
    <p style="color: black; font-weight: bold; margin-bottom: 0.5em;">Phase 1: Laboratory Testing (Months 1-8)</p>
    <ul style="color: black; line-height: 1.6; margin-bottom: 1em; padding-left: 2em;">
      <li style="margin-bottom: 0.5em;">Coal characterization using X-ray fluorescence and thermogravimetric analysis</li>
      <li style="margin-bottom: 0.5em;">Gasification reactor design using computational fluid dynamics modeling</li>
      <li style="margin-bottom: 0.5em;">Catalyst development for enhanced reaction efficiency</li>
      <li style="margin-bottom: 0.5em;">Small-scale prototype testing under controlled conditions</li>
    </ul>
    
    <p style="color: black; font-weight: bold; margin-bottom: 0.5em;">Phase 2: Pilot Plant Development (Months 9-18)</p>
    <ul style="color: black; line-height: 1.6; margin-bottom: 1.5em; padding-left: 2em;">
      <li style="margin-bottom: 0.5em;">Construction of pilot-scale gasification facility</li>
      <li style="margin-bottom: 0.5em;">Integration of carbon capture systems</li>
      <li style="margin-bottom: 0.5em;">Performance testing with various coal grades</li>
      <li style="margin-bottom: 0.5em;">Environmental impact assessment and monitoring</li>
    </ul>
  `;

    useEffect(() => {
        const fetchProposal = async () => {
            try {
                if (id) {
                    setLoading(true);
                    // Simulate API call
                    setTimeout(() => {
                        setProposal(sampleProposal);
                        setEditorContent(initialContent);
                        setLoading(false);
                    }, 1000);
                }
            } catch (error) {
                console.error("Error fetching proposal:", error);
                setProposal(sampleProposal);
                setEditorContent(initialContent);
                setLoading(false);
            }
        };

        fetchProposal();
    }, [id]);

    // Handle editor content changes
    const handleEditorContentChange = (content) => {
        setEditorContent(content);
    };

    const handleWordCountChange = (count) => {
        setWordCount(count);
    };

    const handleCharacterCountChange = (count) => {
        setCharacterCount(count);
    };

    // Handle chat message sending
    const handleChatMessageSend = (messageText) => {
        const newMessage = {
            type: 'user',
            sender: user?.name || 'Current User',
            role: user?.role || 'Collaborator',
            content: messageText,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, newMessage]);

        // Simulate team responses
        setTimeout(() => {
            const responses = [
                "Great point! Let me review that section.",
                "I agree with your suggestion. We should implement that change.",
                "Interesting observation. What do you think about the budget implications?",
                "That's exactly what I was thinking. Let's discuss this in detail.",
                "Good catch! I'll update the methodology accordingly."
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const teamMembers = ['Prof. Michael Chen', 'Dr. Sarah Kumar', 'Dr. Priya Sharma'];
            const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];

            const responseMessage = {
                type: 'team',
                sender: randomMember,
                role: 'Team Member',
                content: randomResponse,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };

            setChatMessages(prev => [...prev, responseMessage]);
        }, 1500);
    };

    // Handle modal close with animation (from edit page)
    const handleCloseModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setShowCommitModal(false);
            setIsModalClosing(false);
        }, 300);
    };

    // Handle commit confirmation (from edit page)
    const handleCommitConfirm = async () => {
        if (!commitMessage.trim()) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmissionProgress(0);

            // Simulate submission process
            setSubmissionStage('Validating changes...');
            setSubmissionProgress(20);

            setTimeout(() => {
                setSubmissionStage('Creating new version...');
                setSubmissionProgress(50);
            }, 1000);

            setTimeout(() => {
                setSubmissionStage('Syncing with collaborators...');
                setSubmissionProgress(80);
            }, 2000);

            setTimeout(() => {
                setSubmissionStage('Finalizing...');
                setSubmissionProgress(100);
            }, 3000);

            setTimeout(() => {
                setIsSubmitting(false);
                setSubmissionProgress(0);
                setSubmissionStage('');
                setShowCommitModal(false);
                setCommitMessage('Updated collaboration version with team feedback');

                // Show success modal
                setShowSuccessModal(true);

                // Auto close success modal after 3 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 3000);
            }, 4000);

        } catch (error) {
            console.error('Submission error:', error);
            setIsSubmitting(false);
            setSubmissionProgress(0);
            setSubmissionStage('');
            alert('Error creating new version. Please try again.');
        }
    };

    // Handle saving changes
    const handleSaveChanges = () => {
        setShowCommitModal(true);
    };

    // Handle collaboration invitation
    const handleCollaborateInvite = async () => {
        if (!collaboratorEmail || !collaboratorRole) return;

        setIsInviting(true);
        try {
            // Here you would typically make an API call to send the invitation
            const response = await fetch('/api/invite-collaborator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: collaboratorEmail,
                    role: collaboratorRole,
                    description: collaboratorDescription,
                    proposalId: id,
                    inviteType: 'collaboration',
                    platform: 'NaCCER Research Portal'
                }),
            });

            if (response.ok) {
                alert(`Collaboration invitation sent to ${collaboratorEmail} as ${collaboratorRole}!`);
                setCollaboratorEmail('');
                setCollaboratorRole('');
                setCollaboratorDescription('');
                setShowCollaborateModal(false);
            } else {
                throw new Error('Failed to send invitation');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            alert('Failed to send invitation. Please try again.');
        } finally {
            setIsInviting(false);
        }
    };

    // Handle tooltip positioning
    const handleMouseEnter = (collaborator, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
        setHoveredCollaborator(collaborator);
    };

    const handleMouseLeave = () => {
        setHoveredCollaborator(null);
    };

    // Handle reply windows
    const toggleReplyWindow = (commentId) => {
        setReplyWindows(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
        // Clear any existing message when opening reply window
        if (!replyWindows[commentId]) {
            setReplyMessages(prev => ({
                ...prev,
                [commentId]: ''
            }));
        }
    };

    const handleReplyChange = (commentId, message) => {
        setReplyMessages(prev => ({
            ...prev,
            [commentId]: message
        }));
    };

    const handleReplySubmit = (commentId) => {
        // Handle reply submission logic here
        console.log('Reply submitted for comment', commentId, ':', replyMessages[commentId]);

        // Close reply window and clear message
        setReplyWindows(prev => ({
            ...prev,
            [commentId]: false
        }));
        setReplyMessages(prev => ({
            ...prev,
            [commentId]: ''
        }));
    };

    const handleResolveComment = (commentId) => {
        setInlineComments(prev =>
            prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        resolved: true,
                        resolvedBy: user?.name || 'You',
                        resolvedAt: new Date().toLocaleString()
                    }
                    : comment
            )
        );
        // Close the comment popup after resolving
        setSelectedComment(null);
    };

    if (loading) {
        return <LoadingScreen />;
    };

    if (!proposal) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-black text-xl">Proposal not found</div>
            </div>
        );
    }

    const onlineCollaborators = proposal.collaborators.filter(c => c.status === 'online').length;

    return (
        <>
            <style jsx>{collaborateAnimationStyles}</style>
            <div className="min-h-screen bg-white">
                {/* Distinctive Header Section - Matching create.jsx and edit.jsx */}
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                                        <span className="text-xs text-white font-bold">{onlineCollaborators}</span>
                                    </div>
                                </div>

                                <div className="ml-6">
                                    <div className="flex items-center mb-2">
                                        <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-slideInUp">
                                            Collaborative Workspace
                                        </h1>
                                    </div>
                                    <div className="flex items-center space-x-3 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                                            <span className="text-blue-100 font-semibold text-lg">NaCCER Research Portal</span>
                                        </div>
                                        <div className="h-4 w-px bg-blue-300/50"></div>
                                        <span className="text-blue-200 font-medium text-sm">Team Collaboration</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-blue-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                                        <span>Proposal ID: #{id}</span>
                                        <span>•</span>
                                        <span>Real-time sync active</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            {onlineCollaborators} online
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
                                                <div className="ml-3 px-2 py-0.5 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full flex items-center justify-center border border-green-300/40 backdrop-blur-sm">
                                                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full mr-1.5 animate-pulse"></div>
                                                    <span className="text-white text-xs font-semibold drop-shadow-sm">COLLABORATING</span>
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

                        {/* Collaborator Status */}
                        <div className="flex items-center gap-4 animate-fadeIn">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-blue-800 font-semibold text-sm">{onlineCollaborators} online collaborators</span>
                            </div>

                            {/* Active Collaborators Display */}
                            <div className="flex -space-x-2">
                                {proposal.collaborators.map((collaborator, index) => (
                                    <div key={index} className="relative">
                                        <div
                                            className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-transform hover:scale-110 ${collaborator.role === 'Principal Investigator' ? 'bg-blue-600' :
                                                    collaborator.role === 'Technical Reviewer' ? 'bg-purple-600' :
                                                        collaborator.role === 'Research Coordinator' ? 'bg-green-600' :
                                                            'bg-gray-600'
                                                }`}
                                            onMouseEnter={(e) => handleMouseEnter(collaborator, e)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {collaborator.avatar}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${collaborator.status === 'online' ? 'bg-green-500' :
                                                collaborator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}></div>
                                    </div>
                                ))}

                                {/* Add Collaborator Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCollaborateModal(true)}
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:scale-125 transform hover:shadow-xl hover:shadow-green-500/30 animate-pulse"
                                        title="Add New Collaborator"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-ping"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proposal Information Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            Collaborative Proposal
                        </h2>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <div className="text-orange-600 text-sm font-semibold mb-1">Title</div>
                                <div className="text-black font-semibold">{proposal.title}</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-blue-600 text-sm font-semibold mb-1">Principal Investigator</div>
                                <div className="text-black font-semibold">{proposal.author}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="text-green-600 text-sm font-semibold mb-1">Status</div>
                                <div className="px-3 py-1 rounded-full text-sm font-semibold inline-block bg-blue-100 text-blue-800">
                                    COLLABORATIVE REVIEW
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI & Reviewer Suggestions Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-purple-200 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                        <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="relative">
                                AI & Reviewer Suggestions
                                {/* Notification Badge as Superscript */}
                                <div className="absolute -top-2 -right-4">
                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        <span className="text-white text-xs font-bold">1</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                                </div>
                            </div>
                        </h3>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {suggestions.map((suggestion, index) => (
                                <div key={suggestion.id} className={`p-4 rounded-lg border-l-4 ${suggestion.type === 'ai'
                                        ? 'bg-purple-50 border-purple-500'
                                        : 'bg-blue-50 border-blue-500'
                                    } ${index === 0 ? 'border-l-green-500 bg-green-50' : ''}`}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${index === 0 ? 'bg-green-100 text-green-800' :
                                                suggestion.type === 'ai'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {suggestion.category}
                                        </div>
                                        {index === 0 && (
                                            <div className="px-2 py-0.5 bg-green-200 text-green-900 text-xs font-semibold rounded-full animate-pulse">
                                                LATEST
                                            </div>
                                        )}
                                        {suggestion.confidence && (
                                            <div className="text-xs text-gray-500">
                                                {suggestion.confidence}% confidence
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-black text-sm mb-1">{suggestion.title}</h4>
                                    <p className="text-sm text-gray-500 mb-2">{suggestion.content}</p>
                                    <div className="text-xs text-gray-500">
                                        {suggestion.author} • {suggestion.timestamp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Proposal Editor */}
                    <div className="relative mb-6 animate-slideInUp" style={{ animationDelay: '0.6s' }}>
                        <AdvancedProposalEditor
                            content={editorContent}
                            onChange={handleEditorContentChange}
                            onWordCountChange={handleWordCountChange}
                            onCharacterCountChange={handleCharacterCountChange}
                            isCollaborative={true}
                        />

                        {/* Inline Comments */}
                        {inlineComments.map((comment) => (
                            <div
                                key={comment.id}
                                className="absolute cursor-pointer z-10"
                                style={{ left: comment.position.x, top: comment.position.y }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedComment(selectedComment === comment.id ? null : comment.id);
                                }}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${comment.type === 'ai' ? 'bg-purple-600' : 'bg-blue-600'
                                    } hover:scale-110 transition-transform ${comment.resolved ? 'opacity-30' : ''}`}>
                                    {comment.type === 'ai' ? (
                                        <img
                                            src="/images/AI assistant logo.png"
                                            alt="AI Assistant"
                                            className="w-3 h-3 object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold">
                                            {comment.author.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                                        </span>
                                    )}
                                </div>

                                {selectedComment === comment.id && (
                                    <div
                                        className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {comment.resolved ? (
                                            // Resolved comment display
                                            <div>
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${comment.type === 'ai' ? 'bg-purple-600' : 'bg-blue-600'
                                                        }`}>
                                                        {comment.type === 'ai' ? (
                                                            <img
                                                                src="/images/AI assistant logo.png"
                                                                alt="AI Assistant"
                                                                className="w-4 h-4 object-contain"
                                                            />
                                                        ) : (
                                                            comment.author.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-black text-sm">{comment.author}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${comment.type === 'ai' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {comment.type === 'ai' ? 'AI' : 'Reviewer'}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                                RESOLVED
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">{comment.timestamp}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedComment(null)}
                                                        className="text-gray-500 hover:text-gray-500"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-3">{comment.content}</p>
                                                <div className="text-xs text-gray-500 bg-green-50 p-2 rounded border-l-2 border-green-200">
                                                    Resolved by {comment.resolvedBy || user?.name || 'You'} • {comment.resolvedAt || 'Just now'}
                                                </div>
                                            </div>
                                        ) : (
                                            // Active comment display
                                            <div>
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${comment.type === 'ai' ? 'bg-purple-600' : 'bg-blue-600'
                                                        }`}>
                                                        {comment.type === 'ai' ? (
                                                            <img
                                                                src="/images/AI assistant logo.png"
                                                                alt="AI Assistant"
                                                                className="w-4 h-4 object-contain"
                                                            />
                                                        ) : (
                                                            comment.author.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-black text-sm">{comment.author}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${comment.type === 'ai' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {comment.type === 'ai' ? 'AI' : 'Reviewer'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">{comment.timestamp}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedComment(null)}
                                                        className="text-gray-500 hover:text-gray-500"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-black mb-3">{comment.content}</p>

                                                {/* Reply Window */}
                                                {replyWindows[comment.id] && (
                                                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                                                        <textarea
                                                            value={replyMessages[comment.id] || ''}
                                                            onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                                            placeholder="Type your reply..."
                                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows="3"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => handleReplySubmit(comment.id)}
                                                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg font-semibold"
                                                            >
                                                                Send Reply
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleReplyWindow(comment.id);
                                                                }}
                                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs rounded-lg font-semibold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResolveComment(comment.id);
                                                        }}
                                                        className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs rounded-lg font-semibold"
                                                    >
                                                        Resolve
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleReplyWindow(comment.id);
                                                        }}
                                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs rounded-lg font-semibold"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Save Changes Button - Separate from Editor */}
                    <div className="text-center mb-6">
                        <button
                            onClick={handleSaveChanges}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>

                    {/* Floating Action Buttons - Properly Positioned */}

                    {/* Chat Toggle Button - Top position */}
                    {!showSaarthi && (
                        <div className="fixed bottom-48 right-8 z-30 group">
                            <button
                                onClick={() => setShowChatWindow(!showChatWindow)}
                                className={`w-16 h-16 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:rotate-3 cursor-pointer ${showChatWindow
                                        ? 'bg-blue-700 text-white scale-110 rotate-3'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 pointer-events-none z-[60]">
                                <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-2xl backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span>Team Chat</span>
                                    </div>
                                    <div className="absolute top-full right-4 w-0 h-0 border-t-4 border-t-black/90 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Version History Button - Middle position */}
                    <VersionHistory
                        showVersionHistory={showVersionHistory}
                        setShowVersionHistory={setShowVersionHistory}
                        showSaarthi={showSaarthi}
                    />

                    {/* AI Assistant (Saarthi) - Bottom position */}
                    <Chatbot
                        showSaarthi={showSaarthi}
                        setShowSaarthi={setShowSaarthi}
                        showVersionHistory={showVersionHistory}
                        setShowVersionHistory={setShowVersionHistory}
                    />

                    {/* Chat Window Component */}
                    <ChatWindow
                        showChatWindow={showChatWindow}
                        setShowChatWindow={setShowChatWindow}
                        messages={chatMessages}
                        onSendMessage={handleChatMessageSend}
                    />

                </div>

                {/* Portal-based Tooltip */}
                {hoveredCollaborator && typeof window !== 'undefined' && createPortal(
                    <div
                        className="fixed pointer-events-none transition-opacity duration-200"
                        style={{
                            left: tooltipPosition.x,
                            top: tooltipPosition.y,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 9999999
                        }}
                    >
                        <div className="bg-black/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap shadow-2xl border border-white/20 mb-2">
                            <div className="font-semibold">{hoveredCollaborator.name}</div>
                            <div className="text-xs text-gray-300">{hoveredCollaborator.role}</div>
                            <div className={`text-xs flex items-center gap-1 mt-1 ${hoveredCollaborator.status === 'online' ? 'text-green-300' :
                                    hoveredCollaborator.status === 'away' ? 'text-yellow-300' : 'text-gray-500'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${hoveredCollaborator.status === 'online' ? 'bg-green-400' :
                                        hoveredCollaborator.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                                    }`}></div>
                                {hoveredCollaborator.status}
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-black/95 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Commit Modal (from edit page) */}
                {showCommitModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
                        <div className={`bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 ${isModalClosing ? 'animate-slideOutScale' : 'animate-slideInScale'
                            } ${isShaking ? 'animate-shake' : ''}`}>

                            {isSubmitting ? (
                                <div className="text-center">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-orange-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2">Creating New Version</h3>
                                        <p className="text-gray-500 mb-4">{submissionStage}</p>
                                    </div>

                                    <div className="mb-4">
                                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all duration-500 ease-out"
                                                style={{ width: `${submissionProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">{submissionProgress}%</div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2">Save Collaboration Changes</h3>
                                        <p className="text-gray-500">Create a new version with your changes and notify all collaborators</p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-black mb-2">Version Message</label>
                                        <textarea
                                            value={commitMessage}
                                            onChange={(e) => setCommitMessage(e.target.value)}
                                            className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black resize-none"
                                            rows="3"
                                            placeholder="Describe the changes you made..."
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCloseModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCommitConfirm}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 font-semibold cursor-pointer"
                                        >
                                            Save Version
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeInScale">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-2">Version Saved Successfully!</h3>
                                <p className="text-gray-500 mb-4">Your changes have been saved and all collaborators have been notified.</p>
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-300 cursor-pointer"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collaboration Modal */}
                {showCollaborateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Invite Collaborator</h2>
                                <button
                                    onClick={() => {
                                        setShowCollaborateModal(false);
                                        setCollaboratorEmail('');
                                        setCollaboratorRole('');
                                        setCollaboratorDescription('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="collaboratorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                        Collaborator Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="collaboratorEmail"
                                        value={collaboratorEmail}
                                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isInviting}
                                    />
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label htmlFor="collaboratorRole" className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        id="collaboratorRole"
                                        value={collaboratorRole}
                                        onChange={(e) => setCollaboratorRole(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isInviting}
                                    >
                                        <option value="">Select a role</option>
                                        <option value="Technical Reviewer">Technical Reviewer</option>
                                        <option value="Research Coordinator">Research Coordinator</option>
                                        <option value="Environmental Specialist">Environmental Specialist</option>
                                        <option value="Data Analyst">Data Analyst</option>
                                        <option value="Subject Matter Expert">Subject Matter Expert</option>
                                        <option value="Project Manager">Project Manager</option>
                                        <option value="Quality Assurance">Quality Assurance</option>
                                        <option value="External Reviewer">External Reviewer</option>
                                    </select>
                                </div>

                                {/* Description Field */}
                                <div>
                                    <label htmlFor="collaboratorDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        id="collaboratorDescription"
                                        value={collaboratorDescription}
                                        onChange={(e) => setCollaboratorDescription(e.target.value)}
                                        placeholder="Brief description of their role and responsibilities..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="3"
                                        disabled={isInviting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCollaborateModal(false);
                                        setCollaboratorEmail('');
                                        setCollaboratorRole('');
                                        setCollaboratorDescription('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                                    disabled={isInviting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCollaborateInvite}
                                    disabled={!collaboratorEmail || !collaboratorRole || isInviting}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                >
                                    {isInviting ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Send Invitation
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> An email invitation will be sent to the collaborator with their assigned role and instructions to join this collaborative workspace.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function CollaborateProposal() {
    return (
        <ProtectedRoute>
            <CollaborateContent />
        </ProtectedRoute>
    );
}
