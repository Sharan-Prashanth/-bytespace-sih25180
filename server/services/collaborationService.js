import Proposal from '../models/Proposal.js';
import Version from '../models/Version.js';

/**
 * Collaboration Service using Socket.IO for Presence/Awareness
 * 
 * NOTE: Editor synchronization is now handled by Yjs/Hocuspocus.
 * Socket.IO is used ONLY for:
 * - Room-based presence (who's viewing/editing)
 * - Active user tracking and broadcasting
 * - Cursor positions and selections (awareness)
 * - User activity indicators
 * 
 * Yjs handles:
 * - CRDT-based editor content synchronization
 * - Conflict resolution
 * - Undo/redo across clients
 * - Persistence to MongoDB
 */

// Store active rooms and users
// Structure: { proposalId: { users: Map<socketId, userData>, lastActivity: Date } }
const activeRooms = new Map();

// Store socket to user mapping
const socketUsers = new Map();

/**
 * Initialize Socket.IO collaboration
 */
export function initializeCollaboration(io) {
  console.log('🔌 Initializing Socket.IO collaboration service...');

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      const userName = socket.handshake.auth.userName;
      const userEmail = socket.handshake.auth.userEmail;

      if (!token || !userId) {
        return next(new Error('Authentication required'));
      }

      // Attach user info to socket
      socket.userId = userId;
      socket.userName = userName || 'Anonymous';
      socket.userEmail = userEmail || '';

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.id})`);

    // Store socket-user mapping
    socketUsers.set(socket.id, {
      userId: socket.userId,
      userName: socket.userName,
      userEmail: socket.userEmail,
      connectedAt: new Date()
    });

    /**
     * Join a proposal room
     */
    socket.on('join-proposal', async ({ proposalId }) => {
      try {
        console.log(`👤 ${socket.userName} joining proposal: ${proposalId}`);

        // Verify proposal exists and user has access
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
          socket.emit('error', { message: 'Proposal not found' });
          return;
        }

        // Check authorization (basic check - expand as needed)
        const isAuthor = proposal.author.toString() === socket.userId;
        const isAssignedStaff = proposal.assignedStaff?.some(
          assignment => assignment.user.toString() === socket.userId
        );
        // In real scenario, also check if user is reviewer

        if (!isAuthor && !isAssignedStaff) {
          socket.emit('error', { message: 'Not authorized to access this proposal' });
          return;
        }

        // Join the room
        socket.join(proposalId);
        socket.currentProposal = proposalId;

        // Initialize room if it doesn't exist
        if (!activeRooms.has(proposalId)) {
          activeRooms.set(proposalId, {
            users: new Map(),
            lastActivity: new Date()
          });
        }

        const room = activeRooms.get(proposalId);

        // Add user to room
        room.users.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          color: generateUserColor(socket.userId), // Assign a color for cursor
          joinedAt: new Date()
        });

        room.lastActivity = new Date();

        // Get active users list
        const activeUsers = Array.from(room.users.values()).map(user => ({
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          color: user.color,
          joinedAt: user.joinedAt
        }));

        // Notify user of successful join
        socket.emit('joined-proposal', {
          proposalId,
          activeUsers,
          userCount: activeUsers.length
        });

        // Broadcast to others in the room
        socket.to(proposalId).emit('user-joined', {
          user: {
            userId: socket.userId,
            userName: socket.userName,
            userEmail: socket.userEmail,
            color: room.users.get(socket.id).color
          },
          activeUsers,
          userCount: activeUsers.length
        });

        console.log(`✅ ${socket.userName} joined proposal ${proposalId}. Active users: ${activeUsers.length}`);

      } catch (error) {
        console.error('Error joining proposal:', error);
        socket.emit('error', { message: 'Failed to join proposal' });
      }
    });

    /**
     * Leave a proposal room
     */
    socket.on('leave-proposal', async ({ proposalId }) => {
      await handleLeaveProposal(socket, proposalId, io);
    });

    /**
     * DEPRECATED: Editor updates now handled by Yjs
     * Kept for backward compatibility
     */
    socket.on('editor-update', ({ proposalId, formId, changes, wordCount, characterCount }) => {
      console.warn('⚠️  editor-update event is deprecated. Use Yjs for editor synchronization.');
      // Event kept for backward compatibility but does nothing
      // Yjs handles all editor synchronization automatically
    });

    /**
     * Broadcast cursor position
     */
    socket.on('cursor-position', ({ proposalId, formId, position }) => {
      if (socket.currentProposal !== proposalId) {
        return;
      }

      const room = activeRooms.get(proposalId);
      if (!room) return;

      socket.to(proposalId).emit('cursor-position', {
        formId,
        position,
        user: {
          userId: socket.userId,
          userName: socket.userName,
          color: room.users.get(socket.id)?.color
        }
      });
    });

    /**
     * Broadcast selection changes
     */
    socket.on('selection-change', ({ proposalId, formId, selection }) => {
      if (socket.currentProposal !== proposalId) {
        return;
      }

      const room = activeRooms.get(proposalId);
      if (!room) return;

      socket.to(proposalId).emit('selection-change', {
        formId,
        selection,
        user: {
          userId: socket.userId,
          userName: socket.userName,
          color: room.users.get(socket.id)?.color
        }
      });
    });

    /**
     * DEPRECATED: Sync is now handled by Yjs automatically
     * Kept for backward compatibility
     */
    socket.on('request-sync', async ({ proposalId, formId }) => {
      console.warn('⚠️  request-sync event is deprecated. Yjs handles synchronization automatically.');
      // Yjs automatically syncs all connected clients
      // No manual sync needed
    });

    /**
     * Manual save trigger
     */
    socket.on('manual-save', async ({ proposalId, formId, editorContent, wordCount, characterCount, comment }) => {
      if (socket.currentProposal !== proposalId) {
        return;
      }

      try {
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
          socket.emit('save-error', { message: 'Proposal not found' });
          return;
        }

        // Capture old state
        const oldForm = proposal.getForm(formId);
        const oldData = oldForm ? { ...oldForm.toObject() } : null;

        // Update form
        proposal.updateForm(formId, editorContent, wordCount || 0, characterCount || 0, socket.userId);
        await proposal.save();

        // Create version history
        const newForm = proposal.getForm(formId);
        await Version.createVersion({
          proposalId: proposal._id,
          oldData: oldData,
          newData: newForm ? newForm.toObject() : null,
          changeType: 'form_update',
          affectedForm: formId,
          userId: socket.userId,
          comment: comment || `Manual save by ${socket.userName}`
        });

        // Notify user
        socket.emit('save-success', {
          formId,
          timestamp: new Date(),
          totalWordCount: proposal.totalWordCount,
          totalCharacterCount: proposal.totalCharacterCount
        });

        // Notify others in the room
        socket.to(proposalId).emit('document-saved', {
          formId,
          by: socket.userName,
          timestamp: new Date()
        });

        console.log(`💾 Manual save by ${socket.userName} on form ${formId}`);

      } catch (error) {
        console.error('Error saving:', error);
        socket.emit('save-error', { message: 'Failed to save' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userName} (${socket.id})`);

      // Remove from socket-user mapping
      socketUsers.delete(socket.id);

      // Handle leaving current proposal
      if (socket.currentProposal) {
        await handleLeaveProposal(socket, socket.currentProposal, io);
      }
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userName}:`, error);
    });
  });

  // Cleanup inactive rooms periodically
  setInterval(() => {
    cleanupInactiveRooms();
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✅ Socket.IO collaboration service initialized');
}

/**
 * Handle user leaving a proposal room
 */
async function handleLeaveProposal(socket, proposalId, io) {
  try {
    if (!proposalId) return;

    const room = activeRooms.get(proposalId);
    if (!room) return;

    // Remove user from room
    const userData = room.users.get(socket.id);
    room.users.delete(socket.id);

    // Leave the socket room
    socket.leave(proposalId);

    const remainingUsers = Array.from(room.users.values());

    console.log(`👋 ${socket.userName} left proposal ${proposalId}. Remaining users: ${remainingUsers.length}`);

    // Broadcast to remaining users
    if (remainingUsers.length > 0) {
      io.to(proposalId).emit('user-left', {
        user: {
          userId: socket.userId,
          userName: socket.userName
        },
        activeUsers: remainingUsers.map(u => ({
          userId: u.userId,
          userName: u.userName,
          userEmail: u.userEmail,
          color: u.color,
          joinedAt: u.joinedAt
        })),
        userCount: remainingUsers.length
      });
    }

    // If no users left, trigger auto-save and cleanup
    if (remainingUsers.length === 0) {
      console.log(`💾 Last user left proposal ${proposalId}. Triggering auto-save...`);
      
      // Auto-save asynchronously (don't wait for it)
      autoSaveProposal(proposalId, userData?.userId).catch(err => {
        console.error(`Failed to auto-save proposal ${proposalId}:`, err);
      });

      // Remove room after a delay (in case someone reconnects quickly)
      setTimeout(() => {
        const currentRoom = activeRooms.get(proposalId);
        if (currentRoom && currentRoom.users.size === 0) {
          activeRooms.delete(proposalId);
          console.log(`🗑️  Cleaned up empty room: ${proposalId}`);
        }
      }, 30000); // 30 seconds grace period
    }

  } catch (error) {
    console.error('Error handling leave proposal:', error);
  }
}

/**
 * Auto-save proposal when last user disconnects
 */
async function autoSaveProposal(proposalId, userId) {
  try {
    console.log(`💾 Auto-saving proposal ${proposalId}...`);

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      console.log(`Proposal ${proposalId} not found, skipping auto-save`);
      return;
    }

    // Just ensure it's saved (it might already be saved by auto-save)
    // We're not creating version history here as that's for manual saves
    await proposal.save();

    console.log(`✅ Auto-saved proposal ${proposalId}`);

  } catch (error) {
    console.error(`Error auto-saving proposal ${proposalId}:`, error);
    throw error;
  }
}

/**
 * Cleanup inactive rooms
 */
function cleanupInactiveRooms() {
  const now = new Date();
  const timeout = 60 * 60 * 1000; // 1 hour

  for (const [proposalId, room] of activeRooms.entries()) {
    if (room.users.size === 0 && (now - room.lastActivity) > timeout) {
      activeRooms.delete(proposalId);
      console.log(`🗑️  Cleaned up inactive room: ${proposalId}`);
    }
  }
}

/**
 * Generate a consistent color for a user based on their ID
 */
function generateUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
    '#6C5B7B', '#355C7D', '#F67280', '#C06C84', '#355C7D'
  ];

  // Generate consistent index from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get active users for a proposal (for REST API)
 */
export function getActiveUsers(proposalId) {
  const room = activeRooms.get(proposalId);
  if (!room) {
    return [];
  }

  return Array.from(room.users.values()).map(user => ({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    color: user.color,
    joinedAt: user.joinedAt
  }));
}

/**
 * Get room status (for REST API)
 */
export function getRoomStatus(proposalId) {
  const room = activeRooms.get(proposalId);
  if (!room) {
    return {
      active: false,
      userCount: 0,
      users: []
    };
  }

  return {
    active: true,
    userCount: room.users.size,
    users: Array.from(room.users.values()).map(user => ({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      color: user.color,
      joinedAt: user.joinedAt
    })),
    lastActivity: room.lastActivity
  };
}

/**
 * Get all active rooms (for monitoring)
 */
export function getAllActiveRooms() {
  const rooms = [];
  for (const [proposalId, room] of activeRooms.entries()) {
    rooms.push({
      proposalId,
      userCount: room.users.size,
      lastActivity: room.lastActivity
    });
  }
  return rooms;
}

export default {
  initializeCollaboration,
  getActiveUsers,
  getRoomStatus,
  getAllActiveRooms
};
