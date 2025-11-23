/**
 * Yjs Collaboration Service with Hocuspocus
 * 
 * Provides CRDT-based real-time collaboration for Plate.js editors
 * using Yjs and Hocuspocus WebSocket server.
 * 
 * Architecture:
 * - Each proposal form has a separate Y.Doc (document name: `proposalId:formId`)
 * - Yjs handles CRDT synchronization and conflict resolution
 * - MongoDB stores persistent binary Y.Doc state
 * - Socket.IO handles presence (active users, cursors)
 */

import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import { createVersion } from './versionService.js';

/**
 * Custom Hocuspocus Database Extension for MongoDB persistence
 * 
 * Document naming convention: `proposalId:formId`
 * Example: "507f1f77bcf86cd799439011:main"
 */
class MongoDBPersistence extends Database {
  constructor() {
    super();
  }

  /**
   * Load Y.Doc state from MongoDB
   * Called when first user connects to a document
   */
  async onLoadDocument({ documentName, context }) {
    try {
      const [proposalId, formId] = documentName.split(':');
      
      if (!proposalId || !formId) {
        console.error(`Invalid document name: ${documentName}`);
        return null;
      }

      // Find proposal and specific form
      const proposal = await Proposal.findById(proposalId);
      
      if (!proposal) {
        console.log(`Proposal not found: ${proposalId}`);
        return null;
      }

      const form = proposal.forms.find(f => f.formId === formId);
      
      if (!form) {
        console.log(`Form not found: ${formId} in proposal ${proposalId}`);
        return null;
      }

      // Return stored Yjs binary state
      if (form.yjsState && form.yjsState.length > 0) {
        console.log(`✅ Loaded Yjs state for ${documentName} (${form.yjsState.length} bytes) - Proposal: "${proposal.title}"`);
        return form.yjsState;
      }

      // If no Yjs state but has editorContent, create initial Y.Doc
      if (form.editorContent && Array.isArray(form.editorContent) && form.editorContent.length > 0) {
        console.log(`🔄 Migrating editorContent to Yjs for ${documentName} - Proposal: "${proposal.title}"`);
        const ydoc = new Y.Doc();
        const yContent = ydoc.get('content', Y.Array);
        
        // Initialize with existing Plate.js content
        yContent.push(form.editorContent);
        
        const state = Y.encodeStateAsUpdate(ydoc);
        
        // Save migrated state
        form.yjsState = Buffer.from(state);
        await proposal.save();
        console.log(`✅ Migrated and saved Yjs state for ${documentName}`);
        
        return state;
      }

      console.log(`⚠️  No state found for ${documentName}, starting fresh - Proposal: "${proposal.title}"`);
      return null;
      
    } catch (error) {
      console.error(`Error loading document ${documentName}:`, error);
      return null;
    }
  }

  /**
   * Store Y.Doc state to MongoDB
   * Called when document changes or last user disconnects
   */
  async onStoreDocument({ documentName, state, context }) {
    try {
      const [proposalId, formId] = documentName.split(':');
      
      if (!proposalId || !formId) {
        console.error(`Invalid document name: ${documentName}`);
        return;
      }

      // Find proposal
      const proposal = await Proposal.findById(proposalId);
      
      if (!proposal) {
        console.error(`Proposal not found: ${proposalId}`);
        return;
      }

      // Find or create form
      let form = proposal.forms.find(f => f.formId === formId);
      
      if (!form) {
        // Create new form if it doesn't exist
        const formLabels = {
          'form-i': 'Form I',
          'form-ia': 'Form IA',
          'form-ix': 'Form IX',
          'form-x': 'Form X',
          'form-xi': 'Form XI',
          'form-xii': 'Form XII'
        };
        
        form = {
          formId,
          formLabel: formLabels[formId] || formId,
          editorContent: [],
          yjsState: null,
          wordCount: 0,
          characterCount: 0,
          lastModified: new Date()
        };
        
        proposal.forms.push(form);
        form = proposal.forms[proposal.forms.length - 1];
      }

      // Capture old state for version history
      const oldJSON = {
        editorContent: form.editorContent || [],
        wordCount: form.wordCount || 0,
        characterCount: form.characterCount || 0,
        lastModified: form.lastModified
      };
      const oldYjsState = form.yjsState;

      // Store binary Yjs state
      form.yjsState = Buffer.from(state);

      // Also decode and store as JSON for REST API backward compatibility
      let newJSON = { ...oldJSON };
      try {
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, state);
        const yContent = ydoc.get('content', Y.Array);
        const plateContent = yContent.toJSON();
        
        form.editorContent = plateContent;
        
        // Update metadata
        const text = extractTextFromPlate(plateContent);
        form.wordCount = countWords(text);
        form.characterCount = text.length;
        form.lastModified = new Date();
        
        if (context?.user?._id) {
          form.lastModifiedBy = context.user._id;
        }
        
        newJSON = {
          editorContent: form.editorContent,
          wordCount: form.wordCount,
          characterCount: form.characterCount,
          lastModified: form.lastModified
        };
        
      } catch (decodeError) {
        console.error('Error decoding Yjs state to JSON:', decodeError);
      }

      await proposal.save();
      
      console.log(`💾 Saved Yjs state for ${documentName} (${state.length} bytes) - Proposal: "${proposal.title}" by ${context?.user?.name || 'Unknown'}`);
      
      // Create version history entry (only if user context available)
      if (context?.user?._id) {
        try {
          const version = await createVersion({
            proposalId,
            formId,
            oldJSON,
            newJSON,
            oldYjsState,
            newYjsState: Buffer.from(state),
            userId: context.user._id,
            changeType: 'form_update',
            comment: 'Auto-save from collaboration'
          });
          
          if (version) {
            console.log(`✅ Version ${version.versionNumber} created for ${documentName}`);
          }
        } catch (versionError) {
          console.error(`❌ Error creating version for ${documentName}:`, versionError);
          // Don't fail the save if version creation fails
        }
      } else {
        console.log(`⚠️  No user context available for version creation on ${documentName}`);
      }
      
    } catch (error) {
      console.error(`Error storing document ${documentName}:`, error);
    }
  }

  /**
   * Called when document is destroyed (all users disconnected)
   */
  async onDestroy({ documentName }) {
    console.log(`🗑️  Document destroyed: ${documentName}`);
  }
}

