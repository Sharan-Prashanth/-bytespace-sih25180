/**
 * Hocuspocus Server for Real-Time Collaborative Editing
 * 
 * This replaces Socket.io for document collaboration using Yjs CRDT
 * Provides conflict-free real-time synchronization
 */

import { Server } from '@hocuspocus/server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Proposal from '../models/Proposal.js';
import * as Y from 'yjs';

// Store active connections per document
const activeConnections = new Map();

/**
 * Create and configure the Hocuspocus server
 * Note: Hocuspocus v3.x uses `new Server()` constructor instead of `Server.configure()`
 */
export const createHocuspocusServer = () => {
  const server = new Server({
    name: 'naccer-collaboration',
    
    // Debounce for saving to database
    debounce: 5000,
    maxDebounce: 30000,
    
    // Authentication
    async onAuthenticate(data) {
      const { token, documentName } = data;
      
      try {
        if (!token) {
          throw new Error('No authentication token provided');
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (!user || !user.isActive) {
          throw new Error('Invalid or inactive user');
        }
        
        // Extract proposal ID from document name (format: proposal-{id})
        const proposalId = documentName.replace('proposal-', '');
        
        // Verify user has access to this proposal
        const proposal = await Proposal.findOne({
          $or: [
            { _id: proposalId.length === 24 ? proposalId : null },
            { proposalCode: proposalId }
          ]
        });
        
        if (!proposal) {
          throw new Error('Proposal not found');
        }
        
        // Check if user is a collaborator
        const userId = user._id.toString();
        const isCreator = proposal.createdBy?.toString() === userId;
        const isCoInvestigator = proposal.coInvestigators?.some(
          ci => ci._id?.toString() === userId || ci.toString() === userId
        );
        const isAssignedReviewer = proposal.assignedReviewers?.some(
          r => r._id?.toString() === userId || r.toString() === userId
        );
        const isCommitteeMember = user.roles?.some(role => 
          ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'].includes(role)
        );
        const isExpertReviewer = user.roles?.includes('EXPERT_REVIEWER');
        
        const hasAccess = isCreator || isCoInvestigator || isAssignedReviewer || 
                          isCommitteeMember || isExpertReviewer;
        
        if (!hasAccess) {
          throw new Error('Access denied to this proposal');
        }
        
        // Determine user's editing permissions
        const canEdit = isCreator || isCoInvestigator || user.roles?.includes('SUPER_ADMIN');
        const canSuggest = (isExpertReviewer || isCommitteeMember) && !canEdit;
        
        console.log(`[Hocuspocus] User ${user.fullName} authenticated for ${documentName}, canEdit: ${canEdit}, canSuggest: ${canSuggest}`);
        
        // In Hocuspocus v3.x, return the context object directly
        // This will be available as data.context in other hooks
        data.context = {
          user: {
            id: user._id.toString(),
            name: user.fullName,
            email: user.email,
            roles: user.roles,
            canEdit,
            canSuggest
          }
        };
        
        return data.context;
        
      } catch (error) {
        console.error('[Hocuspocus] Authentication error:', error.message);
        throw error;
      }
    },
    
    // When a user connects
    async onConnect(data) {
      const { documentName, context, socketId } = data;
      
      // Safely access user from context (set by onAuthenticate)
      const user = context?.user;
      
      if (!user) {
        console.warn(`[Hocuspocus] User connected without context to ${documentName}`);
        return;
      }
      
      console.log(`[Hocuspocus] User connected: ${user.name} to ${documentName}`);
      
      // Track active connections
      if (!activeConnections.has(documentName)) {
        activeConnections.set(documentName, new Map());
      }
      
      const docConnections = activeConnections.get(documentName);
      docConnections.set(socketId, {
        userId: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        canEdit: user.canEdit,
        connectedAt: Date.now()
      });
      
      console.log(`[Hocuspocus] Active users in ${documentName}: ${docConnections.size}`);
      
      // Broadcast updated user list
      return {
        activeUsers: Array.from(docConnections.values())
      };
    },
    
    // When a user disconnects
    async onDisconnect(data) {
      const { documentName, context, socketId, document } = data;
      
      if (context?.user) {
        console.log(`[Hocuspocus] User disconnected: ${context.user.name} from ${documentName}`);
      }
      
      // Remove from active connections
      const docConnections = activeConnections.get(documentName);
      if (docConnections) {
        docConnections.delete(socketId);
        console.log(`[Hocuspocus] Remaining active users in ${documentName}: ${docConnections.size}`);
        
        // CRITICAL: Save to database only when last user disconnects
        if (docConnections.size === 0) {
          console.log(`[Hocuspocus] Last user disconnected - saving ${documentName} to database`);
          
          // Save final state to database
          if (document) {
            try {
              // Call onStoreDocument to persist
              const proposalId = documentName.replace('proposal-', '');
              const stateUpdate = Y.encodeStateAsUpdate(document);
              
              if (stateUpdate && stateUpdate.length > 0) {
                const yjsState = Buffer.from(stateUpdate).toString('base64');
                
                // Extract content and discussions
                const formContent = document.getMap('formContent');
                const formiContent = formContent.get('formi');
                let parsedContent = null;
                
                if (formiContent) {
                  try {
                    parsedContent = JSON.parse(formiContent);
                  } catch (e) {
                    console.warn('[Hocuspocus] Could not parse formi content');
                  }
                }
                
                const discussionsContent = document.getMap('discussions');
                const formiDiscussions = discussionsContent.get('formi');
                let parsedDiscussions = null;
                
                if (formiDiscussions) {
                  try {
                    parsedDiscussions = JSON.parse(formiDiscussions);
                  } catch (e) {
                    console.warn('[Hocuspocus] Could not parse formi discussions');
                  }
                }
                
                const updateData = {
                  yjsState,
                  'metadata.lastYjsSync': new Date()
                };
                
                if (parsedContent && Array.isArray(parsedContent)) {
                  updateData['formi.editorContent'] = parsedContent;
                  updateData['forms.formI.editorContent'] = parsedContent;
                }
                
                if (parsedDiscussions && Array.isArray(parsedDiscussions)) {
                  updateData['inlineDiscussions.formi.discussions'] = parsedDiscussions;
                  updateData['inlineDiscussions.formi.lastUpdatedAt'] = new Date();
                }
                
                await Proposal.findOneAndUpdate(
                  {
                    $or: [
                      { _id: proposalId.length === 24 ? proposalId : null },
                      { proposalCode: proposalId }
                    ]
                  },
                  { $set: updateData }
                );
                
                console.log(`[Hocuspocus] Successfully saved ${documentName} on last user disconnect`);
              }
            } catch (error) {
              console.error(`[Hocuspocus] Error saving document on disconnect:`, error);
            }
          }
          
          activeConnections.delete(documentName);
          console.log(`[Hocuspocus] Cleaned up ${documentName} - no active users`);
        }
      }
    },
    
    // Load document from database
    async onLoadDocument(data) {
      const { documentName, document } = data;
      const proposalId = documentName.replace('proposal-', '');
      
      try {
        // Find proposal
        const proposal = await Proposal.findOne({
          $or: [
            { _id: proposalId.length === 24 ? proposalId : null },
            { proposalCode: proposalId }
          ]
        });
        
        if (proposal?.yjsState) {
          // Load existing Yjs state
          const state = Buffer.from(proposal.yjsState, 'base64');
          Y.applyUpdate(document, state);
          console.log(`[Hocuspocus] Loaded document state for ${documentName}`);
        } else if (proposal?.formi || proposal?.forms?.formI) {
          // Initialize from existing plate.js content
          const content = proposal.formi?.editorContent || 
                         proposal.forms?.formI?.editorContent ||
                         proposal.formi?.content ||
                         proposal.forms?.formI?.content;
          
          if (content && Array.isArray(content)) {
            const formContent = document.getMap('formContent');
            formContent.set('formi', JSON.stringify(content));
            console.log(`[Hocuspocus] Initialized document from plate.js content for ${documentName}`);
          }
          
          // Also load existing discussions
          const discussions = proposal.inlineDiscussions?.formi?.discussions;
          if (discussions && Array.isArray(discussions)) {
            const discussionsContent = document.getMap('discussions');
            discussionsContent.set('formi', JSON.stringify(discussions));
            console.log(`[Hocuspocus] Loaded ${discussions.length} discussions for ${documentName}`);
          }
        }
        
        return document;
        
      } catch (error) {
        console.error(`[Hocuspocus] Error loading document ${documentName}:`, error);
        return document;
      }
    },
    
    // Save document to database
    async onStoreDocument(data) {
      const { documentName, document } = data;
      const proposalId = documentName.replace('proposal-', '');
      
      try {
        // CRITICAL: Skip save if there are active users - only save on disconnect
        const docConnections = activeConnections.get(documentName);
        if (docConnections && docConnections.size > 0) {
          console.log(`[Hocuspocus] Skipping save for ${documentName} - ${docConnections.size} active users`);
          return;
        }
        
        // In Hocuspocus v3.x, we need to encode the state ourselves
        // The 'state' parameter may be undefined, so use Y.encodeStateAsUpdate
        const stateUpdate = Y.encodeStateAsUpdate(document);
        
        if (!stateUpdate || stateUpdate.length === 0) {
          console.warn(`[Hocuspocus] Empty state for document ${documentName}, skipping save`);
          return;
        }
        
        const yjsState = Buffer.from(stateUpdate).toString('base64');
        
        // Extract the plate.js content for backwards compatibility
        const formContent = document.getMap('formContent');
        const formiContent = formContent.get('formi');
        let parsedContent = null;
        
        if (formiContent) {
          try {
            parsedContent = JSON.parse(formiContent);
          } catch (e) {
            console.warn('[Hocuspocus] Could not parse formi content');
          }
        }
        
        // Extract discussions for persistence
        const discussionsContent = document.getMap('discussions');
        const formiDiscussions = discussionsContent.get('formi');
        let parsedDiscussions = null;
        
        if (formiDiscussions) {
          try {
            parsedDiscussions = JSON.parse(formiDiscussions);
          } catch (e) {
            console.warn('[Hocuspocus] Could not parse formi discussions');
          }
        }
        
        // Update proposal
        const updateData = {
          yjsState,
          'metadata.lastYjsSync': new Date()
        };
        
        // Only update formi content if we have valid parsed content
        if (parsedContent && Array.isArray(parsedContent)) {
          updateData['formi.editorContent'] = parsedContent;
          updateData['forms.formI.editorContent'] = parsedContent;
        }
        
        // Update discussions if available
        if (parsedDiscussions && Array.isArray(parsedDiscussions)) {
          updateData['inlineDiscussions.formi.discussions'] = parsedDiscussions;
          updateData['inlineDiscussions.formi.lastUpdatedAt'] = new Date();
        }
        
        await Proposal.findOneAndUpdate(
          {
            $or: [
              { _id: proposalId.length === 24 ? proposalId : null },
              { proposalCode: proposalId }
            ]
          },
          { $set: updateData }
        );
        
        console.log(`[Hocuspocus] Saved document ${documentName} to database (${stateUpdate.length} bytes)`);
        
      } catch (error) {
        console.error(`[Hocuspocus] Error saving document ${documentName}:`, error);
      }
    },
    
    // Handle changes - disabled verbose logging to prevent spam
    // onChange is called for every Yjs update including cursor movements
    async onChange(data) {
      // Intentionally not logging every change to avoid spam
      // Document saves are logged in onStoreDocument
    }
  });
  
  return server;
};

/**
 * Get active users for a document
 */
export const getActiveUsers = (documentName) => {
  const docConnections = activeConnections.get(documentName);
  if (!docConnections) return [];
  return Array.from(docConnections.values());
};

/**
 * Get all active documents
 */
export const getActiveDocuments = () => {
  return Array.from(activeConnections.keys());
};

export default createHocuspocusServer;
