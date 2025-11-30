'use client';

import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import { useSocketCollaboration } from '../../../hooks/useSocketCollaboration';
import { getCollaborateStorage } from '../../../utils/collaborateStorage';
import apiClient from '../../../utils/api';

// Import modular collaborate page components
import {
  CollaborateHeader,
  ProposalMetadata,
  CollaborateProposalInformation,
  CommentsSuggestionsPanel,
  CollaboratorsModal,
  OnlineUsersModal,
  SaveChangesModal,
  TogglePanelButtons,
  CollaborativeEditor
} from '../../../components/collaborate-page';

// Lazy load heavy components
const AdvancedProposalEditor = lazy(() =>
  import('../../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor')
);
const VersionHistory = lazy(() => import('../../../components/VersionHistory'));
const ChatWindow = lazy(() => import('../../../components/ChatWindow'));
const Saarthi = lazy(() => import('../../../components/Saarthi'));

// Auto-save interval (30 seconds)
const AUTO_SAVE_INTERVAL = 30000;
// Debounce delay for socket updates (5 seconds)
const SOCKET_UPDATE_DELAY = 5000;


function CollaborateContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [proposalInfo, setProposalInfo] = useState({
    title: '',
    fundingMethod: '',
    principalAgency: '',
    subAgencies: [],
    projectLeader: '',
    projectCoordinator: '',
    durationMonths: '',
    outlayLakhs: ''
  });

  // Collaboration state
  const [collaborators, setCollaborators] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Local storage and sync state
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const storageRef = useRef(null);

  // Modal state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Panel state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [showSaarthi, setShowSaarthi] = useState(false);

  // Initialize socket collaboration hook
  const {
    isConnected,
    connectedUsers,
    sendUpdate,
    updateBatch,
    addComment: socketAddComment,
    resolveComment: socketResolveComment,
    onUpdate,
    onCommentAdded,
    onCommentResolved
  } = useSocketCollaboration({
    proposalId: id,
    formId: 'collaborate-form',
    user: user,
    debounceDelay: SOCKET_UPDATE_DELAY
  });

  // Update online users when socket users change
  useEffect(() => {
    if (connectedUsers && connectedUsers.length > 0) {
      setOnlineUsers(connectedUsers);
    }
  }, [connectedUsers]);

  // Permission checks
  const isPI = useCallback(() => {
    if (!proposal || !user) return false;
    const createdById = proposal.createdBy?._id || proposal.createdBy;
    return createdById?.toString() === user._id?.toString();
  }, [proposal, user]);

  const isCI = useCallback(() => {
    if (!proposal || !user) return false;
    return proposal.coInvestigators?.some(ci => {
      const ciId = ci._id || ci;
      return ciId?.toString() === user._id?.toString();
    });
  }, [proposal, user]);

  const isReviewer = useCallback(() => {
    return user?.roles?.includes('EXPERT_REVIEWER');
  }, [user]);

  const isCommitteeMember = useCallback(() => {
    return user?.roles?.includes('CMPDI_MEMBER') ||
      user?.roles?.includes('TSSRC_MEMBER') ||
      user?.roles?.includes('SSRC_MEMBER');
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    return user?.roles?.includes('SUPER_ADMIN');
  }, [user]);

  // Role-based permissions
  // PI: can edit proposal info (selective fields), add up to 5 CIs, comments, edit, save/create version
  // CI: cannot edit proposal info, cannot add CIs, can comment, edit, save/create version
  // Reviewers/Committee: cannot edit proposal info, cannot add collaborators, comments only, suggestion mode, cannot save
  // Super Admin: can do anything
  
  const canEditProposalInfo = isPI() || isSuperAdmin();
  const canEditEditor = isPI() || isCI() || isSuperAdmin();
  const canResolveComments = isPI() || isCI() || isSuperAdmin();
  const canInviteCI = isPI() || isSuperAdmin();
  const canSaveChanges = isPI() || isCI() || isSuperAdmin();
  const isSuggestionMode = (isReviewer() || isCommitteeMember()) && !isSuperAdmin();
  const currentCICount = collaborators.filter(c => c.role === 'CI').length;

  // Initialize local storage
  useEffect(() => {
    if (id && proposal) {
      storageRef.current = getCollaborateStorage(id);
      storageRef.current.initialize({
        proposal,
        proposalInfo,
        comments,
        version: proposal.currentVersion
      });
    }
  }, [id, proposal]);

  // Save to local storage
  const saveToLocalStorage = useCallback(() => {
    if (storageRef.current && proposal) {
      storageRef.current.save({
        proposal,
        proposalInfo,
        comments,
        version: proposal.currentVersion
      });
      setLastSaved(new Date());
      setIsDirty(false);
    }
  }, [proposal, proposalInfo, comments]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!id || !proposal) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (isDirty) {
        saveToLocalStorage();
        console.log('[AUTO-SAVE] Saved to local storage');
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [id, proposal, isDirty, saveToLocalStorage]);

  // Sync to DB on page unload/navigation
  const syncToDatabase = useCallback(async () => {
    if (!id || !isDirty) return;

    try {
      await apiClient.post(`/api/collaboration/${id}/sync`, {
        proposalInfo,
        createMinorVersion: true
      });
      console.log('[DB SYNC] Synced to database with new minor version');
    } catch (err) {
      console.error('[DB SYNC] Failed to sync:', err);
    }
  }, [id, isDirty, proposalInfo]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        syncToDatabase();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleRouteChange = () => {
      if (isDirty) {
        syncToDatabase();
        saveToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [isDirty, syncToDatabase, saveToLocalStorage, router.events]);

  // Listen for socket updates from other users
  useEffect(() => {
    if (onUpdate) {
      const handleUpdate = (update) => {
        console.log('[SOCKET] Received update:', update);
        if (update.field && update.value !== undefined) {
          setProposalInfo(prev => ({
            ...prev,
            [update.field]: update.value
          }));
          // Save to local storage
          if (storageRef.current) {
            storageRef.current.markDirty();
          }
        }
      };
      // Subscribe to updates
      return onUpdate(handleUpdate);
    }
  }, [onUpdate]);

  // Listen for socket comment events
  useEffect(() => {
    if (onCommentAdded) {
      const handleCommentAdded = (comment) => {
        console.log('[SOCKET] Comment added:', comment);
        // Only add if it's from another user (not the current user)
        // Or if we haven't already added it locally
        setComments(prev => {
          // Check if comment already exists by _id
          if (prev.some(c => c._id === comment._id)) {
            return prev;
          }
          return [comment, ...prev];
        });
      };
      return onCommentAdded(handleCommentAdded);
    }
  }, [onCommentAdded]);

  useEffect(() => {
    if (onCommentResolved) {
      const handleCommentResolved = (data) => {
        console.log('[SOCKET] Comment resolved:', data);
        setComments(prev => prev.map(c =>
          c._id === data.commentId ? { ...c, isResolved: true } : c
        ));
      };
      return onCommentResolved(handleCommentResolved);
    }
  }, [onCommentResolved]);

  // API handlers
  const handleSaveProposalInfo = useCallback((updatedInfo) => {
    setProposalInfo(updatedInfo);
    setIsDirty(true);

    // Send updates via socket to other collaborators
    if (isConnected) {
      const changes = {};
      Object.keys(updatedInfo).forEach(key => {
        if (updatedInfo[key] !== proposalInfo[key]) {
          changes[key] = updatedInfo[key];
        }
      });
      if (Object.keys(changes).length > 0) {
        updateBatch(changes);
      }
    }

    // Save to local storage
    saveToLocalStorage();
  }, [isConnected, proposalInfo, updateBatch, saveToLocalStorage]);

  const handleAddComment = useCallback(async (content, type) => {
    try {
      // Create comment via API
      const response = await apiClient.post(`/api/proposals/${id}/comments`, {
        content,
        type: type || 'COMMENT'
      });

      const newComment = response.data.data || response.data;

      // Add to local state (using functional update to prevent duplicates)
      setComments(prev => {
        // Check if comment already exists
        if (prev.some(c => c._id === newComment._id)) {
          return prev;
        }
        return [newComment, ...prev];
      });
      setIsDirty(true);

      // Notify other collaborators via socket (do NOT add to local state again from socket)
      // Socket is for OTHER users, not the current user who created the comment
      if (isConnected && socketAddComment) {
        socketAddComment({
          ...newComment,
          author: {
            _id: user?._id,
            fullName: user?.fullName
          }
        });
      }
    } catch (err) {
      console.error('[API] Failed to add comment:', err);
      // Fallback: add locally only
      const tempId = `comment-${Date.now()}`;
      const newComment = {
        _id: tempId,
        content,
        type: type || 'COMMENT',
        author: { _id: user?._id, fullName: user?.fullName },
        createdAt: new Date().toISOString(),
        isResolved: false,
        replies: []
      };
      setComments(prev => {
        // Check if comment already exists
        if (prev.some(c => c._id === tempId)) {
          return prev;
        }
        return [newComment, ...prev];
      });
    }
  }, [id, user, isConnected, socketAddComment]);

  const handleReplyToComment = useCallback(async (commentId, replyContent) => {
    try {
      const response = await apiClient.post(`/api/proposals/${id}/comments/${commentId}/reply`, {
        content: replyContent
      });

      const updatedComment = response.data.data || response.data;
      setComments(prev => prev.map(comment =>
        comment._id === commentId ? updatedComment : comment
      ));
      setIsDirty(true);
    } catch (err) {
      console.error('[API] Failed to reply to comment:', err);
      // Fallback: add locally
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [
              ...comment.replies,
              {
                _id: `reply-${Date.now()}`,
                content: replyContent,
                author: { _id: user?._id, fullName: user?.fullName },
                createdAt: new Date().toISOString()
              }
            ]
          };
        }
        return comment;
      }));
    }
  }, [id, user]);

  const handleResolveComment = useCallback(async (commentId) => {
    try {
      await apiClient.put(`/api/proposals/${id}/comments/${commentId}/resolve`);

      setComments(prev => prev.map(comment =>
        comment._id === commentId ? { ...comment, isResolved: true } : comment
      ));
      setIsDirty(true);

      // Notify via socket
      if (isConnected && socketResolveComment) {
        socketResolveComment(commentId);
      }
    } catch (err) {
      console.error('[API] Failed to resolve comment:', err);
      // Fallback: resolve locally
      setComments(prev => prev.map(comment =>
        comment._id === commentId ? { ...comment, isResolved: true } : comment
      ));
    }
  }, [id, isConnected, socketResolveComment]);

  const handleInviteCI = useCallback(async (email) => {
    try {
      const response = await apiClient.post(`/api/collaboration/${id}/invite-ci`, { email });
      const newCI = response.data.data || response.data;

      // Refresh collaborators list
      const collabResponse = await apiClient.get(`/api/collaboration/${id}/collaborators`);
      setCollaborators(collabResponse.data.data || collabResponse.data || []);
    } catch (err) {
      console.error('[API] Failed to invite CI:', err);
      throw err;
    }
  }, [id]);

  const handleRemoveCI = useCallback(async (userId) => {
    try {
      await apiClient.delete(`/api/collaboration/${id}/collaborators/${userId}`);

      // Update local state
      setCollaborators(prev => prev.filter(c => c._id !== userId));
    } catch (err) {
      console.error('[API] Failed to remove CI:', err);
      throw err;
    }
  }, [id]);

  const handleSaveChanges = useCallback(async (versionData) => {
    try {
      // Create new version via API
      const response = await apiClient.post(`/api/proposals/${id}/versions`, {
        commitMessage: versionData.commitMessage
      });

      console.log('[API] New version created:', response.data);

      // Update proposal state with new version
      if (proposal) {
        setProposal(prev => ({
          ...prev,
          currentVersion: versionData.version
        }));
      }

      // Save to local storage as well
      saveToLocalStorage();
      setShowSaveModal(false);
    } catch (err) {
      console.error('[API] Failed to create version:', err);
      // Re-throw to let the modal handle the error
      throw new Error(err.response?.data?.message || 'Failed to create new version');
    }
  }, [id, proposal, saveToLocalStorage]);

  const handleSendChatMessage = useCallback((message) => {
    const newMessage = {
      id: Date.now(),
      sender: user?.fullName || 'Current User',
      role: isPI() ? 'PI' : isCI() ? 'CI' : 'USER',
      content: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true
    };
    setChatMessages(prev => [...prev, newMessage]);
    // TODO: Send via socket when chat socket is implemented
  }, [user, isPI, isCI]);

  // Load real data from API
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check for cached data in local storage first
        const storage = getCollaborateStorage(id);
        const cachedData = storage.getData();

        // Fetch fresh data from API
        const [proposalRes, collaboratorsRes, commentsRes] = await Promise.all([
          apiClient.get(`/api/collaboration/proposals/${id}/collaborate`).catch(err => {
            console.warn('[API] Collaboration endpoint failed, trying proposals:', err);
            return apiClient.get(`/api/proposals/${id}`);
          }),
          apiClient.get(`/api/collaboration/${id}/collaborators`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/api/proposals/${id}/comments`).catch(() => ({ data: { data: [] } }))
        ]);

        const proposalData = proposalRes.data.data || proposalRes.data;
        const collaboratorsData = collaboratorsRes.data.data || collaboratorsRes.data || [];
        const commentsData = commentsRes.data.data || commentsRes.data || [];

        // Set proposal data
        setProposal(proposalData);
        setProposalInfo({
          title: proposalData.title || '',
          fundingMethod: proposalData.fundingMethod || '',
          principalAgency: proposalData.principalAgency || '',
          subAgencies: proposalData.subAgencies || [],
          projectLeader: proposalData.projectLeader || '',
          projectCoordinator: proposalData.projectCoordinator || '',
          durationMonths: proposalData.durationMonths || '',
          outlayLakhs: proposalData.outlayLakhs || ''
        });

        // Build collaborators list from proposal data
        const collabList = [];

        // Add PI (creator)
        if (proposalData.createdBy) {
          const pi = typeof proposalData.createdBy === 'object'
            ? proposalData.createdBy
            : { _id: proposalData.createdBy };
          collabList.push({ ...pi, role: 'PI' });
        }

        // Add CIs
        if (proposalData.coInvestigators) {
          proposalData.coInvestigators.forEach(ci => {
            const ciData = typeof ci === 'object' ? ci : { _id: ci };
            collabList.push({ ...ciData, role: 'CI' });
          });
        }

        // Add collaborators from collaboration endpoint
        if (collaboratorsData.length > 0) {
          collaboratorsData.forEach(collab => {
            if (!collabList.find(c => c._id === collab._id)) {
              collabList.push(collab);
            }
          });
        }

        setCollaborators(collabList);
        setComments(commentsData);

        // Initialize with current user as online
        setOnlineUsers([{
          _id: user?._id,
          fullName: user?.fullName,
          role: 'USER'
        }]);

        // Initialize storage with fresh data
        storage.initialize({
          proposal: proposalData,
          proposalInfo: {
            title: proposalData.title || '',
            fundingMethod: proposalData.fundingMethod || '',
            principalAgency: proposalData.principalAgency || '',
            subAgencies: proposalData.subAgencies || [],
            projectLeader: proposalData.projectLeader || '',
            projectCoordinator: proposalData.projectCoordinator || '',
            durationMonths: proposalData.durationMonths || '',
            outlayLakhs: proposalData.outlayLakhs || ''
          },
          comments: commentsData,
          version: proposalData.currentVersion
        });

      } catch (err) {
        console.error('[API] Failed to load data:', err);
        setError('Failed to load proposal data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-black mb-2">Error Loading Proposal</h1>
          <p className="text-black mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-black text-black rounded-lg hover:bg-black/5 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-black/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-black mb-2">Proposal Not Found</h1>
          <p className="text-black mb-4">The requested proposal could not be loaded.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/5">
      {/* Header */}
      <CollaborateHeader
        proposalCode={proposal.proposalCode}
        onlineCount={onlineUsers.length}
        collaboratorCount={collaborators.length}
        onCollaboratorsClick={() => setShowCollaboratorsModal(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Proposal Code Section */}
        <ProposalMetadata
          proposalCode={proposal.proposalCode}
          status={proposal.status}
          version={proposal.currentVersion}
        />

        {/* Proposal Information */}
        <CollaborateProposalInformation
          proposalInfo={proposalInfo}
          canEdit={canEditProposalInfo}
          onSave={handleSaveProposalInfo}
        />

        {/* Comments & Suggestions Section - Collapsible, above editor */}
        <CommentsSuggestionsPanel
          comments={comments}
          canResolve={canResolveComments}
          onReply={handleReplyToComment}
          onResolve={handleResolveComment}
          onAddComment={handleAddComment}
        />

        {/* Editor Section */}
        <CollaborativeEditor
          canEdit={canEditEditor}
          canComment={isReviewer() || isCommitteeMember()}
          isSuggestionMode={isSuggestionMode}
          onlineUsers={onlineUsers}
          onShowOnlineUsers={() => setShowOnlineUsersModal(true)}
          onSaveChanges={canSaveChanges ? () => setShowSaveModal(true) : undefined}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-black text-sm">Loading editor...</p>
              </div>
            </div>
          }>
            <AdvancedProposalEditor
              proposalId={id}
              canEdit={canEditEditor}
              canSuggest={isSuggestionMode}
            />
          </Suspense>
        </CollaborativeEditor>
      </div>

      {/* Toggle Panel Buttons */}
      <TogglePanelButtons
        showVersionHistory={showVersionHistory}
        setShowVersionHistory={setShowVersionHistory}
        showTeamChat={showTeamChat}
        setShowTeamChat={setShowTeamChat}
        showSaarthi={showSaarthi}
        setShowSaarthi={setShowSaarthi}
      />

      {/* Lazy Loaded Panels */}
      <Suspense fallback={null}>
        {showVersionHistory && (
          <VersionHistory
            proposalId={id}
            currentVersion={proposal?.currentVersion || 0}
            showVersionHistory={showVersionHistory}
            setShowVersionHistory={setShowVersionHistory}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showTeamChat && (
          <ChatWindow
            showChatWindow={showTeamChat}
            setShowChatWindow={setShowTeamChat}
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showSaarthi && (
          <Saarthi
            showSaarthi={showSaarthi}
            setShowSaarthi={setShowSaarthi}
            showVersionHistory={showVersionHistory}
            setShowVersionHistory={setShowVersionHistory}
          />
        )}
      </Suspense>

      {/* Modals */}
      <CollaboratorsModal
        isOpen={showCollaboratorsModal}
        onClose={() => setShowCollaboratorsModal(false)}
        collaborators={collaborators}
        canInvite={canInviteCI}
        currentCICount={currentCICount}
        onInvite={handleInviteCI}
      />

      <OnlineUsersModal
        isOpen={showOnlineUsersModal}
        onClose={() => setShowOnlineUsersModal(false)}
        onlineUsers={onlineUsers}
      />

      <SaveChangesModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveChanges}
        currentVersion={proposal?.currentVersion || 1}
        proposalId={id}
      />
    </div>
  );
}


export default function CollaboratePage() {
  return (
    <ProtectedRoute>
      <CollaborateContent />
    </ProtectedRoute>
  );
}
