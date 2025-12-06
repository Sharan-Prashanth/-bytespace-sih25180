import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTERED',
      'USER_LOGIN',
      'PROPOSAL_CREATED',
      'PROPOSAL_UPDATED',
      'PROPOSAL_SUBMITTED',
      'PROPOSAL_DELETED',
      'UPLOAD_FORMI',
      'VERSION_CREATED',
      'VERSION_REVERTED',
      'STATUS_CHANGED',
      'COLLABORATOR_ADDED',
      'REVIEWER_ASSIGNED',
      'COMMENT_ADDED',
      'COMMENT_RESOLVED',
      'INLINE_COMMENT_ADDED',
      'CHAT_MESSAGE_SENT',
      'REPORT_SUBMITTED',
      'CLARIFICATION_REQUESTED',
      'PROPOSAL_APPROVED',
      'PROPOSAL_REJECTED',
      'UPDATE_DISCUSSIONS',
      'DRAFT_UPDATED'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ proposalId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
