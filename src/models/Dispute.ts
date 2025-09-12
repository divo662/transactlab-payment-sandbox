import mongoose, { Document, Schema } from 'mongoose';

export interface IDispute extends Document {
  disputeId: string;
  transactionId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  customerEmail: string;
  amount: number;
  currency: string;
  reason: DisputeReason;
  status: DisputeStatus;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // AI Prevention Data
  preventionAttempted: boolean;
  preventionSuccess: boolean;
  preventionMethod?: string;
  preventionTimestamp?: Date;
  
  // Auto-Win Engine Data
  autoWinEnabled: boolean;
  autoWinConfidence: number;
  autoWinStatus: 'pending' | 'processing' | 'won' | 'lost' | 'expired';
  evidenceSubmitted: boolean;
  evidenceSubmissionDate?: Date;
  
  // Evidence Collection
  evidence: {
    deliveryProof?: string;
    communicationLogs?: string[];
    accessLogs?: string[];
    paymentProof?: string;
    customerAgreement?: string;
    timestampProofs?: Array<{
      action: string;
      timestamp: Date;
      proof: string;
    }>;
  };
  
  // AI Analysis
  aiAnalysis: {
    riskFactors: string[];
    preventionRecommendations: string[];
    evidenceStrength: number;
    winProbability: number;
    lastAnalyzed: Date;
  };
  
  // Timeline
  filedAt: Date;
  responseDeadline: Date;
  resolvedAt?: Date;
  resolutionReason?: string;
  
  // Financial Impact
  disputeFee: number;
  potentialLoss: number;
  actualLoss: number;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type DisputeReason = 
  | 'fraudulent'
  | 'unauthorized'
  | 'product_not_received'
  | 'product_unacceptable'
  | 'duplicate'
  | 'subscription_cancelled'
  | 'credit_not_processed'
  | 'other';

export type DisputeStatus = 
  | 'prevented'
  | 'filed'
  | 'under_review'
  | 'evidence_required'
  | 'won'
  | 'lost'
  | 'expired'
  | 'cancelled';

const EvidenceSchema = new Schema({
  deliveryProof: { type: String },
  communicationLogs: [{ type: String }],
  accessLogs: [{ type: String }],
  paymentProof: { type: String },
  customerAgreement: { type: String },
  timestampProofs: [{
    action: { type: String, required: true },
    timestamp: { type: Date, required: true },
    proof: { type: String, required: true }
  }]
}, { _id: false });

const AIAnalysisSchema = new Schema({
  riskFactors: [{ type: String }],
  preventionRecommendations: [{ type: String }],
  evidenceStrength: { type: Number, min: 0, max: 100, default: 0 },
  winProbability: { type: Number, min: 0, max: 100, default: 0 },
  lastAnalyzed: { type: Date, default: Date.now }
}, { _id: false });

const DisputeSchema = new Schema<IDispute>({
  disputeId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  transactionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Transaction', 
    required: true 
  },
  merchantId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Merchant', 
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: { 
    type: String, 
    required: true,
    uppercase: true
  },
  reason: {
    type: String,
    enum: [
      'fraudulent',
      'unauthorized', 
      'product_not_received',
      'product_unacceptable',
      'duplicate',
      'subscription_cancelled',
      'credit_not_processed',
      'other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: [
      'prevented',
      'filed',
      'under_review',
      'evidence_required',
      'won',
      'lost',
      'expired',
      'cancelled'
    ],
    default: 'filed'
  },
  riskScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // AI Prevention
  preventionAttempted: { type: Boolean, default: false },
  preventionSuccess: { type: Boolean, default: false },
  preventionMethod: { type: String },
  preventionTimestamp: { type: Date },
  
  // Auto-Win Engine
  autoWinEnabled: { type: Boolean, default: true },
  autoWinConfidence: { type: Number, min: 0, max: 100, default: 0 },
  autoWinStatus: {
    type: String,
    enum: ['pending', 'processing', 'won', 'lost', 'expired'],
    default: 'pending'
  },
  evidenceSubmitted: { type: Boolean, default: false },
  evidenceSubmissionDate: { type: Date },
  
  // Evidence
  evidence: { type: EvidenceSchema, default: () => ({}) },
  
  // AI Analysis
  aiAnalysis: { type: AIAnalysisSchema, default: () => ({}) },
  
  // Timeline
  filedAt: { type: Date, default: Date.now },
  responseDeadline: { 
    type: Date, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  resolvedAt: { type: Date },
  resolutionReason: { type: String },
  
  // Financial Impact
  disputeFee: { type: Number, default: 0 },
  potentialLoss: { type: Number, default: 0 },
  actualLoss: { type: Number, default: 0 },
  
  // Metadata
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { 
  timestamps: true,
  collection: 'disputes'
});

// Indexes for performance
DisputeSchema.index({ disputeId: 1 });
DisputeSchema.index({ transactionId: 1 });
DisputeSchema.index({ merchantId: 1 });
DisputeSchema.index({ status: 1 });
DisputeSchema.index({ riskLevel: 1 });
DisputeSchema.index({ filedAt: -1 });
DisputeSchema.index({ responseDeadline: 1 });

// Virtual for days until deadline
DisputeSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = this.responseDeadline;
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to update AI analysis
DisputeSchema.methods.updateAIAnalysis = function(analysis: Partial<typeof this.aiAnalysis>) {
  this.aiAnalysis = { ...this.aiAnalysis, ...analysis, lastAnalyzed: new Date() };
  return this.save();
};

// Instance method to add evidence
DisputeSchema.methods.addEvidence = function(type: string, proof: string) {
  if (type === 'communicationLogs' || type === 'accessLogs') {
    this.evidence[type].push(proof);
  } else {
    this.evidence[type] = proof;
  }
  return this.save();
};

// Instance method to add timestamp proof
DisputeSchema.methods.addTimestampProof = function(action: string, proof: string) {
  this.evidence.timestampProofs.push({
    action,
    timestamp: new Date(),
    proof
  });
  return this.save();
};

// Static method to find high-risk disputes
DisputeSchema.statics.findHighRisk = function() {
  return this.find({ 
    riskLevel: { $in: ['high', 'critical'] },
    status: { $in: ['filed', 'under_review'] }
  });
};

// Static method to find disputes needing evidence
DisputeSchema.statics.findNeedingEvidence = function() {
  return this.find({ 
    status: 'evidence_required',
    evidenceSubmitted: false,
    responseDeadline: { $gt: new Date() }
  });
};

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
