/**
 * Collaboration Service - In-Memory State Management Layer
 * 
 * This service acts as an intermediary layer between the frontend and database,
 * managing real-time collaboration state, active users, and proposal data caching.
 * 
 * Key Features:
 * - Room-based collaboration per proposal
 * - Active user tracking with presence detection
 * - In-memory proposal state caching
 * - Optimistic updates with database sync
 * - Auto-save and conflict resolution
 */

import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

class CollaborationService {
  constructor() {
    // Map of proposalId -> Room data
    this.rooms = new Map();
    
    // Map of socketId -> user session data
    this.sessions = new Map();
    
    // Sync queue for database updates
    this.syncQueue = new Map();
    
    // Auto-save timers
    this.autoSaveTimers = new Map();
    
    // Configuration
    this.config = {
      autoSaveInterval: 120000, // 2 minutes
      roomTimeout: 300000, // 5 minutes of inactivity before room cleanup
      maxCacheSize: 100, // Maximum number of rooms to keep in memory
      syncDebounce: 5000 // 5 seconds debounce for DB sync
    };

    console.log('[CollaborationService] Initialized');
  }

  /**
   * Create or get a room for a proposal
   */
  async getOrCreateRoom(proposalId) {
    if (this.rooms.has(proposalId)) {
      const room = this.rooms.get(proposalId);
      room.lastActivity = Date.now();
      return room;
    }

    console.log(`[CollaborationService] Creating new room for proposal: ${proposalId}`);
    
    // Load proposal from database
    const proposal = await this._loadProposalFromDB(proposalId);
    
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const room = {
      proposalId,
      proposalCode: proposal.proposalCode,
      
      // Proposal state (loaded from DB, kept in sync)
      proposalData: this._sanitizeProposalData(proposal),
      
      // Active users in this room
      activeUsers: new Map(), // socketId -> { userId, user, joinedAt, lastActivity }
      
      // Pending changes (not yet saved to DB)
      pendingChanges: {
        forms: {},
        metadata: {},
        lastModified: null,
        modifiedBy: null
      },
      
      // Room metadata
      createdAt: Date.now(),
      lastActivity: Date.now(),
      lastSyncedAt: Date.now(),
      isDirty: false, // Has unsaved changes
      
      // Lock for concurrent updates
      isLocked: false,
      lockOwner: null,
      
      // Version tracking
      currentVersion: proposal.currentVersion || 0.1,
      lastAutoSaveVersion: proposal.currentVersion || 0.1
    };

    this.rooms.set(proposalId, room);
    
    // Start auto-save timer for this room
    this._startAutoSaveTimer(proposalId);
    
    return room;
  }

  /**
   * Add user to a room
   */
  async joinRoom(proposalId, socket, user) {
    const room = await this.getOrCreateRoom(proposalId);
    
    // Check user access permissions
    const hasAccess = await this._checkUserAccess(room.proposalData, user);
    if (!hasAccess) {
      throw new Error('Access denied to this proposal');
    }

    // Add user to room
    const userSession = {
      socketId: socket.id,
      userId: user._id.toString(),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles
      },
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      cursor: null,
      selection: null
    };

    room.activeUsers.set(socket.id, userSession);
    this.sessions.set(socket.id, {
      proposalId,
      userId: user._id.toString(),
      user: userSession.user
    });

    room.lastActivity = Date.now();

    console.log(`[CollaborationService] User ${user.fullName} joined room ${proposalId} (${room.activeUsers.size} active users)`);

