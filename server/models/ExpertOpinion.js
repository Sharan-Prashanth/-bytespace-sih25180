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
    required: false,
    min: 0.5,
    max: 5,
    validate: {
      validator: function(v) {
        // Allow null/undefined or values in 0.5 increments from 0.5 to 5
        if (v === null || v === undefined) return true;
        return v >= 0.5 && v <= 5 && (v * 2) % 1 === 0;
      },
      message: 'Rating must be between 0.5 and 5 in 0.5 increments'
    }
  },
  opinion: {
    type: String,
    required: false,
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

// Custom validation to ensure at least rating or opinion is provided
expertOpinionSchema.pre('validate', function(next) {
  if (!this.rating && !this.opinion) {
    next(new Error('At least rating or opinion must be provided'));
  } else {
    next();
  }
});

// Ensure one opinion per reviewer per proposal
expertOpinionSchema.index({ proposal: 1, reviewer: 1 }, { unique: true });

// Static method to get all opinions for a proposal
expertOpinionSchema.statics.getOpinionsForProposal = async function(proposalId) {
  return this.find({ proposal: proposalId })
    .populate('reviewer', 'fullName name email roles designation institution organisationName')
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

// Static method to get average rating for a proposal (only from opinions with ratings)
expertOpinionSchema.statics.getAverageRating = async function(proposalId) {
  const result = await this.aggregate([
    { $match: { proposal: new mongoose.Types.ObjectId(proposalId), rating: { $exists: true, $ne: null, $gt: 0 } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return result.length > 0 ? { average: result[0].avgRating, count: result[0].count } : { average: 0, count: 0 };
};

export default mongoose.model('ExpertOpinion', expertOpinionSchema);
