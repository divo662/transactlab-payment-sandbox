import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxFraudDecision extends Document {
  sessionId: string;
  userId: string;
  amountMinor?: number;
  currency?: string;
  action: 'allow' | 'block' | 'review' | 'flag';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations?: string[];
  createdAt: Date;
}

const SandboxFraudDecisionSchema = new Schema<ISandboxFraudDecision>({
  sessionId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  amountMinor: { type: Number },
  currency: { type: String },
  action: { type: String, enum: ['allow', 'block', 'review', 'flag'], required: true },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  factors: { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const SandboxFraudDecision = mongoose.model<ISandboxFraudDecision>('SandboxFraudDecision', SandboxFraudDecisionSchema);

export default SandboxFraudDecision;


