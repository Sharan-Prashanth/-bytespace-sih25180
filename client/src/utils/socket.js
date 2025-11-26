import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize Socket.io connection
 */
export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket.io connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket.io disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a proposal room
 */
export const joinProposalRoom = (proposalId) => {
  const socketInstance = getSocket();
  socketInstance.emit('join-proposal', proposalId);
};

/**
 * Leave a proposal room
 */
export const leaveProposalRoom = (proposalId) => {
  const socketInstance = getSocket();
  socketInstance.emit('leave-proposal', proposalId);
};

/**
 * Send chat message
 */
export const emitChatMessage = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('chat-message', data);
};

/**
 * Emit comment added
 */
export const emitCommentAdded = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('comment-added', data);
};

/**
 * Emit status changed
 */
export const emitStatusChanged = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('status-changed', data);
};

/**
 * Listen for new chat messages
 */
export const onNewChatMessage = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('new-chat-message', callback);
};

/**
 * Listen for new comments
 */
export const onNewComment = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('new-comment', callback);
};

/**
 * Listen for proposal status updates
 */
export const onProposalStatusUpdated = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('proposal-status-updated', callback);
};

/**
 * Listen for user joined
 */
export const onUserJoined = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('user-joined', callback);
};

/**
 * Listen for user left
 */
export const onUserLeft = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('user-left', callback);
};

/**
 * Remove event listener
 */
export const offEvent = (eventName, callback) => {
  const socketInstance = getSocket();
  if (callback) {
    socketInstance.off(eventName, callback);
  } else {
    socketInstance.off(eventName);
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinProposalRoom,
  leaveProposalRoom,
  emitChatMessage,
  emitCommentAdded,
  emitStatusChanged,
  onNewChatMessage,
  onNewComment,
  onProposalStatusUpdated,
  onUserJoined,
  onUserLeft,
  offEvent
};
