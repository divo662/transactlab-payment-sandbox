import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISandboxTransaction extends Document {
  transactionId: string;
  userId: string;
  merchantId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  customerEmail: string;
  description?: string;
  metadata: {
    isTest: true;
    sandboxMode: true;
    testTimestamp: number;
    originalTransactionId?: string;
  };
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  webhookDelivered: boolean;
  webhookAttempts: number;
  lastWebhookAttempt?: Date;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
}

const sandboxTransactionSchema = new Schema<ISandboxTransaction>(
  {
    transactionId: {
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
    merchantId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true
    },
    description: {
      type: String
    },
    metadata: {
      isTest: {
        type: Boolean,
        default: true
      },
      sandboxMode: {
        type: Boolean,
        default: true
      },
      testTimestamp: {
        type: Number,
        required: true
      },
      originalTransactionId: String
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: String,
    refundedAt: Date,
    webhookDelivered: {
      type: Boolean,
      default: false
    },
    webhookAttempts: {
      type: Number,
      default: 0
    },
    lastWebhookAttempt: Date,
    processedAt: Date,
    failedAt: Date,
    cancelledAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for efficient querying
sandboxTransactionSchema.index({ userId: 1, status: 1 });
sandboxTransactionSchema.index({ userId: 1, createdAt: -1 });
sandboxTransactionSchema.index({ status: 1, createdAt: -1 });
sandboxTransactionSchema.index({ 'metadata.testTimestamp': -1 });

// Pre-save middleware to update timestamps based on status
sandboxTransactionSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case 'successful':
        this.processedAt = now;
        break;
      case 'failed':
        this.failedAt = now;
        break;
      case 'cancelled':
        this.cancelledAt = now;
        break;
      case 'refunded':
        this.refundedAt = now;
        break;
    }
  }
  
  next();
});

// Static method to get user's sandbox balance
sandboxTransactionSchema.statics.getUserBalance = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { userId, status: 'successful' } },
    {
      $group: {
        _id: '$currency',
        totalAmount: { $sum: '$amount' },
        totalRefunds: { $sum: { $ifNull: ['$refundAmount', 0] } }
      }
    },
    {
      $project: {
        currency: '$_id',
        balance: { $subtract: ['$totalAmount', '$totalRefunds'] },
        totalAmount: 1,
        totalRefunds: 1
      }
    }
  ]);
  
  return result;
};

// Static method to get user's transaction statistics
sandboxTransactionSchema.statics.getUserStats = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const stats = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalAmount: 0,
    successfulAmount: 0
  };
  
  result.forEach(item => {
    stats.totalTransactions += item.count;
    stats.totalAmount += item.totalAmount;
    
    switch (item._id) {
      case 'successful':
        stats.successfulTransactions = item.count;
        stats.successfulAmount = item.totalAmount;
        break;
      case 'failed':
        stats.failedTransactions = item.count;
        break;
      case 'pending':
        stats.pendingTransactions = item.count;
        break;
    }
  });
  
  return stats;
};

const SandboxTransaction: Model<ISandboxTransaction> = mongoose.model<ISandboxTransaction>('SandboxTransaction', sandboxTransactionSchema);

export default SandboxTransaction;
