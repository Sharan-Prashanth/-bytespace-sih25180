import mongoose from 'mongoose';

// Sub-schema for individual form content (Plate.js editor data)
const formContentSchema = new mongoose.Schema({
  formKey: {
    type: String,
    required: true,
    enum: ['formi', 'formia', 'formix', 'formx', 'formxi', 'formxii']
  },
  formLabel: {
    type: String,
    required: true
  },
  // Store Plate.js editor content as JSON (for REST API backward compatibility)
  editorContent: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Store Yjs document state as binary (for CRDT collaboration)
  yjsState: {
    type: Buffer,
    default: null
  },
  // Array of PDF URLs for uploaded forms (if user uploads PDFs instead of using editor)
  originalPdfs: [{
    type: String,
    default: null
  }],
  // Additional form-specific data (signature, seal, etc. - S3 URLs stored here)
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Metadata for each form
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const proposalSchema = new mongoose.Schema({
  // Core Information
  proposalNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  researchFundingMethod: {
    type: String,
    required: [true, 'Research funding method is required'],
    enum: ['S&T_OF_MOC', 'R&D_OF_CIL']
  },
  principalImplementingAgency: {
    type: String,
    required: [true, 'Principal implementing agency is required'],
    trim: true,
    maxlength: [100, 'Principal implementing agency cannot exceed 100 characters']
  },
  subImplementingAgency: {
    type: String,
    required: [true, 'Sub implementing agency is required'],
    trim: true,
    maxlength: [100, 'Sub implementing agency cannot exceed 100 characters']
  },
  projectLeader: {
    type: String,
    required: [true, 'Project leader is required'],
    trim: true,
    maxlength: [100, 'Project leader name cannot exceed 100 characters']
  },
  projectCoordinator: {
    type: String,
    required: [true, 'Project coordinator is required'],
    trim: true,
    maxlength: [100, 'Project coordinator name cannot exceed 100 characters']
  },
  projectDuration: {
    type: Number,
    required: [true, 'Project duration is required'],
    min: [1, 'Project duration must be at least 1 month']
  },
  projectOutlay: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Project outlay is required'],
    min: [0, 'Project outlay cannot be negative']
  },
  
  // Creator and Co-Investigators
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coInvestigators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Collaborators with their roles and permissions
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['principal_investigator', 'co_investigator'],
      required: true
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canComment: { type: Boolean, default: true },
      canInvite: { type: Boolean, default: false } // Only principal investigators can invite
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'accepted'
    }
  }],
  
  // Forms (6 JSON Forms with Plate.js + Yjs) - Max 6 items
  forms: {
    type: [formContentSchema],
    default: [],
    validate: [arrayLimit, 'Forms array cannot exceed 6 items']
  },
  // Status & Workflow
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'ai_evaluation',
      'cmpdi_review',
      'cmpdi_clarification_requested',
      'expert_review',
      'cmpdi_approved',
      'cmpdi_rejected',
      'tssrc_review',
      'tssrc_clarification_requested',
      'tssrc_approved',
      'tssrc_rejected',
      'ssrc_review',
      'ssrc_approved',
      'ssrc_rejected',
      'project_ongoing',
      'project_completed'
    ],
    default: 'draft'
  },
  
  // Status History
  statusHistory: [{
    fromStatus: {
      type: String
    },
    toStatus: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Workflow Timeline
  submittedAt: Date,
  cmpdiReviewStartedAt: Date,
  cmpdiDecisionAt: Date,
  tssrcReviewStartedAt: Date,
  tssrcDecisionAt: Date,
  ssrcReviewStartedAt: Date,
  ssrcDecisionAt: Date,
  projectStartDate: Date,
  projectEndDate: Date,
  
  // AI Evaluation
  aiEvaluation: {
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    overall: Number,
    technical: Number,
    feasibility: Number,
    innovation: Number,
    impact: Number,
    budget: Number,
    timeline: Number,
    notes: String,
    aiReport: String // S3 link for the PDF
  },
  
  // CMPDI Assignments & Reviews
  cmpdiAssignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedExperts: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    reviewSubmitted: {
      type: Boolean,
      default: false
    },
    reviewReport: String, // S3 bucket link for PDF
    rating: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor', 'Needs Major Revision']
    },
    submittedAt: Date
  }],
  cmpdiReview: {
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'clarification_requested']
    },
    remarks: String,
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decidedAt: Date,
    reportDocumentId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // TSSRC Assignments & Reviews
  tssrcAssignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tssrcReview: {
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'clarification_requested']
    },
    remarks: String,
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decidedAt: Date,
    reportDocumentId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // SSRC Assignments & Reviews
  ssrcAssignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ssrcReview: {
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'clarification_requested']
    },
    remarks: String,
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decidedAt: Date,
    reportDocumentId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Comments / Feedback
  comments: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    type: {
      type: String,
      enum: ['clarification_request', 'clarification_response', 'committee_remark', 'general_comment'],
      default: 'general_comment'
    },
    stage: {
      type: String,
      enum: ['PI', 'CMPDI', 'TSSRC', 'SSRC', 'EXPERT']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Documents & Attachments (S3 bucket links)
  documents: [{
    type: {
      type: String,
      enum: ['proposal_pdf', 'supporting_doc', 'expert_report', 'cmpdi_report', 'tssrc_minutes', 'ssrc_minutes', 'monitoring_report', 'other'],
      required: true
    },
    filename: String,
    originalName: String,
    url: String, // S3 URL
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    relatedStage: {
      type: String,
      enum: ['cmpdi', 'tssrc', 'ssrc', 'monitoring', 'submission']
    }
  }],
  
  // Optional: Monitoring After Approval
  monitoringLogs: [{
    date: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    summary: String,
    progressPercent: {
      type: Number,
      min: 0,
      max: 100
    },
    attachments: [{
      type: String // Document IDs or URLs
    }]
  }],
  
  // Misc & Meta
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Store signatures metadata (S3 URLs)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Array limit validator for forms
function arrayLimit(val) {
  return val.length <= 6;
}

// Indexes for better query performance
proposalSchema.index({ createdBy: 1, status: 1 });
proposalSchema.index({ proposalNumber: 1 }, { unique: true, sparse: true });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdAt: -1 });
proposalSchema.index({ cmpdiAssignees: 1 });
proposalSchema.index({ tssrcAssignees: 1 });
proposalSchema.index({ ssrcAssignees: 1 });
proposalSchema.index({ 'assignedExperts.expert': 1 });

