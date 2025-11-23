import mongoose from 'mongoose';

/**
 * Version Model - Stores diff-based version history for proposals
 * Uses diffs instead of storing full documents to save space
 * Supports rollback to any previous version
 * 
 * Version Types:
 * - snapshot: Full state stored (every Nth version for fast reconstruction)
 * - diff: Only changes stored (most versions)
 * 
 * Storage Strategy:
 * - Yjs binary diffs (primary, for CRDT state)
 * - JSON diffs (backup, for REST API compatibility)
 */

const versionSchema = new mongoose.Schema({
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  
  // Version type: 'snapshot' stores full state, 'diff' stores only changes
  versionType: {
    type: String,
    enum: ['snapshot', 'diff'],
    default: 'diff'
  },
  
  // Store only the changes (diffs) not the full content
  // This is much more space-efficient for large proposals
  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Yjs binary state diff (for CRDT collaboration)
  // Stores Y.Doc update bytes
  yjsStateDiff: {
    type: Buffer,
    default: null
  },
  
  // Previous Yjs state snapshot (for rollback reconstruction)
  // Only stored in snapshot versions
  yjsStateSnapshot: {
    type: Buffer,
    default: null
  },
  
  // Type of change made
  changeType: {
    type: String,
    enum: ['form_update', 'metadata_update', 'status_change', 'full_save', 'initial_create'],
    default: 'form_update'
  },
  
  // Which form was changed (if applicable)
  affectedForm: {
    type: String,
    enum: ['main', 'form-ia', 'form-ix', 'form-x', 'form-xi', 'form-xii', 'metadata', 'all'],
    default: null
  },
  
  // User who made the change
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Optional comment about the change
  comment: {
    type: String,
    maxlength: 500
  },
  
  // Metadata about the change
  metadata: {
    wordCountDelta: Number,
    characterCountDelta: Number,
    operationType: String, // 'create', 'update', 'delete', 'replace'
    changeSize: Number // size of the diff in bytes
  },
  
  // Hash of the content for integrity verification (optional)
  contentHash: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
versionSchema.index({ proposal: 1, versionNumber: -1 });
versionSchema.index({ createdAt: -1 });
versionSchema.index({ createdBy: 1 });

// Virtual to check if this is the latest version
versionSchema.virtual('isLatest').get(function() {
  // This needs to be computed by comparing with other versions
  return true; // Placeholder
});

// Static method to get version count for a proposal
versionSchema.statics.getVersionCount = async function(proposalId) {
  return await this.countDocuments({ proposal: proposalId });
};

// Static method to get latest version number for a proposal
versionSchema.statics.getLatestVersionNumber = async function(proposalId) {
  const latest = await this.findOne({ proposal: proposalId })
    .sort({ versionNumber: -1 })
    .select('versionNumber');
  return latest ? latest.versionNumber : 0;
};

// Static method to get version history for a proposal
versionSchema.statics.getVersionHistory = async function(proposalId, limit = 50, skip = 0) {
  return await this.find({ proposal: proposalId })
    .sort({ versionNumber: -1 })
    .limit(limit)
    .skip(skip)
    .populate('createdBy', 'name email')
    .select('-changes'); // Exclude heavy diff data in list view
};

// Static method to get a specific version with full diff data
versionSchema.statics.getVersionDetail = async function(proposalId, versionNumber) {
  return await this.findOne({ 
    proposal: proposalId, 
    versionNumber: versionNumber 
  }).populate('createdBy', 'name email');
};

// Method to calculate diff between two objects
versionSchema.statics.calculateDiff = function(oldObj, newObj) {
  const diff = {
    added: {},
    modified: {},
    deleted: {}
  };
  
  // Handle null/undefined cases
  if (!oldObj) oldObj = {};
  if (!newObj) newObj = {};
  
  // Find added and modified keys
  for (const key in newObj) {
    if (!(key in oldObj)) {
      diff.added[key] = newObj[key];
    } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff.modified[key] = {
        old: oldObj[key],
        new: newObj[key]
      };
    }
  }
  
  // Find deleted keys
  for (const key in oldObj) {
    if (!(key in newObj)) {
      diff.deleted[key] = oldObj[key];
    }
  }
  
  return diff;
};

// Method to apply diff to reconstruct a version
versionSchema.statics.applyDiff = function(baseObj, diff) {
  const result = { ...baseObj };
  
  // Apply additions
  if (diff.added) {
    Object.assign(result, diff.added);
  }
  
  // Apply modifications
  if (diff.modified) {
    for (const key in diff.modified) {
      result[key] = diff.modified[key].new;
    }
  }
  
  // Apply deletions
  if (diff.deleted) {
    for (const key in diff.deleted) {
      delete result[key];
    }
  }
  
  return result;
};

// Static method to reconstruct proposal state at a specific version
versionSchema.statics.reconstructProposalAtVersion = async function(proposalId, targetVersionNumber) {
  // Get all versions up to and including the target version
  const versions = await this.find({ 
    proposal: proposalId,
    versionNumber: { $lte: targetVersionNumber }
  }).sort({ versionNumber: 1 });
  
  if (versions.length === 0) {
    return null;
  }
  
  // Start with the first version (should be initial_create)
  let reconstructed = versions[0].changeType === 'initial_create' 
    ? versions[0].changes 
    : {};
  
  // Apply each subsequent diff
  for (let i = 1; i < versions.length; i++) {
    const version = versions[i];
    if (version.changeType === 'full_save') {
      // Full save replaces everything
      reconstructed = version.changes;
    } else {
      // Apply the diff
      reconstructed = this.applyDiff(reconstructed, version.changes);
    }
  }
  
  return reconstructed;
};

// Method to create initial version
versionSchema.statics.createInitialVersion = async function(proposalId, initialData, userId, comment = 'Initial creation') {
  return await this.create({
    proposal: proposalId,
    versionNumber: 1,
    changes: initialData,
    changeType: 'initial_create',
    affectedForm: 'all',
    createdBy: userId,
    comment: comment,
    metadata: {
      operationType: 'create',
      changeSize: JSON.stringify(initialData).length
    }
  });
};

// Method to create a new version with diff
versionSchema.statics.createVersion = async function({
  proposalId,
  oldData,
  newData,
  changeType = 'form_update',
  affectedForm = null,
  userId,
  comment = null,
  version = null
}) {
  // Use provided version number if available, otherwise calculate next version
  let nextVersion;
  if (version !== null && version !== undefined) {
    nextVersion = version;
  } else {
    const latestVersion = await this.getLatestVersionNumber(proposalId);
    nextVersion = latestVersion + 1;
  }
  
  // Calculate diff
  const diff = this.calculateDiff(oldData, newData);
  const diffSize = JSON.stringify(diff).length;
  
  // Calculate word count delta if forms are affected
  let wordCountDelta = 0;
  if (affectedForm && affectedForm !== 'metadata' && affectedForm !== 'all') {
    const oldWordCount = oldData?.wordCount || 0;
    const newWordCount = newData?.wordCount || 0;
    wordCountDelta = newWordCount - oldWordCount;
  }
  
  return await this.create({
    proposal: proposalId,
    versionNumber: nextVersion,
    changes: diff,
    changeType,
    affectedForm,
    createdBy: userId,
    comment,
    metadata: {
      wordCountDelta,
      operationType: 'update',
      changeSize: diffSize
    }
  });
};

const Version = mongoose.model('Version', versionSchema);
export default Version;
