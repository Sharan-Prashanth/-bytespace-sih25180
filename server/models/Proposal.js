import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  proposalCode: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    maxlength: [150, 'Title cannot exceed 150 characters'],
    trim: true
  },
  fundingMethod: {
    type: String,
    required: [true, 'Funding method is required'],
    enum: ['S&T of MoC', 'R&D of CIL']
  },
  principalAgency: {
    type: String,
    required: [true, 'Principal implementing agency is required'],
    trim: true
  },
  subAgencies: [{
    type: String,
    trim: true
  }],
  projectLeader: {
    type: String,
    required: [true, 'Project leader is required'],
    trim: true
  },
  projectCoordinator: {
    type: String,
    required: [true, 'Project coordinator is required'],
    trim: true
  },
  durationMonths: {
    type: Number,
    required: [true, 'Project duration is required'],
    min: [1, 'Duration must be at least 1 month']
  },
  outlayLakhs: {
    type: Number,
    required: [true, 'Project outlay is required'],
    min: [0, 'Outlay must be a positive number']
  },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'AI_EVALUATION',
      'CMPDI_REVIEW',
      'CMPDI_EXPERT_REVIEW',
      'CMPDI_APPROVED',
      'CMPDI_REJECTED',
      'TSSRC_REVIEW',
      'TSSRC_APPROVED',
      'TSSRC_REJECTED',
      'SSRC_REVIEW',
      'SSRC_APPROVED',
      'SSRC_REJECTED',
      'ACCEPTED',
      'ONGOING',
      'COMPLETED'
    ],
    default: 'DRAFT'
  },
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
  forms: {
    formI: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    formIA: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    formIX: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    formX: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    formXI: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    formXII: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
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
  aiReports: [{
    version: Number,
    reportUrl: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
proposalSchema.index({ createdBy: 1, status: 1 });
proposalSchema.index({ proposalCode: 1 });
proposalSchema.index({ 'assignedReviewers.reviewer': 1 });
proposalSchema.index({ 'collaborators.userId': 1 });

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
