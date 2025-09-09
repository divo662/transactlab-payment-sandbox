import mongoose, { Document, Schema, Model } from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPES, TRANSACTION_CHANNELS } from '../utils/constants/transactionStatus';
import { PAYMENT_METHODS } from '../utils/constants/paymentMethods';
import { CURRENCIES } from '../utils/constants/currencies';

export interface ITransaction extends Document {
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  type: string;
  channel: string;
  merchantId: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  fees: number;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
  failureReason?: string;
  processedAt?: Date;
  expiresAt?: Date;
  callbackUrl?: string;
  webhookSent: boolean;
  webhookAttempts: number;
  lastWebhookAttempt?: Date;
  refundedAmount: number;
  refundedAt?: Date;
  chargebackAmount: number;
  chargebackAt?: Date;
  fraudScore?: number;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  accessCode?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  totalAmount: number;
  remainingAmount: number;
  isExpired: boolean;
  isRefundable: boolean;
}

const transactionSchema = new Schema<ITransaction>(
  {
    reference: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: {
        values: Object.values(CURRENCIES),
        message: 'Invalid currency'
      }
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Invalid payment method'
      }
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(TRANSACTION_STATUS),
        message: 'Invalid status'
      },
      default: TRANSACTION_STATUS.PENDING
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: Object.values(TRANSACTION_TYPES),
        message: 'Invalid transaction type'
      },
      default: TRANSACTION_TYPES.PAYMENT
    },
    channel: {
      type: String,
      required: [true, 'Channel is required'],
      enum: {
        values: Object.values(TRANSACTION_CHANNELS),
        message: 'Invalid channel'
      },
      default: TRANSACTION_CHANNELS.API
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerPhone: {
      type: String,
      trim: true
    },
    customerAddress: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      }
    },
    fees: {
      type: Number,
      default: 0,
      min: [0, 'Fees cannot be negative']
    },
    gatewayResponse: {
      type: Schema.Types.Mixed
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    failureReason: {
      type: String,
      trim: true
    },
    processedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      }
    },
    callbackUrl: {
      type: String,
      trim: true
    },
    webhookSent: {
      type: Boolean,
      default: false
    },
    webhookAttempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum webhook attempts exceeded']
    },
    lastWebhookAttempt: {
      type: Date
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative']
    },
    refundedAt: {
      type: Date
    },
    chargebackAmount: {
      type: Number,
      default: 0,
      min: [0, 'Chargeback amount cannot be negative']
    },
    chargebackAt: {
      type: Date
    },
    fraudScore: {
      type: Number,
      min: [0, 'Fraud score cannot be negative'],
      max: [100, 'Fraud score cannot exceed 100']
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    deviceFingerprint: {
      type: String,
      trim: true
    },
    accessCode: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ merchantId: 1 });
transactionSchema.index({ customerEmail: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ processedAt: -1 });
transactionSchema.index({ expiresAt: 1 });
transactionSchema.index({ 'metadata.orderId': 1 });

// Compound indexes
transactionSchema.index({ merchantId: 1, status: 1 });
transactionSchema.index({ merchantId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// Virtual for total amount (amount + fees)
transactionSchema.virtual('totalAmount').get(function () {
  return this.amount + this.fees;
});

// Virtual for remaining amount
transactionSchema.virtual('remainingAmount').get(function () {
  return this.amount - this.refundedAmount - this.chargebackAmount;
});

// Virtual for is expired
transactionSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for is refundable
transactionSchema.virtual('isRefundable').get(function () {
  return this.status === TRANSACTION_STATUS.SUCCESS && this.remainingAmount > 0;
});

// Pre-save middleware to generate reference if not provided
transactionSchema.pre('save', function (next) {
  if (!this.reference) {
    this.reference = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Pre-save middleware to update processedAt
transactionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === TRANSACTION_STATUS.SUCCESS && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Instance method to mark as processed
transactionSchema.methods.markAsProcessed = function (status: string, gatewayResponse?: Record<string, any>) {
  this.status = status;
  this.processedAt = new Date();
  if (gatewayResponse) {
    this.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Instance method to add refund
transactionSchema.methods.addRefund = function (amount: number) {
  if (amount > this.remainingAmount) {
    throw new Error('Refund amount cannot exceed remaining amount');
  }
  this.refundedAmount += amount;
  this.refundedAt = new Date();
  
  if (this.refundedAmount === this.amount) {
    this.status = TRANSACTION_STATUS.REFUNDED;
  } else if (this.refundedAmount > 0) {
    this.status = TRANSACTION_STATUS.PARTIALLY_REFUNDED;
  }
  
  return this.save();
};

// Instance method to add chargeback
transactionSchema.methods.addChargeback = function (amount: number) {
  if (amount > this.remainingAmount) {
    throw new Error('Chargeback amount cannot exceed remaining amount');
  }
  this.chargebackAmount += amount;
  this.chargebackAt = new Date();
  this.status = TRANSACTION_STATUS.CHARGEBACK;
  return this.save();
};

// Static method to find by reference
transactionSchema.statics.findByReference = function (reference: string) {
  return this.findOne({ reference: reference.toUpperCase() });
};

// Static method to find pending transactions
transactionSchema.statics.findPending = function () {
  return this.find({ status: TRANSACTION_STATUS.PENDING });
};

// Static method to find expired transactions
transactionSchema.statics.findExpired = function () {
  return this.find({
    status: TRANSACTION_STATUS.PENDING,
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = function (merchantId?: mongoose.Types.ObjectId) {
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

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction; 