// Virtual for proposal age
proposalSchema.virtual('age').get(function() {
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to generate proposalNumber
proposalSchema.pre('save', async function(next) {
  if (!this.proposalNumber && this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    this.proposalNumber = `PROP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to update a form's content
proposalSchema.methods.updateForm = function(formKey, editorContent, wordCount = 0, characterCount = 0, userId = null) {
  const formIndex = this.forms.findIndex(f => f.formKey === formKey);
  
  if (formIndex >= 0) {
    // Update existing form
    console.log(`📝 Updating existing form: Proposal=${this._id}, Form=${formKey}, Words=${wordCount}`);
    this.forms[formIndex].editorContent = editorContent;
    this.forms[formIndex].wordCount = wordCount;
    this.forms[formIndex].characterCount = characterCount;
    this.forms[formIndex].lastModified = new Date();
    if (userId) {
      this.forms[formIndex].lastModifiedBy = userId;
    }
  } else {
    // Add new form (max 6)
    if (this.forms.length >= 6) {
      throw new Error('Maximum of 6 forms allowed per proposal');
    }
    
    const formLabels = {
      'formi': 'Form I',
      'formia': 'Form IA',
      'formix': 'Form IX',
      'formx': 'Form X',
      'formxi': 'Form XI',
      'formxii': 'Form XII'
    };
    
    console.log(`➕ Creating new form: Proposal=${this._id}, Form=${formKey}, Words=${wordCount}`);
    this.forms.push({
      formKey,
      formLabel: formLabels[formKey] || formKey,
      editorContent,
      wordCount,
      characterCount,
      lastModified: new Date(),
      lastModifiedBy: userId,
      uploadedBy: userId,
      uploadedAt: new Date()
    });
  }
  
  return this;
};

// Method to get a specific form's content
proposalSchema.methods.getForm = function(formKey) {
  return this.forms.find(f => f.formKey === formKey);
};

// Method to get all forms as a map
proposalSchema.methods.getFormsMap = function() {
  const map = {};
  this.forms.forEach(form => {
    map[form.formKey] = {
      editorContent: form.editorContent,
      yjsState: form.yjsState,
      originalPdfs: form.originalPdfs,
      formData: form.formData,
      wordCount: form.wordCount,
      characterCount: form.characterCount,
      lastModified: form.lastModified,
      lastModifiedBy: form.lastModifiedBy
    };
  });
  return map;
};

// Method to add comment
proposalSchema.methods.addComment = function(from, message, type = 'general_comment', stage = null) {
  this.comments.push({
    from,
    message,
    type,
    stage,
    createdAt: new Date()
  });
  return this.save();
};

// Method to update status with history tracking
proposalSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  
  this.statusHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedBy: userId,
    changedAt: new Date()
  });
  
  this.status = newStatus;
  
  // Update timeline fields based on status
  switch(newStatus) {
    case 'submitted':
      this.submittedAt = new Date();
      break;
    case 'cmpdi_review':
      this.cmpdiReviewStartedAt = new Date();
      break;
    case 'cmpdi_approved':
    case 'cmpdi_rejected':
      this.cmpdiDecisionAt = new Date();
      break;
    case 'tssrc_review':
      this.tssrcReviewStartedAt = new Date();
      break;
    case 'tssrc_approved':
    case 'tssrc_rejected':
      this.tssrcDecisionAt = new Date();
      break;
    case 'ssrc_review':
      this.ssrcReviewStartedAt = new Date();
      break;
    case 'ssrc_approved':
    case 'ssrc_rejected':
      this.ssrcDecisionAt = new Date();
      break;
    case 'project_ongoing':
      this.projectStartDate = new Date();
      break;
    case 'project_completed':
      this.projectEndDate = new Date();
      break;
  }
  
  return this;
};

// Method to assign experts to CMPDI review
proposalSchema.methods.assignExpert = function(expertId, assignedById) {
  const existingAssignment = this.assignedExperts.find(
    assignment => assignment.expert.toString() === expertId.toString()
  );
  
  if (!existingAssignment) {
    this.assignedExperts.push({
      expert: expertId,
      assignedBy: assignedById,
      assignedAt: new Date()
    });
  }
  
  return this;
};

// Static method to get proposals by user role
proposalSchema.statics.getProposalsByRole = function(userId, userRoles) {
  const baseQuery = { status: { $ne: 'draft' } };
  
  // Check if user has any committee role
  const hasCMPDIRole = userRoles.includes('CMPDI_MEMBER');
  const hasTSSRCRole = userRoles.includes('TSSRC_MEMBER');
  const hasSSRCRole = userRoles.includes('SSRC_MEMBER');
  const hasExpertRole = userRoles.includes('EXPERT_REVIEWER');
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
  
  if (isSuperAdmin) {
    return this.find({}).populate('createdBy coInvestigators cmpdiAssignees tssrcAssignees ssrcAssignees', 'fullName email');
  }
  
  if (hasCMPDIRole) {
    return this.find({ 
      $or: [
        { cmpdiAssignees: userId },
        { status: { $in: ['cmpdi_review', 'expert_review', 'cmpdi_clarification_requested'] } }
      ]
    }).populate('createdBy coInvestigators', 'fullName email');
  }
  
  if (hasExpertRole) {
    return this.find({ 
      'assignedExperts.expert': userId 
    }).populate('createdBy coInvestigators', 'fullName email');
  }
  
  if (hasTSSRCRole) {
    return this.find({ 
      $or: [
        { tssrcAssignees: userId },
        { status: { $in: ['tssrc_review', 'tssrc_clarification_requested'] } }
      ]
    }).populate('createdBy coInvestigators', 'fullName email');
  }
  
  if (hasSSRCRole) {
    return this.find({ 
      $or: [
        { ssrcAssignees: userId },
        { status: { $in: ['ssrc_review'] } }
      ]
    }).populate('createdBy coInvestigators', 'fullName email');
  }
  
  // Default: user's own proposals and collaborations
  return this.find({ 
    $or: [
      { createdBy: userId },
      { coInvestigators: userId },
      { 'collaborators.user': userId }
    ]
  }).populate('createdBy coInvestigators', 'fullName email');
};

const Proposal = mongoose.model('Proposal', proposalSchema);
export default Proposal;
