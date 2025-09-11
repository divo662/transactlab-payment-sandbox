import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxFraudReview extends Document {
  sessionId: string;
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  status: 'pending' | 'approved' | 'denied';
  reviewerId?: string;
  reviewerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxFraudReviewSchema = new Schema<ISandboxFraudReview>({
  sessionId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  factors: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending', index: true },
  reviewerId: { type: String },
  reviewerNote: { type: String }
}, { timestamps: true });

const SandboxFraudReview = mongoose.model<ISandboxFraudReview>('SandboxFraudReview', SandboxFraudReviewSchema);

export default SandboxFraudReview;


