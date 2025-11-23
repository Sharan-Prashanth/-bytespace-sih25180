import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'draft',
      'ai_evaluation',
      'submitted',
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
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorRole: {
    type: String,
    enum: [
      'principal_investigator',
      'cmpdi_member',
      'domain_expert',
      'tssrc_member',
      'ssrc_member',
      'system'
    ]
  },
  remarks: {
    type: String,
    maxlength: [2000, 'Remarks cannot exceed 2000 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
statusHistorySchema.index({ proposal: 1, createdAt: -1 });
statusHistorySchema.index({ status: 1 });

// Static method to add status change
statusHistorySchema.statics.addStatusChange = async function(proposalId, status, actorId, actorRole, remarks = '', metadata = {}) {
  return await this.create({
    proposal: proposalId,
    status,
    actor: actorId,
    actorRole,
    remarks,
    metadata
  });
};

// Static method to get proposal history
statusHistorySchema.statics.getProposalHistory = async function(proposalId) {
  return await this.find({ proposal: proposalId })
    .populate('actor', 'name email role')
    .sort({ createdAt: 1 });
};

const StatusHistory = mongoose.model('StatusHistory', statusHistorySchema);
export default StatusHistory;
