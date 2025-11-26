/**
 * Socket.io Collaboration Handler
 * 
 * Handles all real-time collaboration events and integrates with CollaborationService
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import collaborationService from '../services/collaborationService.js';

/**
 * Authenticate socket connection
 */
const authenticateSocket = async (socket) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      throw new Error('Invalid or inactive user');
    }

    return user;
  } catch (error) {
    console.error('Socket authentication error:', error);
    throw error;
  }
};

/**
 * Initialize collaboration socket handlers
 */
export const initializeCollaborationSockets = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user.fullName})`);

    /**
     * Join a proposal collaboration room
     */
    socket.on('join-proposal-room', async (data, callback) => {
      try {
        const { proposalId } = data;
        console.log(`📥 User ${socket.user.fullName} joining room: ${proposalId}`);

        // Join room via collaboration service
        const result = await collaborationService.joinRoom(
          proposalId,
          socket,
          socket.user
        );

        // Join Socket.io room
        socket.join(`proposal-${proposalId}`);

        // Send room state to joining user
        const roomState = collaborationService.getRoomState(proposalId);

        // Notify others in the room
        socket.to(`proposal-${proposalId}`).emit('user-joined', {
          user: {
            socketId: socket.id,
            userId: socket.user._id,
            fullName: socket.user.fullName,
            email: socket.user.email
          },
          activeUsers: result.activeUsers,
          timestamp: Date.now()
        });

        // Send success response to joining user
        if (callback) {
          callback({
            success: true,
            roomState,
            activeUsers: result.activeUsers
          });
        }

        console.log(`✅ User ${socket.user.fullName} joined room ${proposalId} (${result.activeUsers.length} active users)`);

      } catch (error) {
        console.error('Error joining room:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Leave a proposal collaboration room
     */
    socket.on('leave-proposal-room', async (data, callback) => {
      try {
        const { proposalId } = data;
        console.log(`📤 User ${socket.user.fullName} leaving room: ${proposalId}`);

        // Leave room via collaboration service
        const result = await collaborationService.leaveRoom(proposalId, socket.id);

        // Leave Socket.io room
        socket.leave(`proposal-${proposalId}`);

        // Notify others in the room
        socket.to(`proposal-${proposalId}`).emit('user-left', {
          user: {
            socketId: socket.id,
            userId: socket.user._id,
            fullName: socket.user.fullName
          },
          activeUsers: result.activeUsers,
          timestamp: Date.now()
        });

        if (callback) {
          callback({ success: true });
        }

      } catch (error) {
        console.error('Error leaving room:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Update proposal content (forms, metadata)
     */
    socket.on('update-proposal-content', async (data, callback) => {
      try {
        const { proposalId, updates } = data;
        console.log(`✏️ User ${socket.user.fullName} updating proposal: ${proposalId}`);

        // Update via collaboration service
        const result = await collaborationService.updateProposalContent(
          proposalId,
          updates,
          socket.user._id.toString()
        );

        // Get updated room state
        const roomState = collaborationService.getRoomState(proposalId);

        // Broadcast update to all users in room (including sender)
        io.to(`proposal-${proposalId}`).emit('proposal-content-updated', {
          proposalId,
          updates,
          updatedBy: {
            userId: socket.user._id,
            fullName: socket.user.fullName
          },
          roomState,
          timestamp: Date.now()
        });

        if (callback) {
          callback({
            success: true,
            result,
            roomState
          });
        }

      } catch (error) {
        console.error('Error updating proposal content:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Update Plate.js form content (real-time editor updates)
     * This is optimized for frequent editor changes
     */
    socket.on('update-form-content', async (data, callback) => {
      try {
        const { proposalId, formId, editorContent, wordCount, characterCount } = data;

        // Update via collaboration service
        const result = await collaborationService.updateProposalContent(
          proposalId,
          { formId, editorContent, wordCount, characterCount },
          socket.user._id.toString()
        );

        // Broadcast update to OTHER users in room (don't echo back to sender)
        socket.to(`proposal-${proposalId}`).emit('form-content-updated', {
          proposalId,
          formId,
          editorContent,
          wordCount,
          characterCount,
          updatedBy: {
            userId: socket.user._id,
            fullName: socket.user.fullName
          },
          timestamp: Date.now()
        });

        if (callback) {
          callback({
            success: true,
            formId
          });
        }

      } catch (error) {
        console.error('Error updating form content:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Request current room state
     */
    socket.on('get-room-state', async (data, callback) => {
      try {
        const { proposalId } = data;
        const roomState = collaborationService.getRoomState(proposalId);

        if (!roomState) {
          throw new Error('Room not found');
        }

        if (callback) {
          callback({
            success: true,
            roomState
          });
        }

      } catch (error) {
        console.error('Error getting room state:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Force save room to database
     */
    socket.on('save-proposal', async (data, callback) => {
      try {
        const { proposalId } = data;
        console.log(`💾 User ${socket.user.fullName} requested save for: ${proposalId}`);

        const result = await collaborationService.saveRoomToDatabase(proposalId, { force: true });

        // Get updated room state
        const roomState = collaborationService.getRoomState(proposalId);

        // Notify all users in room
        io.to(`proposal-${proposalId}`).emit('proposal-saved', {
          proposalId,
          result,
          roomState,
          timestamp: Date.now()
        });

        if (callback) {
          callback({
            success: true,
            result,
            roomState
          });
        }

      } catch (error) {
        console.error('Error saving proposal:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Create major version (commit)
     */
    socket.on('create-version', async (data, callback) => {
      try {
        const { proposalId, commitMessage } = data;
        console.log(`📝 User ${socket.user.fullName} creating version for: ${proposalId}`);

        const result = await collaborationService.createMajorVersion(
          proposalId,
          commitMessage,
          socket.user._id
        );

        // Get updated room state
        const roomState = collaborationService.getRoomState(proposalId);

        // Notify all users in room
        io.to(`proposal-${proposalId}`).emit('version-created', {
          proposalId,
          version: result.version,
          versionNumber: result.newVersionNumber,
          createdBy: {
            userId: socket.user._id,
            fullName: socket.user.fullName
          },
          roomState,
          timestamp: Date.now()
        });

        if (callback) {
          callback({
            success: true,
            result,
            roomState
          });
        }

      } catch (error) {
        console.error('Error creating version:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Send chat message
     */
    socket.on('send-chat-message', async (data, callback) => {
      try {
        const { proposalId, message } = data;

        // Broadcast to all users in room
        io.to(`proposal-${proposalId}`).emit('new-chat-message', {
          proposalId,
          message,
          sender: {
            userId: socket.user._id,
            fullName: socket.user.fullName,
            email: socket.user.email
          },
          timestamp: Date.now()
        });

        if (callback) {
          callback({ success: true });
        }

      } catch (error) {
        console.error('Error sending chat message:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Add comment/suggestion
     */
    socket.on('add-comment', async (data, callback) => {
      try {
        const { proposalId, comment } = data;

        // Broadcast to all users in room
        io.to(`proposal-${proposalId}`).emit('new-comment', {
          proposalId,
          comment,
          author: {
            userId: socket.user._id,
            fullName: socket.user.fullName,
            email: socket.user.email
          },
          timestamp: Date.now()
        });

        if (callback) {
          callback({ success: true });
        }

      } catch (error) {
        console.error('Error adding comment:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    /**
     * Update user cursor/selection (for collaborative editing awareness)
     */
    socket.on('update-cursor', async (data) => {
      try {
        const { proposalId, cursor, selection } = data;

        // Update cursor in session
        const session = collaborationService.sessions.get(socket.id);
        if (session) {
          const room = collaborationService.rooms.get(proposalId);
          if (room) {
            const userSession = room.activeUsers.get(socket.id);
            if (userSession) {
              userSession.cursor = cursor;
              userSession.selection = selection;
              userSession.lastActivity = Date.now();
            }
          }
        }

        // Broadcast cursor position to others (not to self)
        socket.to(`proposal-${proposalId}`).emit('cursor-updated', {
          userId: socket.user._id,
          socketId: socket.id,
          fullName: socket.user.fullName,
          cursor,
          selection,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Error updating cursor:', error);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.user.fullName})`);

      // Get user's session
      const session = collaborationService.sessions.get(socket.id);
      if (session) {
        const { proposalId } = session;

        try {
          // Leave room
          const result = await collaborationService.leaveRoom(proposalId, socket.id);

          // Notify others
          socket.to(`proposal-${proposalId}`).emit('user-left', {
            user: {
              socketId: socket.id,
              userId: session.userId,
              fullName: session.user.fullName
            },
            activeUsers: result.activeUsers,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });

    /**
     * Ping/pong for keeping connection alive and tracking activity
     */
    socket.on('ping', (data, callback) => {
      const { proposalId } = data;
      const session = collaborationService.sessions.get(socket.id);
      
      if (session && proposalId) {
        const room = collaborationService.rooms.get(proposalId);
        if (room) {
          const userSession = room.activeUsers.get(socket.id);
          if (userSession) {
            userSession.lastActivity = Date.now();
          }
        }
      }

      if (callback) {
        callback({ success: true, timestamp: Date.now() });
      }
    });
  });

  console.log('✅ Collaboration socket handlers initialized');
};

export default initializeCollaborationSockets;
