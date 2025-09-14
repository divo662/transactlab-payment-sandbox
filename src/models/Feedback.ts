import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  rating: number; // 1-5 stars
  title: string;
  message: string;
  category: 'bug' | 'feature' | 'improvement' | 'general' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  adminNotes?: string;
  response?: string;
  respondedAt?: Date;
  respondedBy?: mongoose.Types.ObjectId;
  isPublic: boolean; // Whether to show in public feedback section
  helpful: number; // Count of helpful votes
  notHelpful: number; // Count of not helpful votes
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['bug', 'feature', 'improvement', 'general', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'reviewed', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  response: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1, createdAt: -1 });
feedbackSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for total votes
feedbackSchema.virtual('totalVotes').get(function() {
  return this.helpful + this.notHelpful;
});

// Virtual for helpful percentage
feedbackSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpful + this.notHelpful;
  return total > 0 ? Math.round((this.helpful / total) * 100) : 0;
});

// Pre-save middleware to update respondedAt when response is added
feedbackSchema.pre('save', function(next) {
  if (this.isModified('response') && this.response && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