    return {
      room,
      userSession,
      activeUsers: this._getActiveUsersList(room)
    };
  }

  /**
   * Remove user from a room
   */
  async leaveRoom(proposalId, socketId) {
    const room = this.rooms.get(proposalId);
    if (!room) return;

    const userSession = room.activeUsers.get(socketId);
    if (userSession) {
      console.log('User left room:', userSession.user.fullName, proposalId);
      room.activeUsers.delete(socketId);
      this.sessions.delete(socketId);
    }

    room.lastActivity = Date.now();

    // If last user is leaving and there are changes, save them
    if (room.activeUsers.size === 0 && room.isDirty) {
      try {
        await this.saveRoomToDatabase(proposalId, { isAutoSave: true });
        console.log('Saved changes before room cleanup:', proposalId);
      } catch (error) {
        console.error('Error saving on room close:', error);
      }
    }

    // If room is empty and has no pending changes, schedule cleanup
    if (room.activeUsers.size === 0 && !room.isDirty) {
      this._scheduleRoomCleanup(proposalId);
    }

    return {
      room,
      activeUsers: this._getActiveUsersList(room)
    };
  }

  /**
   * Convert frontend form ID to database form key
   * Frontend: 'formi', 'formia', 'formix', etc.
   * Database: 'formI', 'formIA', 'formIX', etc.
   */
  _normalizeFormKey(formId) {
    const mapping = {
      'formi': 'formI',
      'formia': 'formIA',
      'formix': 'formIX',
      'formx': 'formX',
      'formxi': 'formXI',
      'formxii': 'formXII'
    };
    return mapping[formId.toLowerCase()] || formId;
  }

  /**
   * Update proposal content in room (forms, metadata)
   * Handles Plate.js editor content for individual forms
   */
  async updateProposalContent(proposalId, updates, userId) {
    const room = this.rooms.get(proposalId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Acquire lock if needed
    if (room.isLocked && room.lockOwner !== userId) {
      throw new Error('Proposal is locked by another user');
    }

    // Handle Plate.js form-specific updates
    if (updates.formId && updates.editorContent !== undefined) {
      // Initialize forms object if not exists
      if (!room.pendingChanges.forms) {
        room.pendingChanges.forms = room.proposalData?.forms || {};
      }

      // Convert frontend formId to database key (e.g., 'formia' -> 'formIA')
      const dbFormKey = this._normalizeFormKey(updates.formId);

      // Update specific form with Plate.js content
      room.pendingChanges.forms[dbFormKey] = {
        ...room.pendingChanges.forms[dbFormKey],
        editorContent: updates.editorContent,
        wordCount: updates.wordCount || 0,
        characterCount: updates.characterCount || 0,
        lastModifiedBy: userId,
        lastModifiedAt: Date.now()
      };

      console.log(`[CollaborationService] Form ${updates.formId} (${dbFormKey}) in proposal ${proposalId} updated by user ${userId}`);
    } 
    // Handle bulk form updates
    else if (updates.forms) {
      room.pendingChanges.forms = {
        ...room.pendingChanges.forms,
        ...updates.forms
      };
    }

    // Handle metadata updates
    if (updates.metadata) {
      room.pendingChanges.metadata = {
        ...room.pendingChanges.metadata,
        ...updates.metadata
      };
    }

    room.pendingChanges.lastModified = Date.now();
    room.pendingChanges.modifiedBy = userId;
    room.isDirty = true;
    room.lastActivity = Date.now();

    // Schedule database sync (debounced)
    this._scheduleDatabaseSync(proposalId);

    return {
      success: true,
      pendingChanges: room.pendingChanges,
      version: room.currentVersion,
      formId: updates.formId
    };
  }

  /**
   * Get current room state (for client)
   */
  getRoomState(proposalId) {
    const room = this.rooms.get(proposalId);
    if (!room) {
      return null;
    }

    return {
      proposalId: room.proposalId,
      proposalCode: room.proposalCode,
      proposalData: this._mergeProposalWithPendingChanges(room),
      activeUsers: this._getActiveUsersList(room),
      currentVersion: room.currentVersion,
      isDirty: room.isDirty,
      lastModified: room.pendingChanges.lastModified,
      modifiedBy: room.pendingChanges.modifiedBy
    };
  }

  /**
   * Force save room state to database
   */
  async saveRoomToDatabase(proposalId, options = {}) {
    const room = this.rooms.get(proposalId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.isDirty && !options.force) {
      console.log(`[CollaborationService] Skipping save for ${proposalId} - no changes`);
      return { success: true, message: 'No changes to save' };
    }

    console.log(`[CollaborationService] Saving room ${proposalId} to database...`);

    try {
      // Find proposal in database
      const proposal = await Proposal.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(proposalId) ? proposalId : null },
          { proposalCode: proposalId }
        ]
      });

      if (!proposal) {
        throw new Error('Proposal not found in database');
      }

      // Apply pending changes
      if (Object.keys(room.pendingChanges.forms).length > 0) {
        proposal.forms = {
          ...proposal.forms,
          ...room.pendingChanges.forms
        };
      }

      if (Object.keys(room.pendingChanges.metadata).length > 0) {
        Object.assign(proposal, room.pendingChanges.metadata);
      }

      // Update version if this is an auto-save
      if (options.isAutoSave) {
        // Increment minor version properly: 1.0 -> 1.1 -> 1.2 ... -> 1.9 -> 1.10 -> 1.11
        const versionStr = String(room.currentVersion);
        const parts = versionStr.split('.');
        const majorVersion = parseInt(parts[0], 10);
        const minorVersion = parseInt(parts[1] || '0', 10);
        const newMinorVersion = minorVersion + 1;
        room.currentVersion = parseFloat(`${majorVersion}.${newMinorVersion}`);
        proposal.currentVersion = room.currentVersion;
      }

      await proposal.save();

      // Clear pending changes
      room.pendingChanges = {
        forms: {},
        metadata: {},
        lastModified: null,
        modifiedBy: null
      };
      room.isDirty = false;
      room.lastSyncedAt = Date.now();

      // Update room's proposal data
      room.proposalData = this._sanitizeProposalData(proposal);

      console.log(`[CollaborationService] Room ${proposalId} saved to database (version ${room.currentVersion})`);

      return {
        success: true,
        version: room.currentVersion,
        syncedAt: room.lastSyncedAt
      };

    } catch (error) {
      console.error(`[CollaborationService] Error saving room ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Create a major version (commit)
   */
  async createMajorVersion(proposalId, commitMessage, userId) {
    const room = this.rooms.get(proposalId);
    if (!room) {
      throw new Error('Room not found');
    }

    // First, save any pending changes
    if (room.isDirty) {
      await this.saveRoomToDatabase(proposalId);
    }

    // Load fresh proposal from DB
    const proposal = await this._loadProposalFromDB(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Increment major version
    const newVersion = Math.floor(room.currentVersion) + 1;

    // Create version snapshot
    const version = await ProposalVersion.create({
      proposalId: proposal._id,
      versionNumber: newVersion,
      commitMessage: commitMessage || `Version ${newVersion}`,
      forms: proposal.forms,
      proposalInfo: {
        title: proposal.title,
        fundingMethod: proposal.fundingMethod,
        principalAgency: proposal.principalAgency,
        subAgencies: proposal.subAgencies,
        projectLeader: proposal.projectLeader,
        projectCoordinator: proposal.projectCoordinator,
        durationMonths: proposal.durationMonths,
        outlayLakhs: proposal.outlayLakhs
      },
      createdBy: userId
    });

    // Update proposal version
    proposal.currentVersion = newVersion;
    await proposal.save();

    // Update room state
    room.currentVersion = newVersion;
    room.lastAutoSaveVersion = newVersion;
    room.proposalData = this._sanitizeProposalData(proposal);

    console.log(`📝 Major version ${newVersion} created for proposal ${proposalId}`);

    return {
      success: true,
      version: version,
      newVersionNumber: newVersion
    };
  }

  /**
   * Get all active rooms (for monitoring)
   */
  getActiveRooms() {
    const rooms = [];
    for (const [proposalId, room] of this.rooms.entries()) {
      rooms.push({
        proposalId,
        proposalCode: room.proposalCode,
        activeUsers: room.activeUsers.size,
        isDirty: room.isDirty,
        lastActivity: room.lastActivity,
        currentVersion: room.currentVersion
      });
    }
    return rooms;
  }

  /**
   * Cleanup inactive rooms
   */
  cleanupInactiveRooms() {
    const now = Date.now();
    const timeout = this.config.roomTimeout;

    for (const [proposalId, room] of this.rooms.entries()) {
      if (room.activeUsers.size === 0 && 
          (now - room.lastActivity) > timeout && 
          !room.isDirty) {
        console.log(`🧹 Cleaning up inactive room: ${proposalId}`);
        this._clearRoom(proposalId);
      }
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Load proposal from database
   */
  async _loadProposalFromDB(proposalId) {
    try {
      const proposal = await Proposal.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24 ? proposalId : null },
          { proposalCode: proposalId }
        ]
      })
      .populate('createdBy', 'fullName email roles')
      .populate('coInvestigators', 'fullName email roles')
      .lean();

      return proposal;
    } catch (error) {
      console.error(`Error loading proposal ${proposalId}:`, error);
      return null;
    }
  }

  /**
   * Sanitize proposal data for room storage
   */
  _sanitizeProposalData(proposal) {
    return {
      _id: proposal._id,
      proposalCode: proposal.proposalCode,
      title: proposal.title,
      status: proposal.status,
      fundingMethod: proposal.fundingMethod,
      principalAgency: proposal.principalAgency,
      subAgencies: proposal.subAgencies,
      projectLeader: proposal.projectLeader,
      projectCoordinator: proposal.projectCoordinator,
      durationMonths: proposal.durationMonths,
      outlayLakhs: proposal.outlayLakhs,
      forms: proposal.forms || {},
      createdBy: proposal.createdBy,
      coInvestigators: proposal.coInvestigators || [],
      collaborators: proposal.collaborators || [],
      currentVersion: proposal.currentVersion,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt
    };
  }

  /**
   * Merge proposal data with pending changes
   */
  _mergeProposalWithPendingChanges(room) {
    const merged = { ...room.proposalData };

    if (room.pendingChanges.forms && Object.keys(room.pendingChanges.forms).length > 0) {
      merged.forms = {
        ...merged.forms,
        ...room.pendingChanges.forms
      };
    }

    if (room.pendingChanges.metadata && Object.keys(room.pendingChanges.metadata).length > 0) {
      Object.assign(merged, room.pendingChanges.metadata);
    }

    return merged;
  }

  /**
   * Check if user has access to proposal
   */
  async _checkUserAccess(proposalData, user) {
    const userId = user._id.toString();
    
    // PI check
    if (proposalData.createdBy && 
        (proposalData.createdBy._id?.toString() === userId || 
         proposalData.createdBy.toString() === userId)) {
      return true;
    }

    // CI check
    if (proposalData.coInvestigators?.some(ci => 
      (ci._id?.toString() === userId || ci.toString() === userId))) {
      return true;
    }

    // Collaborator check
    if (proposalData.collaborators?.some(collab => 
      (collab.userId?._id?.toString() === userId || 
       collab.userId?.toString() === userId))) {
      return true;
    }

    // Admin/Committee check
    if (user.roles?.includes('SUPER_ADMIN') ||
        user.roles?.some(role => ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role))) {
      return true;
    }

    return false;
  }

  /**
   * Get list of active users in room
   */
  _getActiveUsersList(room) {
    const users = [];
    for (const [socketId, session] of room.activeUsers.entries()) {
      users.push({
        socketId,
        userId: session.userId,
        user: session.user,
        joinedAt: session.joinedAt,
        lastActivity: session.lastActivity
      });
    }
    return users;
  }

  /**
   * Start auto-save timer for a room
   */
  _startAutoSaveTimer(proposalId) {
    // Clear existing timer
    if (this.autoSaveTimers.has(proposalId)) {
      clearInterval(this.autoSaveTimers.get(proposalId));
    }

    const timer = setInterval(async () => {
      const room = this.rooms.get(proposalId);
      if (!room) {
        clearInterval(timer);
        this.autoSaveTimers.delete(proposalId);
        return;
      }

      // Only auto-save if there are changes and active users
      if (room.isDirty && room.activeUsers.size > 0) {
        try {
          await this.saveRoomToDatabase(proposalId, { isAutoSave: true });
          console.log(`[CollaborationService] Auto-saved proposal ${proposalId}`);
        } catch (error) {
          console.error(`Error auto-saving proposal ${proposalId}:`, error);
        }
      }
    }, this.config.autoSaveInterval);

    this.autoSaveTimers.set(proposalId, timer);
  }

  /**
   * Schedule database sync (debounced)
   * This is just for marking the room as dirty, actual save happens via auto-save
   */
  _scheduleDatabaseSync(proposalId) {
    // Just mark as dirty, don't actually save
    // Auto-save will handle the actual database sync every 2 minutes
    const room = this.rooms.get(proposalId);
    if (room) {
      room.isDirty = true;
      room.lastActivity = Date.now();
    }
  }

  /**
   * Schedule room cleanup
   */
  _scheduleRoomCleanup(proposalId) {
    setTimeout(() => {
      const room = this.rooms.get(proposalId);
      if (room && room.activeUsers.size === 0 && !room.isDirty) {
        this._clearRoom(proposalId);
      }
    }, this.config.roomTimeout);
  }

  /**
   * Clear room and free memory
   */
  _clearRoom(proposalId) {
    // Clear auto-save timer
    if (this.autoSaveTimers.has(proposalId)) {
      clearInterval(this.autoSaveTimers.get(proposalId));
      this.autoSaveTimers.delete(proposalId);
    }

    // Clear sync queue
    if (this.syncQueue.has(proposalId)) {
      clearTimeout(this.syncQueue.get(proposalId));
      this.syncQueue.delete(proposalId);
    }

    // Remove room
    this.rooms.delete(proposalId);
    console.log(`🗑️ Room ${proposalId} cleared from memory`);
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('🔄 Shutting down Collaboration Service...');

    // Save all dirty rooms
    for (const [proposalId, room] of this.rooms.entries()) {
      if (room.isDirty) {
        try {
          await this.saveRoomToDatabase(proposalId, { force: true });
          console.log(`💾 Saved room ${proposalId} before shutdown`);
        } catch (error) {
          console.error(`Error saving room ${proposalId} during shutdown:`, error);
        }
      }
    }

    // Clear all timers
    for (const timer of this.autoSaveTimers.values()) {
      clearInterval(timer);
    }
    for (const timeout of this.syncQueue.values()) {
      clearTimeout(timeout);
    }

    // Clear all data
    this.rooms.clear();
    this.sessions.clear();
    this.autoSaveTimers.clear();
    this.syncQueue.clear();

    console.log('✅ Collaboration Service shutdown complete');
  }
}

// Singleton instance
const collaborationService = new CollaborationService();

// Cleanup inactive rooms every 5 minutes
setInterval(() => {
  collaborationService.cleanupInactiveRooms();
}, 300000);

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await collaborationService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await collaborationService.shutdown();
  process.exit(0);
});

export default collaborationService;
