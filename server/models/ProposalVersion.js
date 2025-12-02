import mongoose from 'mongoose';

const proposalVersionSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  // Version number using decimal notation:
  // - 0.1: Initial draft (create page)
  // - 1: First submission
  // - 1.1: Working draft (collaborate page)
  // - 2: Second submission, etc.
  // x.1 versions are drafts, integer versions are submitted
  versionNumber: {
    type: Number,
    required: true
  },
  // Human-readable version label (e.g., "v1", "v1.1", "v2")
  versionLabel: {
    type: String,
    default: function() {
      return `v${this.versionNumber}`;
    }
  },
  // Check if this is a draft version (x.1)
  isDraft: {
    type: Boolean,
    default: function() {
      return this.versionNumber % 1 !== 0; // true if decimal (0.1, 1.1, 2.1)
    }
  },
  commitMessage: {
    type: String,
    default: ''
  },
  // Store only Form I content (single form) using Plate.js structure
  // Format: { formi: { content: [...], wordCount: number, characterCount: number } }
  forms: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  proposalInfo: {
    title: String,
    fundingMethod: String,
    principalAgency: String,
    subAgencies: [String],
    projectLeader: String,
    projectCoordinator: String,
    durationMonths: Number,
    outlayLakhs: Number
  },
  // Supporting documents snapshot for this version
  supportingDocs: [{
    formName: String,
    fileName: String,
    fileUrl: String,
    s3Key: String,
    fileSize: Number
  }],
  aiReportUrl: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Track when this version was last modified (useful for drafts)
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique version per proposal
proposalVersionSchema.index({ proposalId: 1, versionNumber: 1 }, { unique: true });

// Index for quickly finding drafts (decimal versions)
proposalVersionSchema.index({ proposalId: 1, isDraft: 1 });

// Virtual field 'formi' that maps to 'forms' for frontend compatibility
proposalVersionSchema.virtual('formi')
  .get(function() {
    return this.forms;
  })
  .set(function(value) {
    this.forms = value;
  });

// Ensure virtuals are included in JSON output
proposalVersionSchema.set('toJSON', { virtuals: true });
proposalVersionSchema.set('toObject', { virtuals: true });

/**
 * Helper to check if a version number is a draft (has decimal)
 */
const isVersionDraft = (version) => version % 1 !== 0;

/**
 * Helper to get the draft version for a major version
 * e.g., major 1 -> draft 1.1, major 2 -> draft 2.1
 */
const getDraftVersionNumber = (majorVersion) => majorVersion + 0.1;

/**
 * Helper to get the major version from a draft
 * e.g., draft 1.1 -> major 2, draft 0.1 -> major 1
 */
const getMajorVersionFromDraft = (draftVersion) => {
  if (draftVersion === 0.1) return 1;
  return Math.floor(draftVersion) + 1;
};

/**
 * Static method to get the draft version for a proposal (x.1 version)
 */
proposalVersionSchema.statics.getDraft = async function(proposalId) {
  return await this.findOne({ 
    proposalId, 
    $expr: { $ne: [{ $mod: ['$versionNumber', 1] }, 0] } // Find decimal versions
  }).sort({ versionNumber: -1 }); // Get latest draft
};

/**
 * Static method to get or create a draft version for a proposal
 * For create page (DRAFT status): version 0.1
 * For collaborate page (submitted): version x.1 where x is current major version
 */
proposalVersionSchema.statics.getOrCreateDraft = async function(proposalId, userId, proposalData, currentMajorVersion = 0) {
  // Determine draft version number
  const draftVersionNumber = currentMajorVersion === 0 ? 0.1 : getDraftVersionNumber(currentMajorVersion);
  
  let draft = await this.findOne({ proposalId, versionNumber: draftVersionNumber });
  
  if (draft) {
    return { draft, created: false };
  }
  
  // Create new draft
  draft = await this.create({
    proposalId,
    versionNumber: draftVersionNumber,
    versionLabel: `v${draftVersionNumber}`,
    isDraft: true,
    commitMessage: draftVersionNumber === 0.1 ? 'Initial draft' : 'Working draft',
    forms: proposalData?.forms || null,
    proposalInfo: proposalData?.proposalInfo || {},
    supportingDocs: proposalData?.supportingDocs || [],
    createdBy: userId,
    lastModifiedBy: userId
  });
  
  return { draft, created: true };
};

/**
 * Static method to promote draft to major version
 * 0.1 -> 1, 1.1 -> 2, 2.1 -> 3, etc.
 */
proposalVersionSchema.statics.promoteDraftToMajor = async function(proposalId, commitMessage, userId) {
  const draft = await this.getDraft(proposalId);
  
  if (!draft) {
    throw new Error('No draft found to promote');
  }
  
  const newMajorVersion = getMajorVersionFromDraft(draft.versionNumber);
  
  // Create new major version from draft data
  const majorVersion = await this.create({
    proposalId,
    versionNumber: newMajorVersion,
    versionLabel: `v${newMajorVersion}`,
    isDraft: false,
    commitMessage: commitMessage || `Version ${newMajorVersion}`,
    forms: draft.forms,
    proposalInfo: draft.proposalInfo,
    supportingDocs: draft.supportingDocs,
    createdBy: userId,
    lastModifiedBy: userId
  });
  
  // Delete the draft version
  await this.deleteOne({ _id: draft._id });
  
  return majorVersion;
};

/**
 * Instance method to get display label
 */
proposalVersionSchema.methods.getDisplayLabel = function() {
  if (this.isDraft || this.versionNumber % 1 !== 0) {
    return `Version ${this.versionNumber} (Draft)`;
  }
  return `Version ${this.versionNumber}`;
};

/**
 * Instance method to check if this is the initial draft (0.1)
 */
proposalVersionSchema.methods.isInitialDraft = function() {
  return this.versionNumber === 0.1;
};

const ProposalVersion = mongoose.model('ProposalVersion', proposalVersionSchema);

export default ProposalVersion;
