'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import AdvancedProposalEditor from '../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor';
import Chatbot from '../../../components/Saarthi';
import VersionHistory from '../../../components/VersionHistory';
import ChatWindow from '../../../components/ChatWindow';
import { createPortal } from 'react-dom';
import apiClient from '../../../utils/api';
import { 
  getCollaborators, 
  getActiveCollaborators, 
  inviteCollaborator,
  removeCollaborator,
  updateCollaborator 
} from '../../../utils/collaborationApi';
import {
  getComments,
  addComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  markCommentAsRead,
  getChatMessages,
  sendChatMessage,
  inviteCoInvestigator,
  getProposalVersions,
  createVersion
} from '../../../utils/proposalApi';
import {
  initializeSocket,
  joinProposalRoom,
  leaveProposalRoom,
  onNewChatMessage,
  onNewComment,
  onUserJoined,
  onUserLeft,
  offEvent,
  emitChatMessage,
  emitCommentAdded,
  getSocket
} from '../../../utils/socket';

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
    
    // Proposal Info State - matches database schema
    const [proposalInfo, setProposalInfo] = useState({
        title: '',
        code: '',
        fundingMethod: 'S&T of MoC',
        principalAgency: '',
        subAgencies: [],
        projectLeader: '',
        projectCoordinator: '',
        durationMonths: '',
        outlayLakhs: '',
        status: '',
        domain: '',
        createdAt: null,
        ciCount: 0
    });
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    
    // Editor state
    const [editorContent, setEditorContent] = useState('');
    const [signatures, setSignatures] = useState({});
    const autoSaveTimerRef = useRef(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Collaboration state
    const [collaborators, setCollaborators] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [showCollaboratorsList, setShowCollaboratorsList] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [characterCount, setCharacterCount] = useState(0);
    
    // CI Invitation state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    // Version state
    const [versions, setVersions] = useState([]);
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);
    
    // Comments/Suggestions state
    const [comments, setComments] = useState([]);
    const [showCommentsPanel, setShowCommentsPanel] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showResolved, setShowResolved] = useState(false);
    const [replyText, setReplyText] = useState({});
    
    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    
    // Tooltip state
    const [hoveredUser, setHoveredUser] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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

    // Initial proposal content in Plate.js format
    const initialContent = [
        { type: 'h1', children: [{ text: 'Advanced Coal Gasification Technology for Enhanced Energy Production' }] },
        { type: 'p', children: [{ text: '' }] },
        { type: 'h2', children: [{ text: '1. Problem Statement' }] },
        { type: 'p', children: [{ text: 'The coal sector faces significant challenges in optimizing energy extraction while minimizing environmental impact. Traditional coal combustion methods result in only 35-40% energy efficiency, with substantial CO2 emissions and particulate matter release. There is an urgent need for innovative gasification technologies that can improve energy output to 60-65% efficiency while reducing harmful emissions by 40-50%.' }] },
        { type: 'p', children: [{ text: 'Current coal processing facilities in India operate with outdated equipment that struggles to meet environmental compliance standards set by the Ministry of Coal. The lack of advanced gasification infrastructure limits the country\'s ability to maximize coal utilization for power generation and industrial applications.' }] },
        { type: 'h2', children: [{ text: '2. Research Objectives' }] },
        { type: 'p', children: [{ text: 'Primary Objectives:', bold: true }] },
        { type: 'ul', children: [
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Develop an integrated coal gasification system achieving 60%+ energy efficiency' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Design carbon capture mechanisms reducing CO2 emissions by 45%' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Create automated monitoring systems for real-time process optimization' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Establish economic viability models for large-scale implementation' }] }] },
        ]},
        { type: 'h2', children: [{ text: '3. Methodology & Approach' }] },
        { type: 'p', children: [{ text: 'Phase 1: Laboratory Testing (Months 1-8)', bold: true }] },
        { type: 'ul', children: [
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Coal characterization using X-ray fluorescence and thermogravimetric analysis' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Gasification reactor design using computational fluid dynamics modeling' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Catalyst development for enhanced reaction efficiency' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Small-scale prototype testing under controlled conditions' }] }] },
        ]},
        { type: 'p', children: [{ text: 'Phase 2: Pilot Plant Development (Months 9-18)', bold: true }] },
        { type: 'ul', children: [
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Construction of pilot-scale gasification facility' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Integration of carbon capture systems' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Performance testing with various coal grades' }] }] },
            { type: 'li', children: [{ type: 'lic', children: [{ text: 'Environmental impact assessment and monitoring' }] }] },
        ]},
    ];

    // Load collaborators from API
    const loadCollaborators = async () => {
        if (!id) return;
        
        try {
            const response = await getCollaborators(id);
            const data = response.data || response;
            setCollaborators(data.collaborators || []);
            
            // Update proposal info with collaborator count
            setProposalInfo(prev => ({
                ...prev,
                ciCount: data.collaborators?.filter(c => c.role === 'CI').length || 0
            }));
        } catch (error) {
            console.error('Failed to load collaborators:', error);
        }
    };

    // Load comments from API
    const loadComments = async () => {
        if (!id) return;
        
        try {
            const response = await getComments(id);
            const commentsList = response.data?.comments || [];
            setComments(commentsList);
            
            // Calculate unread count
            const unreadComments = commentsList.filter(c => !c.isRead && c.author?._id !== user?._id);
            setUnreadCount(unreadComments.length);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    // Load versions from API
    const loadVersions = async () => {
        if (!id) return;
        
        try {
            const response = await getProposalVersions(id);
            setVersions(response.data?.versions || []);
        } catch (error) {
            console.error('Failed to load versions:', error);
        }
    };

    // Load chat messages from API
    const loadChatMessages = async () => {
        if (!id) return;
        
        try {
            const response = await getChatMessages(id);
            const messages = response.data?.messages || [];
            
            const transformedMessages = messages.map(msg => ({
                id: msg._id,
                sender: msg.sender.fullName,
                role: msg.sender.roles?.[0] || 'USER',
                content: msg.message,
                time: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isCurrentUser: msg.sender._id === user?._id
            }));
            
            setChatMessages(transformedMessages);
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        }
    };

    // Auto-save function (creates x.1 version)
    const handleAutoSave = async () => {
        if (!proposal || !editorContent) return;
        
        try {
            setIsSaving(true);
            
            await createVersion(id, {
                content: editorContent,
                versionMessage: 'Auto-saved',
                isAutoSave: true
            });
            
            setLastSaved(new Date());
            await loadVersions();
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Manual commit function (creates x+1 version with AI evaluation)
    const handleCommitVersion = async () => {
        if (!commitMessage.trim()) {
            alert('Please enter a commit message');
            return;
        }
        
        try {
            setIsCommitting(true);
            
            await createVersion(id, {
                content: editorContent,
                versionMessage: commitMessage,
                isAutoSave: false
            });
            
            setCommitMessage('');
            setShowCommitModal(false);
            await loadVersions();
            alert('Version committed successfully! AI evaluation in progress.');
        } catch (error) {
            console.error('Failed to commit version:', error);
            alert('Failed to commit version: ' + (error.message || 'Unknown error'));
        } finally {
            setIsCommitting(false);
        }
    };

    // Invite co-investigator (max 5 CIs)
    const handleInviteCI = async () => {
        if (!inviteEmail.trim()) {
            alert('Please enter an email address');
            return;
        }
        
        const ciCount = collaborators.filter(c => c.role === 'CI').length;
        if (ciCount >= 5) {
            alert('Maximum 5 co-investigators allowed');
            return;
        }
        
        try {
            setIsInviting(true);
            
            await inviteCoInvestigator(id, inviteEmail);
            
            setInviteEmail('');
            setShowInviteModal(false);
            await loadCollaborators();
            alert('Invitation sent successfully!');
        } catch (error) {
            console.error('Failed to invite CI:', error);
            alert('Failed to send invitation: ' + (error.message || 'Unknown error'));
        } finally {
            setIsInviting(false);
        }
    };

    // Add comment or suggestion
    const handleAddComment = async (content, type = 'COMMENT', formName = null) => {
        if (!content.trim()) return;
        
        try {
            const response = await addComment(id, {
                content,
                type,
                formName,
                isInline: false
            });
            
            await loadComments();
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    // Reply to comment
    const handleReplyToComment = async (commentId, replyContent) => {
        if (!replyContent.trim()) return;
        
        try {
            await replyToComment(id, commentId, { content: replyContent });
            setReplyText(prev => ({ ...prev, [commentId]: '' }));
            await loadComments();
        } catch (error) {
            console.error('Failed to reply to comment:', error);
        }
    };

    // Resolve comment
    const handleResolveComment = async (commentId) => {
        try {
            await resolveComment(id, commentId);
            await loadComments();
        } catch (error) {
            console.error('Failed to resolve comment:', error);
        }
    };

    // Mark comment as read
    const handleMarkCommentAsRead = async (commentId) => {
        try {
            await markCommentAsRead(id, commentId);
            await loadComments();
        } catch (error) {
            console.error('Failed to mark comment as read:', error);
        }
    };

    // Permission check functions
    const isPI = () => {
        if (!proposal || !user) return false;
        const createdById = proposal.createdBy?._id || proposal.createdBy;
        return createdById?.toString() === user._id?.toString();
    };

    const isCI = () => {
        if (!proposal || !user) return false;
        return proposal.coInvestigators?.some(ci => {
            const ciId = ci._id || ci;
            return ciId?.toString() === user._id?.toString();
        });
    };

    const isReviewer = () => {
        return user?.roles?.includes('EXPERT_REVIEWER');
    };

    const isCommitteeMember = () => {
        return user?.roles?.includes('CMPDI_MEMBER') || 
               user?.roles?.includes('TSSRC_MEMBER') || 
               user?.roles?.includes('SSRC_MEMBER');
    };

    const canEdit = () => {
        return isPI() || isCI();
    };

    const canSuggest = () => {
        return isReviewer() || isCommitteeMember();
    };

    const canInviteCI = () => {
        return isPI();
    };
    
    const canEditProposalInfo = () => {
        return isPI(); // Only PI can edit proposal info
    };
    
    // Save proposal info (only PI can do this)
    const handleSaveProposalInfo = async () => {
        if (!canEditProposalInfo()) {
            alert('Only Principal Investigator can edit proposal information');
            return;
        }
        
        try {
            setIsSavingInfo(true);
            
            await apiClient.patch(`/api/proposals/${id}/info`, {
                title: proposalInfo.title,
                fundingMethod: proposalInfo.fundingMethod,
                principalAgency: proposalInfo.principalAgency,
                subAgencies: proposalInfo.subAgencies,
                projectLeader: proposalInfo.projectLeader,
                projectCoordinator: proposalInfo.projectCoordinator,
                durationMonths: proposalInfo.durationMonths,
                outlayLakhs: proposalInfo.outlayLakhs
            });
            
            setIsEditingInfo(false);
            alert('Proposal information updated successfully!');
        } catch (error) {
            console.error('Failed to update proposal info:', error);
            alert('Failed to update proposal information: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSavingInfo(false);
        }
    };

    // Load initial data
    useEffect(() => {
        const loadProposal = async () => {
            try {
                if (id) {
                    console.log('Loading proposal for collaboration:', id);
                    setLoading(true);
                    
                    try {
                        const response = await apiClient.get(`/api/proposals/${id}`);
                        const proposalData = response.data.data || response.data;
                        console.log('✅ Proposal loaded from API:', proposalData.proposalCode, 'Forms:', proposalData.forms ? Object.keys(proposalData.forms) : 'none');
                        console.log('📄 Proposal data structure:', {
                            id: proposalData._id,
                            code: proposalData.proposalCode,
                            title: proposalData.title,
                            formsKeys: proposalData.forms ? Object.keys(proposalData.forms) : 'none',
                            createdBy: proposalData.createdBy,
                            coInvestigators: proposalData.coInvestigators?.length
                        });
                        
                        setProposal(proposalData);
                        
                        // Set proposal info from database fields
                        setProposalInfo({
                            title: proposalData.title || '',
                            code: proposalData.proposalCode || '',
                            fundingMethod: proposalData.fundingMethod || 'S&T of MoC',
                            principalAgency: proposalData.principalAgency || '',
                            subAgencies: proposalData.subAgencies || [],
                            projectLeader: proposalData.projectLeader || '',
                            projectCoordinator: proposalData.projectCoordinator || '',
                            durationMonths: proposalData.durationMonths || '',
                            outlayLakhs: proposalData.outlayLakhs || '',
                            status: proposalData.status || '',
                            domain: proposalData.domain || '',
                            createdAt: proposalData.createdAt,
                            ciCount: proposalData.coInvestigators?.length || 0
                        });
                        
                        console.log('✅ Forms ready for AdvancedProposalEditor:', proposalData.forms ? 'Forms object available' : 'No forms!');
                        
                        // Load collaborators
                        await loadCollaborators();
                        
                        // Load chat messages
                        await loadChatMessages();
                        
                        // Load comments
                        await loadComments();
                        
                        // Load versions
                        await loadVersions();
                    } catch (error) {
                        console.error('❌ Failed to load proposal:', error);
                        console.error('Error details:', error.response?.data || error.message);
                        // Fallback to sample data for demo
                        setProposal(sampleProposal);
                        setEditorContent(initialContent);
                    } finally {
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Error in loadProposal:", error);
                setProposal(sampleProposal);
                setEditorContent(initialContent);
                setLoading(false);
            }
        };

        loadProposal();

        // Initialize Socket.io for real-time collaboration
        if (id) {
            initializeSocket();
            joinProposalRoom(id);
            
            // Listen for new chat messages
            const handleNewChatMessage = (data) => {
                setChatMessages(prev => [...prev, {
                    id: data._id,
                    sender: data.sender?.fullName || 'User',
                    role: data.sender?.roles?.[0] || 'USER',
                    content: data.message,
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    isCurrentUser: data.sender?._id === user?._id
                }]);
            };
            
            // Listen for new comments
            const handleNewComment = (data) => {
                console.log('New comment received:', data);
                loadComments();
            };
            
            // Listen for users joining/leaving
            const handleUserJoined = (data) => {
                console.log('User joined:', data);
                setOnlineUsers(prev => new Set([...prev, data.userId]));
            };
            
            const handleUserLeft = (data) => {
                console.log('User left:', data);
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.userId);
                    return newSet;
                });
            };
            
            // Listen for version updates
            const handleVersionCreated = (data) => {
                console.log('New version created:', data);
                loadVersions();
            };
            
            onNewChatMessage(handleNewChatMessage);
            onNewComment(handleNewComment);
            onUserJoined(handleUserJoined);
            onUserLeft(handleUserLeft);
            
            // Listen to version-created event using socket directly
            const socketInstance = getSocket();
            socketInstance.on('version-created', handleVersionCreated);
            
            return () => {
                leaveProposalRoom(id);
                offEvent('new-chat-message', handleNewChatMessage);
                offEvent('new-comment', handleNewComment);
                offEvent('user-joined', handleUserJoined);
                offEvent('user-left', handleUserLeft);
                socketInstance.off('version-created', handleVersionCreated);
            };
        }
    }, [id, user]);

    // Auto-save timer (saves every 30 seconds if editing is allowed)
    useEffect(() => {
        if (!canEdit() || !editorContent) return;
        
        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
        }
        
        // Set new auto-save timer (30 seconds as per PROMPT.txt)
        autoSaveTimerRef.current = setInterval(() => {
            handleAutoSave();
        }, 30000); // 30 seconds
        
        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [editorContent, canEdit()]);

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
    const handleChatMessageSend = async (messageText) => {
        try {
            // Send message to backend
            const response = await sendChatMessage(id, messageText);
            
            // Emit socket event for real-time update
            emitChatMessage({
                proposalId: id,
                message: response.data?.message
            });
            
            // Reload chat messages
            await loadChatMessages();
        } catch (error) {
            console.error('Failed to send chat message:', error);
        }
        
        // Fallback for UI
        const newMessage = {
            type: 'user',
            sender: user?.fullName || 'Current User',
            role: user?.roles?.[0] || 'USER',
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
            const result = await inviteCollaborator(id, {
                email: collaboratorEmail,
                role: collaboratorRole,
                description: collaboratorDescription
            });

            if (result.success) {
                alert(`✅ Collaboration invitation sent to ${collaboratorEmail}!`);
                setCollaboratorEmail('');
                setCollaboratorRole('');
                setCollaboratorDescription('');
                setShowCollaborateModal(false);
                
                // Reload collaborators
                await loadCollaborators();
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            alert(`❌ Failed to send invitation: ${error.message}`);
        } finally {
            setIsInviting(false);
        }
    };

    // Handle removing a collaborator
    const handleRemoveCollaborator = async (collaboratorId) => {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            await removeCollaborator(id, collaboratorId);
            alert('✅ Collaborator removed successfully');
            await loadCollaborators();
        } catch (error) {
            console.error('Error removing collaborator:', error);
            alert(`❌ Failed to remove collaborator: ${error.message}`);
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

    const handleResolveCommentOld = (commentId) => {
        setInlineComments(prev =>
            prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        resolved: true,
                        resolvedBy: user?.fullName || 'You',
                        resolvedAt: new Date().toLocaleString()
                    }
                    : comment
            )
        );
        // Close the comment popup after resolving
        setSelectedComment(null);
        
        // Call backend API
        handleResolveComment(commentId);
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

    const onlineCollaborators = proposal.collaborators?.filter(c => c.status === 'online').length || 0;

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

                        {/* Collaborators Button */}
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <button
                                onClick={() => setShowCollaboratorsList(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 transition-all cursor-pointer shadow-sm"
                            >
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-gray-900">Collaborators</div>
                                    <div className="text-xs text-gray-600">{collaborators.length} members</div>
                                </div>
                            </button>
                            
                            {/* Add CI Button - Only for PI */}
                            {canInviteCI() && proposalInfo.ciCount < 5 && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    <span className="font-semibold">Invite CI</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Proposal Information Panel */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-black flex items-center">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                Proposal Information
                            </h2>
                            {canEditProposalInfo() && (
                                <div className="flex gap-2">
                                    {isEditingInfo ? (
                                        <>
                                            <button
                                                onClick={handleSaveProposalInfo}
                                                disabled={isSavingInfo}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                                            >
                                                {isSavingInfo ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingInfo(false)}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingInfo(true)}
                                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 text-sm font-semibold transition-all"
                                        >
                                            Edit Info
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Proposal Information Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Title */}
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <div className="text-orange-600 text-sm font-semibold mb-1">Title *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="text"
                                        value={proposalInfo.title}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, title: e.target.value }))}
                                        maxLength={150}
                                        className="w-full px-2 py-1 border border-orange-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.title}</div>
                                )}
                            </div>
                            
                            {/* Proposal Code (Read-only) */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-blue-600 text-sm font-semibold mb-1">Proposal Code</div>
                                <div className="text-black font-semibold font-mono">{proposalInfo.code}</div>
                            </div>
                            
                            {/* Funding Method */}
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <div className="text-purple-600 text-sm font-semibold mb-1">Funding Method *</div>
                                {isEditingInfo ? (
                                    <select
                                        value={proposalInfo.fundingMethod}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, fundingMethod: e.target.value }))}
                                        className="w-full px-2 py-1 border border-purple-300 rounded text-black font-semibold"
                                    >
                                        <option value="S&T of MoC">S&T of MoC</option>
                                        <option value="R&D of CIL">R&D of CIL</option>
                                    </select>
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.fundingMethod}</div>
                                )}
                            </div>
                            
                            {/* Principal Agency */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="text-green-600 text-sm font-semibold mb-1">Principal Agency *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="text"
                                        value={proposalInfo.principalAgency}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, principalAgency: e.target.value }))}
                                        className="w-full px-2 py-1 border border-green-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.principalAgency}</div>
                                )}
                            </div>
                            
                            {/* Duration */}
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <div className="text-yellow-600 text-sm font-semibold mb-1">Duration (Months) *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="number"
                                        value={proposalInfo.durationMonths}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, durationMonths: e.target.value }))}
                                        min="1"
                                        className="w-full px-2 py-1 border border-yellow-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.durationMonths} months</div>
                                )}
                            </div>
                            
                            {/* Outlay */}
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                <div className="text-indigo-600 text-sm font-semibold mb-1">Outlay (Lakhs) *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="number"
                                        value={proposalInfo.outlayLakhs}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, outlayLakhs: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-2 py-1 border border-indigo-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">₹{proposalInfo.outlayLakhs} Lakhs</div>
                                )}
                            </div>
                            
                            {/* Status (Read-only) */}
                            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                                <div className="text-pink-600 text-sm font-semibold mb-1">Status</div>
                                <div className="px-3 py-1 rounded-full text-sm font-semibold inline-block bg-blue-100 text-blue-800">
                                    {proposalInfo.status?.replace('_', ' ')}
                                </div>
                            </div>
                            
                            {/* Project Leader */}
                            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                                <div className="text-teal-600 text-sm font-semibold mb-1">Project Leader *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="text"
                                        value={proposalInfo.projectLeader}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, projectLeader: e.target.value }))}
                                        className="w-full px-2 py-1 border border-teal-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.projectLeader}</div>
                                )}
                            </div>
                            
                            {/* Project Coordinator */}
                            <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                                <div className="text-rose-600 text-sm font-semibold mb-1">Project Coordinator *</div>
                                {isEditingInfo ? (
                                    <input
                                        type="text"
                                        value={proposalInfo.projectCoordinator}
                                        onChange={(e) => setProposalInfo(prev => ({ ...prev, projectCoordinator: e.target.value }))}
                                        className="w-full px-2 py-1 border border-rose-300 rounded text-black font-semibold"
                                    />
                                ) : (
                                    <div className="text-black font-semibold">{proposalInfo.projectCoordinator}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comments & Suggestions Panel */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-black flex items-center">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                </div>
                                Comments & Suggestions
                                {unreadCount > 0 && (
                                    <div className="ml-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{unreadCount}</span>
                                    </div>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowResolved(!showResolved)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {showResolved ? 'Hide Resolved' : 'Show Resolved'}
                                </button>
                                <button
                                    onClick={() => setShowCommentsPanel(!showCommentsPanel)}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {showCommentsPanel ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                        </div>

                        {showCommentsPanel && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {comments
                                    .filter(c => showResolved || !c.isResolved)
                                    .map((comment) => (
                                        <div key={comment._id} className={`p-4 rounded-lg border-l-4 ${
                                            comment.type === 'SUGGESTION' 
                                                ? 'bg-blue-50 border-blue-500' 
                                                : 'bg-purple-50 border-purple-500'
                                        } ${comment.isResolved ? 'opacity-60' : ''}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        comment.type === 'SUGGESTION'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {comment.type}
                                                    </div>
                                                    {!comment.isRead && comment.author?._id !== user?._id && (
                                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    )}
                                                    {comment.isResolved && (
                                                        <div className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                            RESOLVED
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <p className="text-sm text-black mb-2">{comment.content}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-gray-600">
                                                    {comment.author?.fullName} • {comment.author?.roles?.[0] || 'USER'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!comment.isRead && comment.author?._id !== user?._id && (
                                                        <button
                                                            onClick={() => handleMarkCommentAsRead(comment._id)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                        >
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                    {!comment.isResolved && (canEdit() || canSuggest()) && (
                                                        <button
                                                            onClick={() => handleResolveComment(comment._id)}
                                                            className="text-xs text-green-600 hover:text-green-800 font-semibold"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setReplyText(prev => ({ ...prev, [comment._id]: '' }))}
                                                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Reply section */}
                                            {replyText[comment._id] !== undefined && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <textarea
                                                        value={replyText[comment._id]}
                                                        onChange={(e) => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                                        placeholder="Write your reply..."
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                                                        rows="2"
                                                    />
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleReplyToComment(comment._id, replyText[comment._id])}
                                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                                                        >
                                                            Send Reply
                                                        </button>
                                                        <button
                                                            onClick={() => setReplyText(prev => {
                                                                const newState = { ...prev };
                                                                delete newState[comment._id];
                                                                return newState;
                                                            })}
                                                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Display replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-3 pl-4 border-l-2 border-gray-300 space-y-2">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply._id} className="text-sm">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-semibold text-black">{reply.author?.fullName}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(reply.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700">{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {comments.filter(c => showResolved || !c.isResolved).length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No comments or suggestions yet
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add Comment/Suggestion Form - Only for reviewers and committee */}
                        {canSuggest() && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <textarea
                                    placeholder="Add a comment or suggestion..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                                    rows="3"
                                    value={replyText['new'] || ''}
                                    onChange={(e) => setReplyText(prev => ({ ...prev, 'new': e.target.value }))}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            handleAddComment(replyText['new'], 'COMMENT');
                                            setReplyText(prev => ({ ...prev, 'new': '' }));
                                        }}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
                                    >
                                        Add Comment
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAddComment(replyText['new'], 'SUGGESTION');
                                            setReplyText(prev => ({ ...prev, 'new': '' }));
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                                    >
                                        Add Suggestion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Version Control Panel */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-black flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Version Control
                            </h3>
                            <div className="flex items-center gap-3">
                                {/* Auto-save indicator */}
                                {canEdit() && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                        {isSaving ? (
                                            <>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm text-gray-600">Saving...</span>
                                            </>
                                        ) : lastSaved ? (
                                            <>
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm text-gray-600">
                                                    Saved {Math.floor((new Date() - lastSaved) / 60000)}m ago
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <span className="text-sm text-gray-600">Not saved</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                {canEdit() && (
                                    <button
                                        onClick={() => setShowCommitModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg"
                                    >
                                        Commit Version
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Version list */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {versions.slice(0, 5).map((version) => (
                                <div key={version._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                version.isAutoSave 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                v{version.versionNumber}
                                            </div>
                                            {version.isAutoSave && (
                                                <span className="text-xs text-gray-500 italic">Auto-save</span>
                                            )}
                                            {version.aiReport && (
                                                <div className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                                    AI Evaluated
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(version.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-black mb-1">{version.versionMessage}</p>
                                    <div className="text-xs text-gray-600">
                                        By {version.createdBy?.fullName}
                                    </div>
                                </div>
                            ))}
                            {versions.length === 0 && (
                                <div className="text-center py-6 text-gray-500">
                                    No versions yet. Changes are auto-saved every 30 seconds.
                                </div>
                            )}
                            {versions.length > 5 && (
                                <div className="text-center pt-2">
                                    <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                                        View All {versions.length} Versions
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Info Banner */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">
                                    {canEdit() ? 'Collaborative Editing Active' : 'View-Only Mode'}
                                </h4>
                                <p className="text-sm text-blue-700">
                                    {canEdit() && 'Changes are auto-saved every 30 seconds. Use "Commit Version" to create a major version with AI evaluation. '}
                                    {canSuggest() && 'You can add suggestions and comments above. '}
                                    Use the comment button in the editor toolbar for inline comments.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Proposal Editor */}
                    <div className="relative mb-6">
                        <AdvancedProposalEditor
                            proposalId={id}
                            mode="collaborate"
                            initialContent={proposal?.forms || null}
                            onContentChange={handleEditorContentChange}
                            onWordCountChange={handleWordCountChange}
                            onCharacterCountChange={handleCharacterCountChange}
                            proposalTitle={proposal?.title || 'Research Proposal'}
                            showStats={true}
                        />
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

                {/* Portal-based Tooltip for online users */}
                {hoveredUser && typeof window !== 'undefined' && createPortal(
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
                            <div className="font-semibold">{hoveredUser.user.fullName}</div>
                            <div className="text-xs text-gray-300">{hoveredUser.role}</div>
                            <div className="text-xs flex items-center gap-1 mt-1 text-green-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                online
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-black/95 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* CI Invitation Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-2">Invite Co-Investigator</h3>
                                <p className="text-gray-500">
                                    {5 - proposalInfo.ciCount} invitation{5 - proposalInfo.ciCount !== 1 ? 's' : ''} remaining (max 5 CIs)
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-black mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@university.edu"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    disabled={isInviting}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteEmail('');
                                    }}
                                    disabled={isInviting}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInviteCI}
                                    disabled={isInviting || !inviteEmail.trim()}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isInviting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Commit Version Modal */}
                {showCommitModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                            {isCommitting ? (
                                <div className="text-center">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2">Creating Version</h3>
                                        <p className="text-gray-500">Processing your commit and triggering AI evaluation...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2">Commit New Version</h3>
                                        <p className="text-gray-500">
                                            Create a major version with AI evaluation. This will notify all collaborators.
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-black mb-2">Version Message</label>
                                        <textarea
                                            value={commitMessage}
                                            onChange={(e) => setCommitMessage(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black resize-none"
                                            rows="4"
                                            placeholder="Describe the changes in this version..."
                                            disabled={isCommitting}
                                        />
                                    </div>

                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Note:</strong> This will create a major version (x+1) and trigger AI evaluation. 
                                            All collaborators will be notified.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowCommitModal(false);
                                                setCommitMessage('');
                                            }}
                                            disabled={isCommitting}
                                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCommitVersion}
                                            disabled={isCommitting || !commitMessage.trim()}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50"
                                        >
                                            {isCommitting ? 'Committing...' : 'Commit Version'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* CI Invitation Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fadeInScale">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Invite Co-Investigator</h2>
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteEmail('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="collaborator@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={isInviting}
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">About Co-Investigators</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Maximum 5 CIs per proposal</li>
                                                <li>CIs can edit all proposal forms</li>
                                                <li>Email invitation will be sent</li>
                                                <li>Currently {proposalInfo.ciCount} / 5 CIs</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowInviteModal(false);
                                            setInviteEmail('');
                                        }}
                                        disabled={isInviting}
                                        className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInviteCI}
                                        disabled={isInviting || !inviteEmail.trim()}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isInviting ? 'Sending...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* OLD MODALS REMOVED - Now using CI invitation modal and commit version modal */}
                {false && showCollaborateModal && (
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
                                        <option value="principal_investigator">Principal Investigator</option>
                                        <option value="admin">Administrator</option>
                                        <option value="reviewer">Reviewer</option>
                                        <option value="collaborator">Collaborator</option>
                                        <option value="observer">Observer</option>
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

                {/* Collaborators List Modal */}
                {showCollaboratorsList && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    All Collaborators
                                </h2>
                                <button
                                    onClick={() => setShowCollaboratorsList(false)}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold">{activeCollaborators.length}</span> active now • <span className="font-semibold">{collaborators.length + 1}</span> total members
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCollaboratorsList(false);
                                        setShowCollaborateModal(true);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Invite New
                                </button>
                            </div>

                            <div className="space-y-3">
                                {/* Author */}
                                {author && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {(author.user?.name || 'A').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {author.isActiveNow && (
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{author.user?.name}</div>
                                                    <div className="text-sm text-gray-600">{author.user?.email}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                            Principal Investigator
                                                        </span>
                                                        {author.isActiveNow && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                Online
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Collaborators */}
                                {collaborators.map((collab) => {
                                    const getRoleColor = (role) => {
                                        switch(role) {
                                            case 'admin': return 'bg-purple-100 text-purple-800';
                                            case 'reviewer': return 'bg-orange-100 text-orange-800';
                                            case 'collaborator': return 'bg-green-100 text-green-800';
                                            case 'observer': return 'bg-gray-100 text-gray-800';
                                            default: return 'bg-indigo-100 text-indigo-800';
                                        }
                                    };
                                    
                                    const getRoleBgColor = (role) => {
                                        switch(role) {
                                            case 'admin': return 'bg-purple-600';
                                            case 'reviewer': return 'bg-orange-600';
                                            case 'collaborator': return 'bg-green-600';
                                            case 'observer': return 'bg-gray-600';
                                            default: return 'bg-indigo-600';
                                        }
                                    };

                                    return (
                                        <div key={collab._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className={`w-12 h-12 rounded-full ${getRoleBgColor(collab.role)} flex items-center justify-center text-white font-bold text-lg`}>
                                                            {(collab.user?.name || 'C').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        {collab.isActiveNow && (
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{collab.user?.name}</div>
                                                        <div className="text-sm text-gray-600">{collab.user?.email}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(collab.role)}`}>
                                                                {collab.role.replace('_', ' ')}
                                                            </span>
                                                            {collab.isActiveNow && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                    Online
                                                                </span>
                                                            )}
                                                            {collab.status === 'pending' && (
                                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Invited {collab.invitedAt ? new Date(collab.invitedAt).toLocaleDateString() : 'recently'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(user?._id === proposal?.author?._id || user?._id === proposal?.author || author?.user?._id === user?._id) && (
                                                    <button
                                                        onClick={() => handleRemoveCollaborator(collab._id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
