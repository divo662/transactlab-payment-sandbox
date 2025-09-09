import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWebhook extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  retryConfig: {
    maxRetries: number;
    retryDelay: number; // in seconds
    backoffMultiplier: number;
  };
  deliveryStats: {
    totalAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDeliveryAt?: Date;
    lastFailureAt?: Date;
  };
  settings: {
    includeHeaders: boolean;
    includeBody: boolean;
    timeout: number; // in milliseconds
    followRedirects: boolean;
    verifySsl: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    name: {
      type: String,
      required: [true, 'Webhook name is required'],
      trim: true,
      maxlength: [100, 'Webhook name cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: [true, 'Webhook URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    secret: {
      type: String,
      required: [true, 'Webhook secret is required'],
      select: false
    },
    events: [{
      type: String,
      required: [true, 'At least one event is required'],
      enum: {
        values: [
          'transaction.initialized',
          'transaction.successful',
          'transaction.failed',
          'transaction.cancelled',
          'transaction.expired',
          'refund.processed',
          'refund.failed',
          'chargeback.received',
          'chargeback.resolved',
          'subscription.created',
          'subscription.updated',
          'subscription.cancelled',
          'subscription.payment_successful',
          'subscription.payment_failed'
        ],
        message: 'Invalid event type'
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      select: false
    },
    retryConfig: {
      maxRetries: {
        type: Number,
        default: 3,
        min: [0, 'Max retries cannot be negative'],
        max: [10, 'Max retries cannot exceed 10']
      },
      retryDelay: {
        type: Number,
        default: 60,
        min: [1, 'Retry delay must be at least 1 second'],
        max: [3600, 'Retry delay cannot exceed 1 hour']
      },
      backoffMultiplier: {
        type: Number,
        default: 2,
        min: [1, 'Backoff multiplier must be at least 1'],
        max: [5, 'Backoff multiplier cannot exceed 5']
      }
    },
    deliveryStats: {
      totalAttempts: {
        type: Number,
        default: 0,
        min: [0, 'Total attempts cannot be negative']
      },
      successfulDeliveries: {
        type: Number,
        default: 0,
        min: [0, 'Successful deliveries cannot be negative']
      },
      failedDeliveries: {
        type: Number,
        default: 0,
        min: [0, 'Failed deliveries cannot be negative']
      },
      lastDeliveryAt: {
        type: Date
      },
      lastFailureAt: {
        type: Date
      }
    },
    settings: {
      includeHeaders: {
        type: Boolean,
        default: true
      },
      includeBody: {
        type: Boolean,
        default: true
      },
      timeout: {
        type: Number,
        default: 10000,
        min: [1000, 'Timeout must be at least 1 second'],
        max: [60000, 'Timeout cannot exceed 60 seconds']
      },
      followRedirects: {
        type: Boolean,
        default: true
      },
      verifySsl: {
        type: Boolean,
        default: true
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
        delete ret.secret;
        delete ret.verificationToken;
        return ret;
      }
    }
  }
);

// Indexes
webhookSchema.index({ merchantId: 1 });
webhookSchema.index({ merchantId: 1, isActive: 1 });
webhookSchema.index({ merchantId: 1, events: 1 });
webhookSchema.index({ url: 1 });
webhookSchema.index({ createdAt: -1 });

// Compound indexes
webhookSchema.index({ merchantId: 1, isActive: 1, events: 1 });

// Virtual for success rate
webhookSchema.virtual('successRate').get(function (this: any) {
  if (this.deliveryStats.totalAttempts === 0) return 0;
  return (this.deliveryStats.successfulDeliveries / this.deliveryStats.totalAttempts) * 100;
});

// Virtual for is healthy
webhookSchema.virtual('isHealthy').get(function (this: any) {
  return this.successRate >= 95; // 95% success rate threshold
});

// Pre-save middleware to generate secret if not provided
webhookSchema.pre('save', function (next) {
  if (!this.secret) {
    this.secret = `whsec_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
  next();
});

// Instance method to update delivery statistics
webhookSchema.methods.updateDeliveryStats = async function (success: boolean) {
  this.deliveryStats.totalAttempts += 1;
  
  if (success) {
    this.deliveryStats.successfulDeliveries += 1;
    this.deliveryStats.lastDeliveryAt = new Date();
  } else {
    this.deliveryStats.failedDeliveries += 1;
    this.deliveryStats.lastFailureAt = new Date();
  }
  
  return await this.save();
};

// Instance method to verify webhook
webhookSchema.methods.verify = async function () {
  this.isVerified = true;
  this.verificationToken = undefined;
  return await this.save();
};

// Instance method to toggle active status
webhookSchema.methods.toggleActive = async function () {
  this.isActive = !this.isActive;
  return await this.save();
};

// Instance method to add event
webhookSchema.methods.addEvent = async function (event: string) {
  if (!this.events.includes(event)) {
    this.events.push(event);
    return await this.save();
  }
  return this;
};

// Instance method to remove event
webhookSchema.methods.removeEvent = async function (event: string) {
  this.events = this.events.filter(e => e !== event);
  return await this.save();
};

// Instance method to generate signature
webhookSchema.methods.generateSignature = function (payload: string, timestamp: number) {
  const crypto = require('crypto');
  const message = `${timestamp}.${payload}`;
  return crypto.createHmac('sha256', this.secret).update(message).digest('hex');
};

// Static method to find active webhooks for merchant
webhookSchema.statics.findActiveByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true });
};

// Static method to find webhooks by event
webhookSchema.statics.findByEvent = function (merchantId: mongoose.Types.ObjectId, event: string) {
  return this.find({ merchantId, events: event, isActive: true });
};

// Static method to find verified webhooks
webhookSchema.statics.findVerified = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isVerified: true, isActive: true });
};

// Static method to get webhook statistics
webhookSchema.statics.getStats = function (merchantId?: mongoose.Types.ObjectId) {
  const match: any = {};
  if (merchantId) {
    match.merchantId = merchantId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalWebhooks: { $sum: 1 },
        activeWebhooks: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        verifiedWebhooks: {
          $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isVerified', true] }] }, 1, 0] }
        },
        totalAttempts: { $sum: '$deliveryStats.totalAttempts' },
        totalSuccess: { $sum: '$deliveryStats.successfulDeliveries' },
        totalFailures: { $sum: '$deliveryStats.failedDeliveries' }
      }
    }
  ]);
};

const Webhook: Model<IWebhook> = mongoose.model<IWebhook>('Webhook', webhookSchema);

export default Webhook; 