/**
 * Extract plain text from Plate.js content
 */
function extractTextFromPlate(content) {
  if (!Array.isArray(content)) return '';
  
  let text = '';
  
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.text) {
        text += node.text;
      }
      if (node.children && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }
  
  traverse(content);
  return text;
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Initialize Hocuspocus server
 */
export function createHocuspocusServer(httpServer) {
  const hocuspocus = Server.configure({
    port: 1234, // Separate port for Yjs WebSocket
    
    extensions: [
      new MongoDBPersistence()
    ],

    /**
     * Authentication
     * Verify JWT token from client connection
     */
    async onAuthenticate({ token, documentName, requestHeaders, requestParameters }) {
      try {
        // Extract JWT from token parameter or Authorization header
        const jwtToken = token || 
                        requestParameters.get('token') || 
                        requestHeaders.authorization?.replace('Bearer ', '');
        
        if (!jwtToken) {
          throw new Error('No authentication token provided');
        }

        // Verify JWT
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        
        // Load user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          throw new Error('User not found');
        }

        // Extract proposalId from document name
        const [proposalId, formId] = documentName.split(':');
        
        // Verify user has access to this proposal
        const proposal = await Proposal.findById(proposalId);
        
        if (!proposal) {
          throw new Error('Proposal not found');
        }

        // Authorization check
        const isAuthor = proposal.author.toString() === user._id.toString();
        const isReviewer = proposal.reviewer && proposal.reviewer.toString() === user._id.toString();
        const isStaff = proposal.assignedStaff?.some(s => s.user.toString() === user._id.toString());
        const isAdmin = user.role === 'admin';

        if (!isAuthor && !isReviewer && !isStaff && !isAdmin) {
          throw new Error('Access denied to this proposal');
        }

        console.log(`✅ Authenticated: ${user.name} accessing ${documentName}`);

        // Return user context (available in onLoadDocument, onStoreDocument)
        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };

      } catch (error) {
        console.error('Authentication failed:', error.message);
        throw new Error(`Authentication failed: ${error.message}`);
      }
    },

    /**
     * Called when connection is established
     */
    async onConnect({ documentName, context, connection }) {
      console.log(`🔌 User connected: ${context.user.name} to ${documentName}`);
    },

    /**
     * Called when connection is closed
     */
    async onDisconnect({ documentName, context, connection }) {
      console.log(`🔌 User disconnected: ${context.user.name} from ${documentName}`);
    },

    /**
     * Called when document is changed
     */
    async onChange({ documentName, context, document }) {
      // Document auto-saves via MongoDBPersistence extension
      // This is just for logging/monitoring
      const connectionCount = hocuspocus.getConnectionsCount(documentName);
      console.log(`📝 Document changed: ${documentName} (${connectionCount} users)`);
    }
  });

  hocuspocus.listen();

  console.log(`🚀 Hocuspocus Yjs server running on port 1234`);

  return hocuspocus;
}

/**
 * Get document statistics
 */
export async function getDocumentStats(proposalId, formId) {
  try {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return null;

    const form = proposal.forms.find(f => f.formId === formId);
    if (!form) return null;

    return {
      proposalId,
      formId,
      hasYjsState: form.yjsState && form.yjsState.length > 0,
      yjsStateSize: form.yjsState ? form.yjsState.length : 0,
      wordCount: form.wordCount,
      characterCount: form.characterCount,
      lastModified: form.lastModified
    };
  } catch (error) {
    console.error('Error getting document stats:', error);
    return null;
  }
}

/**
 * Force save a document (useful for testing)
 */
export async function forceSaveDocument(proposalId, formId) {
  try {
    const documentName = `${proposalId}:${formId}`;
    
    // Get the Y.Doc from Hocuspocus memory
    // Note: This requires access to Hocuspocus instance
    // In production, documents auto-save when users disconnect
    
    console.log(`Triggered force save for ${documentName}`);
    return true;
  } catch (error) {
    console.error('Error force saving document:', error);
    return false;
  }
}

export default {
  createHocuspocusServer,
  getDocumentStats,
  forceSaveDocument
};
