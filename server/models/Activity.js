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
      'USER_LOGOUT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLES_UPDATED',
      'PROFILE_UPDATED',
      'PASSWORD_CHANGED',
      'PROPOSAL_CREATED',
      'PROPOSAL_UPDATED',
      'PROPOSAL_SUBMITTED',
      'PROPOSAL_DELETED',
      'UPLOAD_FORMI',
      'VERSION_CREATED',
      'VERSION_SUBMITTED',
      'VERSION_REVERTED',
      'STATUS_CHANGED',
      'COLLABORATOR_ADDED',
      'COLLABORATOR_REMOVED',
      'REVIEWER_ASSIGNED',
      'EXPERT_REVIEWERS_ASSIGNED',
      'REVIEW_STATUS_UPDATED',
      'COMMENT_ADDED',
      'COMMENT_RESOLVED',
      'INLINE_COMMENT_ADDED',
      'CHAT_MESSAGE_SENT',
      'REPORT_SUBMITTED',
      'CLARIFICATION_REQUESTED',
      'PROPOSAL_APPROVED',
      'PROPOSAL_REJECTED',
      'UPDATE_DISCUSSIONS',
      'UPDATE_PROPOSAL_INFO',
      'DRAFT_CREATED',
      'DRAFT_UPDATED',
      'DRAFT_DISCARDED',
      'AI_VALIDATION_STARTED',
      'AI_VALIDATION_COMPLETED',
      'AI_EVALUATION_STARTED',
      'AI_EVALUATION_COMPLETED'
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
