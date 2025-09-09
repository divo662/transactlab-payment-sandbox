import mongoose, { Document, Schema, Model } from 'mongoose';
import { TransactionStatus } from '../utils/constants/transactionStatus';

export interface IRefund extends Document {
  transactionId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'full' | 'partial';
  refundMethod: 'original_payment_method' | 'bank_transfer' | 'wallet';
  processedAt?: Date;
  failureReason?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
  initiatedBy: {
    userId: mongoose.Types.ObjectId;
    userType: 'merchant' | 'admin' | 'system';
    ipAddress?: string;
  };
  approvalInfo?: {
    approvedBy: mongoose.Types.ObjectId;
    approvedAt: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required']
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    reference: {
      type: String,
      required: [true, 'Refund reference is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      required: [true, 'Refund status is required'],
      enum: {
        values: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        message: 'Invalid refund status'
      },
      default: 'pending'
    },
    type: {
      type: String,
      required: [true, 'Refund type is required'],
      enum: {
        values: ['full', 'partial'],
        message: 'Invalid refund type'
      }
    },
    refundMethod: {
      type: String,
      required: [true, 'Refund method is required'],
      enum: {
        values: ['original_payment_method', 'bank_transfer', 'wallet'],
        message: 'Invalid refund method'
      },
      default: 'original_payment_method'
    },
    processedAt: {
      type: Date
    },
    failureReason: {
      type: String,
      trim: true
    },
    gatewayResponse: {
      type: Schema.Types.Mixed
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    initiatedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
      },
      userType: {
        type: String,
        required: [true, 'User type is required'],
        enum: {
          values: ['merchant', 'admin', 'system'],
          message: 'Invalid user type'
        }
      },
      ipAddress: {
        type: String,
        trim: true
      }
    },
    approvalInfo: {
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: {
        type: Date
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Approval notes cannot exceed 500 characters']
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
refundSchema.index({ reference: 1 }, { unique: true });
refundSchema.index({ transactionId: 1 });
refundSchema.index({ merchantId: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });
refundSchema.index({ processedAt: -1 });

// Compound indexes
refundSchema.index({ merchantId: 1, status: 1 });
refundSchema.index({ merchantId: 1, createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });

// Virtual for is completed
refundSchema.virtual('isCompleted').get(function (this: any) {
  return this.status === 'completed';
});

// Virtual for is pending
refundSchema.virtual('isPending').get(function (this: any) {
  return this.status === 'pending';
});

// Virtual for is failed
refundSchema.virtual('isFailed').get(function (this: any) {
  return this.status === 'failed';
});

// Pre-save middleware to generate reference if not provided
refundSchema.pre('save', function (next) {
  if (!this.reference) {
    this.reference = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Pre-save middleware to update processedAt
refundSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Instance method to mark as processed
refundSchema.methods.markAsProcessed = function (status: string, gatewayResponse?: Record<string, any>) {
  this.status = status;
  this.processedAt = new Date();
  if (gatewayResponse) {
    this.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Instance method to approve refund
refundSchema.methods.approve = async function (approvedBy: mongoose.Types.ObjectId, notes?: string) {
  this.approvalInfo = {
    approvedBy,
    approvedAt: new Date(),
    notes
  };
  return await this.save();
};

// Instance method to cancel refund
refundSchema.methods.cancel = async function (reason?: string) {
  this.status = 'cancelled';
  if (reason) {
    this.failureReason = reason;
  }
  return await this.save();
};

// Static method to find by reference
refundSchema.statics.findByReference = function (reference: string) {
  return this.findOne({ reference: reference.toUpperCase() });
};

// Static method to find pending refunds
refundSchema.statics.findPending = function () {
  return this.find({ status: 'pending' });
};

// Static method to find refunds by transaction
refundSchema.statics.findByTransaction = function (transactionId: mongoose.Types.ObjectId) {
  return this.find({ transactionId }).sort({ createdAt: -1 });
};

// Static method to find refunds by merchant
refundSchema.statics.findByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId }).sort({ createdAt: -1 });
};

// Static method to get refund statistics
refundSchema.statics.getStats = function (merchantId?: mongoose.Types.ObjectId) {
  const match: any = {};
  if (merchantId) {
    match.merchantId = merchantId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Static method to get refund summary
refundSchema.statics.getSummary = function (merchantId?: mongoose.Types.ObjectId) {
  const match: any = {};
  if (merchantId) {
    match.merchantId = merchantId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedRefunds: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingRefunds: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedRefunds: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

const Refund: Model<IRefund> = mongoose.model<IRefund>('Refund', refundSchema);

export default Refund; 