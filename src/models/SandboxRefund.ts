import mongoose, { Document, Schema } from 'mongoose';

export interface ISandboxRefund extends Document {
  refundId: string;
  userId: string;
  transactionId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

const SandboxRefundSchema = new Schema<ISandboxRefund>({
  refundId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  customerEmail: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'NGN'
  },
  reason: {
    type: String,
    required: true,
    default: 'requested_by_customer'
  },
  status: {
    type: String,
    enum: ['succeeded', 'pending', 'failed', 'canceled'],
    default: 'succeeded'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SandboxRefundSchema.index({ userId: 1, customerEmail: 1 });
SandboxRefundSchema.index({ userId: 1, createdAt: -1 });
SandboxRefundSchema.index({ transactionId: 1 });

const SandboxRefund = mongoose.model<ISandboxRefund>('SandboxRefund', SandboxRefundSchema);

export default SandboxRefund;
