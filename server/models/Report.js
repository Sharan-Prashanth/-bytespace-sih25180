import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  htmlContent: {
    type: String,
    default: null
  },
  textContent: {
    type: String,
    default: null
  },
  pdfUrl: {
    type: String,
    default: null
  },
  pdfSize: {
    type: Number,
    default: null
  },
  isCompressed: {
    type: Boolean,
    default: false
  },
  reportType: {
    type: String,
    enum: ['EXPERT_REVIEW', 'COMMITTEE_REVIEW', 'CMPDI_REVIEW', 'TSSRC_REVIEW', 'SSRC_REVIEW', 'OTHER'],
    default: 'OTHER'
  },
  decision: {
    type: String,
    enum: [
      'CMPDI_ACCEPTED', 'CMPDI_REJECTED', 'CMPDI_EXPERT_REVIEW',
      'TSSRC_ACCEPTED', 'TSSRC_REJECTED',
      'SSRC_ACCEPTED', 'SSRC_REJECTED',
      null
    ],
    default: null
  },
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED'],
    default: 'DRAFT'
  },
  submittedAt: {
    type: Date,
    default: null
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ proposalId: 1, author: 1 });
reportSchema.index({ proposalId: 1, reportType: 1 });
reportSchema.index({ proposalId: 1, status: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
