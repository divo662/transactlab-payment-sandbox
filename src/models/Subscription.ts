import mongoose, { Document, Schema, Model } from 'mongoose';
import { CURRENCIES } from '../utils/constants/currencies';
import { PAYMENT_METHODS } from '../utils/constants/paymentMethods';

export interface ISubscription extends Document {
  merchantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  planId: string;
  planName: string;
  planDescription?: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount: number;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  endedAt?: Date;
  nextBillingDate: Date;
  totalBillingCycles?: number;
  billingCyclesCompleted: number;
  paymentMethod: string;
  metadata?: Record<string, any>;
  pausedAt?: Date;
  resumedAt?: Date;
  pauseReason?: string;
  settings: {
    autoRenew: boolean;
    prorationBehavior: 'create_prorations' | 'none';
    collectionMethod: 'charge_automatically' | 'send_invoice';
    daysUntilDue?: number;
    invoiceSettings?: {
      description?: string;
      footer?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    planId: {
      type: String,
      required: [true, 'Plan ID is required'],
      trim: true
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: [100, 'Plan name cannot exceed 100 characters']
    },
    planDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Plan description cannot exceed 500 characters']
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
    interval: {
      type: String,
      required: [true, 'Billing interval is required'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: 'Invalid billing interval'
      }
    },
    intervalCount: {
      type: Number,
      required: [true, 'Interval count is required'],
      min: [1, 'Interval count must be at least 1'],
      default: 1
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive', 'cancelled', 'past_due', 'unpaid', 'trialing', 'paused'],
        message: 'Invalid status'
      },
      default: 'active'
    },
    currentPeriodStart: {
      type: Date,
      required: [true, 'Current period start is required']
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, 'Current period end is required']
    },
    trialStart: {
      type: Date
    },
    trialEnd: {
      type: Date
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    nextBillingDate: {
      type: Date,
      required: [true, 'Next billing date is required']
    },
    totalBillingCycles: {
      type: Number,
      min: [1, 'Total billing cycles must be at least 1']
    },
    billingCyclesCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Billing cycles completed cannot be negative']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Invalid payment method'
      }
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    pausedAt: {
      type: Date
    },
    resumedAt: {
      type: Date
    },
    pauseReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Pause reason cannot exceed 500 characters']
    },
    settings: {
      autoRenew: {
        type: Boolean,
        default: true
      },
      prorationBehavior: {
        type: String,
        enum: {
          values: ['create_prorations', 'none'],
          message: 'Invalid proration behavior'
        },
        default: 'create_prorations'
      },
      collectionMethod: {
        type: String,
        enum: {
          values: ['charge_automatically', 'send_invoice'],
          message: 'Invalid collection method'
        },
        default: 'charge_automatically'
      },
      daysUntilDue: {
        type: Number,
        min: [1, 'Days until due must be at least 1'],
        max: [365, 'Days until due cannot exceed 365']
      },
      invoiceSettings: {
        description: {
          type: String,
          trim: true,
          maxlength: [200, 'Invoice description cannot exceed 200 characters']
        },
        footer: {
          type: String,
          trim: true,
          maxlength: [200, 'Invoice footer cannot exceed 200 characters']
        }
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
subscriptionSchema.index({ merchantId: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Compound indexes
subscriptionSchema.index({ merchantId: 1, status: 1 });
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ merchantId: 1, nextBillingDate: 1 });

// Virtual for is active
subscriptionSchema.virtual('isActive').get(function (this: any) {
  return this.status === 'active' || this.status === 'trialing';
});

// Virtual for is in trial
subscriptionSchema.virtual('isInTrial').get(function (this: any) {
  if (!this.trialEnd) return false;
  return this.trialEnd > new Date();
});

// Virtual for is cancelled
subscriptionSchema.virtual('isCancelled').get(function (this: any) {
  return this.status === 'cancelled' || this.cancelAtPeriodEnd;
});

// Virtual for is past due
subscriptionSchema.virtual('isPastDue').get(function (this: any) {
  return this.status === 'past_due' || this.status === 'unpaid';
});

// Virtual for days until next billing
subscriptionSchema.virtual('daysUntilNextBilling').get(function (this: any) {
  const now = new Date();
  const diffTime = this.nextBillingDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total amount paid
subscriptionSchema.virtual('totalAmountPaid').get(function (this: any) {
  return this.amount * this.billingCyclesCompleted;
});

// Pre-save middleware to calculate next billing date
subscriptionSchema.pre('save', function (next) {
  if (this.isModified('currentPeriodEnd') && !this.nextBillingDate) {
    this.nextBillingDate = this.currentPeriodEnd;
  }
  next();
});

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = async function (cancelAtPeriodEnd: boolean = true) {
  if (cancelAtPeriodEnd) {
    this.cancelAtPeriodEnd = true;
  } else {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.endedAt = new Date();
  }
  return await this.save();
};

// Instance method to reactivate subscription
subscriptionSchema.methods.reactivate = async function () {
  this.cancelAtPeriodEnd = false;
  this.status = 'active';
  this.cancelledAt = undefined;
  this.endedAt = undefined;
  return await this.save();
};

// Instance method to update billing cycle
subscriptionSchema.methods.updateBillingCycle = async function () {
  this.billingCyclesCompleted += 1;
  
  // Calculate next period dates
  const currentEnd = this.currentPeriodEnd;
  this.currentPeriodStart = currentEnd;
  
  // Calculate next period end based on interval
  const nextEnd = new Date(currentEnd);
  switch (this.interval) {
    case 'daily':
      nextEnd.setDate(nextEnd.getDate() + this.intervalCount);
      break;
    case 'weekly':
      nextEnd.setDate(nextEnd.getDate() + (7 * this.intervalCount));
      break;
    case 'monthly':
      nextEnd.setMonth(nextEnd.getMonth() + this.intervalCount);
      break;
    case 'yearly':
      nextEnd.setFullYear(nextEnd.getFullYear() + this.intervalCount);
      break;
  }
  
  this.currentPeriodEnd = nextEnd;
  this.nextBillingDate = nextEnd;
  
  return await this.save();
};

// Instance method to pause subscription
subscriptionSchema.methods.pause = async function () {
  this.status = 'inactive';
  return await this.save();
};

// Instance method to resume subscription
subscriptionSchema.methods.resume = async function () {
  this.status = 'active';
  return await this.save();
};

// Instance method to update amount
subscriptionSchema.methods.updateAmount = async function (newAmount: number) {
  this.amount = newAmount;
  return await this.save();
};

// Static method to find active subscriptions
subscriptionSchema.statics.findActive = function () {
  return this.find({ status: { $in: ['active', 'trialing'] } });
};

// Static method to find subscriptions by merchant
subscriptionSchema.statics.findByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId }).sort({ createdAt: -1 });
};

// Static method to find subscriptions by customer
subscriptionSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

// Static method to find subscriptions due for billing
subscriptionSchema.statics.findDueForBilling = function () {
  return this.find({
    status: { $in: ['active', 'trialing'] },
    nextBillingDate: { $lte: new Date() }
  });
};

// Static method to find cancelled subscriptions
subscriptionSchema.statics.findCancelled = function () {
  return this.find({
    $or: [
      { status: 'cancelled' },
      { cancelAtPeriodEnd: true }
    ]
  });
};

// Static method to get subscription statistics
subscriptionSchema.statics.getStats = function (merchantId?: mongoose.Types.ObjectId) {
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

// Static method to get subscription summary
subscriptionSchema.statics.getSummary = function (merchantId?: mongoose.Types.ObjectId) {
  const match: any = {};
  if (merchantId) {
    match.merchantId = merchantId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $in: ['$status', ['active', 'trialing']] }, 1, 0] }
        },
        cancelledSubscriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalRevenue: { $sum: { $multiply: ['$amount', '$billingCyclesCompleted'] } },
        avgMonthlyRevenue: { $avg: '$amount' }
      }
    }
  ]);
};

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription; 