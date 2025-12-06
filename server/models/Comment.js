import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isInline: {
    type: Boolean,
    default: false
  },
  inlinePosition: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  formName: {
    type: String,
    enum: ['formi', 'formia', 'formix', 'formx', 'formxi', 'formxii', null],
    default: null
  },
  discussionId: {
    type: String,
    default: null
  },
  documentContent: {
    type: String,
    default: null
  },
  contentRich: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['COMMENT', 'SUGGESTION', 'CLARIFICATION', 'AI_REVIEW'],
    default: 'COMMENT'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
commentSchema.index({ proposalId: 1, resolved: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ proposalId: 1, author: 1 });
commentSchema.index({ proposalId: 1, discussionId: 1, isInline: 1 });
commentSchema.index({ discussionId: 1, parentComment: 1 }, { 
  unique: true, 
  partialFilterExpression: { discussionId: { $ne: null }, parentComment: null }
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
