import mongoose from 'mongoose';

const expertOpinionSchema = new mongoose.Schema({
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  opinion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  reviewerRole: {
    type: String,
    enum: ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure one opinion per reviewer per proposal
expertOpinionSchema.index({ proposal: 1, reviewer: 1 }, { unique: true });

// Static method to get all opinions for a proposal
expertOpinionSchema.statics.getOpinionsForProposal = async function(proposalId) {
  return this.find({ proposal: proposalId })
    .populate('reviewer', 'name email roles designation institution')
    .sort({ createdAt: -1 });
};

// Static method to check if user has already submitted opinion
expertOpinionSchema.statics.hasUserSubmittedOpinion = async function(proposalId, userId) {
  const opinion = await this.findOne({ proposal: proposalId, reviewer: userId });
  return !!opinion;
};

// Static method to get opinion count for a proposal
expertOpinionSchema.statics.getOpinionCount = async function(proposalId) {
  return this.countDocuments({ proposal: proposalId });
};

// Static method to get average rating for a proposal
expertOpinionSchema.statics.getAverageRating = async function(proposalId) {
  const result = await this.aggregate([
    { $match: { proposal: new mongoose.Types.ObjectId(proposalId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return result.length > 0 ? { average: result[0].avgRating, count: result[0].count } : { average: 0, count: 0 };
};

export default mongoose.model('ExpertOpinion', expertOpinionSchema);
