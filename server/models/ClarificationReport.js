import mongoose from 'mongoose';

const clarificationReportSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  // Plate.js content structure
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Committee member who created the report
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Committee type
  committeeType: {
    type: String,
    enum: ['CMPDI', 'TSSRC', 'SSRC'],
    required: true
  },
  // Signature data URL (from signature pad)
  signature: {
    type: String,
    default: null
  },
  // Seal/stamp image stored in S3
  seal: {
    url: String,
    s3Key: String
  },
  // Track embedded images in editor content for cleanup
  embeddedImages: [{
    url: String,
    s3Key: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Status of the report
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED'],
    default: 'DRAFT'
  },
  // When submitted, this is set and email is sent
  submittedAt: {
    type: Date,
    default: null
  },
  // PDF/DOCX export URLs (if generated)
  exports: {
    pdf: {
      url: String,
      s3Key: String,
      generatedAt: Date
    },
    docx: {
      url: String,
      s3Key: String,
      generatedAt: Date
    }
  },
  // Scanned signed document (uploaded by user)
  scannedDocument: {
    url: String,
    s3Key: String,
    uploadedAt: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
clarificationReportSchema.index({ proposalId: 1, createdBy: 1 });
clarificationReportSchema.index({ proposalId: 1, status: 1 });

const ClarificationReport = mongoose.model('ClarificationReport', clarificationReportSchema);

export default ClarificationReport;
