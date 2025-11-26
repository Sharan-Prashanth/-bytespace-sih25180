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
  pdfUrl: {
    type: String,
    default: null
  },
  reportType: {
    type: String,
    enum: ['EXPERT_REVIEW', 'COMMITTEE_REVIEW', 'CMPDI_REVIEW', 'TSSRC_REVIEW', 'SSRC_REVIEW', 'OTHER'],
    default: 'OTHER'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED'],
    default: 'DRAFT'
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

const Report = mongoose.model('Report', reportSchema);

export default Report;
