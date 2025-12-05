import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  proposalCode: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    default: '',
    maxlength: [150, 'Title cannot exceed 150 characters'],
    trim: true
  },
  fundingMethod: {
    type: String,
    default: 'S&T of MoC',
    enum: ['S&T of MoC', 'R&D of CIL']
  },
  principalAgency: {
    type: String,
    default: '',
    trim: true
  },
  subAgencies: [{
    type: String,
    trim: true
  }],
  projectLeader: {
    type: String,
    default: '',
    trim: true
  },
  projectCoordinator: {
    type: String,
    default: '',
    trim: true
  },
  durationMonths: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  outlayLakhs: {
    type: Number,
    default: 0,
    min: [0, 'Outlay cannot be negative']
  },
  status: {
    type: String,
    enum: [
      'DRAFT',                    // Unsubmitted draft
      'AI_EVALUATION_PENDING',    // Submitted, waiting for AI evaluation
      'AI_REJECTED',              // AI evaluation rejected - can be modified and resubmitted
      'CMPDI_REVIEW',             // AI passed, under CMPDI review
      'CMPDI_EXPERT_REVIEW',      // Assigned to expert reviewers
      'CMPDI_ACCEPTED',           // CMPDI approved, moves to TSSRC
      'CMPDI_REJECTED',           // CMPDI rejected - final, cannot be modified
      'TSSRC_REVIEW',             // Under TSSRC review
      'TSSRC_ACCEPTED',           // TSSRC approved, moves to SSRC
      'TSSRC_REJECTED',           // TSSRC rejected - final, cannot be modified
      'SSRC_REVIEW',              // Under SSRC final review
      'SSRC_ACCEPTED',            // SSRC approved - final approval, process ends here
      'SSRC_REJECTED'             // SSRC rejected - final, cannot be modified
    ],
    default: 'DRAFT'
  },
  // Version tracking using decimal notation:
  // - 0.1: Initial draft (not submitted yet)
  // - 1: First submission (after initial submit)
  // - 1.1: Working draft on collaborate page (not submitted)
  // - 2: Second submission (after resubmit from collaborate)
  // - 2.1: Another working draft, etc.
  // Minor versions (x.1) are always drafts, major versions (1, 2, 3) are submitted
  currentVersion: {
    type: Number,
    default: 0.1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coInvestigators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['PI', 'CI', 'REVIEWER', 'CMPDI', 'TSSRC', 'SSRC', 'ADMIN']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedReviewers: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING'
    }
  }],
  // Store only Form I content (single form) using Plate.js structure
  // Format: { formi: { content: [...], wordCount: number, characterCount: number } }
  forms: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Yjs document state for real-time collaboration (base64 encoded)
  yjsState: {
    type: String,
    default: null
  },
  // Inline discussions (comments and suggestions) from Plate.js editor
  // Stored per form: { formi: { discussions: [...], suggestions: [...] } }
  inlineDiscussions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  supportingDocs: [{
    formName: String,
    fileName: String,
    fileUrl: String,
    s3Key: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Track embedded images in editor content for cleanup on deletion
  embeddedImages: [{
    url: String,
    s3Key: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  // Track if expert review was skipped during CMPDI review
  // This is set when CMPDI directly accepts/rejects without sending to expert review
  expertReviewSkipped: {
    type: Boolean,
    default: null // null = not yet determined, true = skipped, false = expert review was conducted
  },
  aiReports: [{
    version: Number,
    reportUrl: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    lastYjsSync: Date,
    collaborationType: {
      type: String,
      enum: ['socket', 'yjs', null],
      default: null
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
// Note: proposalCode index is automatically created by unique:true in schema definition
proposalSchema.index({ createdBy: 1, status: 1 });
proposalSchema.index({ 'assignedReviewers.reviewer': 1 });
proposalSchema.index({ 'collaborators.userId': 1 });

// Virtual field 'formi' that maps to 'forms' for frontend compatibility
proposalSchema.virtual('formi')
  .get(function() {
    return this.forms;
  })
  .set(function(value) {
    this.forms = value;
  });

// Ensure virtuals are included in JSON output
proposalSchema.set('toJSON', { virtuals: true });
proposalSchema.set('toObject', { virtuals: true });

// Add timeline entry before status change
proposalSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
