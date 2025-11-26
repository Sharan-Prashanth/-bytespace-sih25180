import mongoose from 'mongoose';

const proposalVersionSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  commitMessage: {
    type: String,
    default: ''
  },
  forms: {
    formI: mongoose.Schema.Types.Mixed,
    formIA: mongoose.Schema.Types.Mixed,
    formIX: mongoose.Schema.Types.Mixed,
    formX: mongoose.Schema.Types.Mixed,
    formXI: mongoose.Schema.Types.Mixed,
    formXII: mongoose.Schema.Types.Mixed
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
  aiReportUrl: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique version per proposal
proposalVersionSchema.index({ proposalId: 1, versionNumber: 1 }, { unique: true });

const ProposalVersion = mongoose.model('ProposalVersion', proposalVersionSchema);

export default ProposalVersion;
