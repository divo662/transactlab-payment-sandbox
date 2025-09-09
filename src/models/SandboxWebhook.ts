import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Define the interface for instance methods
interface ISandboxWebhookMethods {
  generateWebhookSecret(): string;
  supportsEvent(event: string): boolean;
  getDeliveryRate(): number;
  recordSuccessfulDelivery(): void;
  recordFailedDelivery(): void;
  calculateRetryDelay(attemptNumber: number): number;
}

// Define the interface for static methods
interface ISandboxWebhookStatics extends Model<ISandboxWebhook> {
  findByUserId(userId: string): Promise<ISandboxWebhook[]>;
  findByEvent(event: string): Promise<ISandboxWebhook[]>;
  deactivateWebhook(webhookId: string): Promise<ISandboxWebhook | null>;
}

export interface ISandboxWebhook extends Document, ISandboxWebhookMethods {
  userId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryConfig: {
    maxRetries: number;
    retryDelay: number; // in milliseconds
    backoffMultiplier: number;
  };
  deliveryStats: {
    totalAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastSuccessfulDelivery?: Date;
    lastFailedDelivery?: Date;
  };
  metadata: {
    description?: string;
    tags?: string[];
    environment: 'sandbox' | 'development' | 'testing';
  };
  createdAt: Date;
  updatedAt: Date;
}

const SandboxWebhookSchema = new Schema<ISandboxWebhook>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid webhook URL format'
    }
  },
  secret: {
    type: String,
    required: true
  },
  events: [{
    type: String,
    enum: [
      'payment.completed',
      'payment.failed',
      'payment.cancelled',
      'payment.refunded',
      'customer.created',
      'customer.updated',
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'invoice.created',
      'invoice.paid',
      'webhook.test'
    ],
    default: ['payment.completed', 'payment.failed']
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  retryConfig: {
    maxRetries: {
      type: Number,
      default: 3
    },
    retryDelay: {
      type: Number,
      default: 5000 // 5 seconds
    },
    backoffMultiplier: {
      type: Number,
      default: 2
    }
  },
  deliveryStats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    lastSuccessfulDelivery: Date,
    lastFailedDelivery: Date
  },
  metadata: {
    description: String,
    tags: [String],
    environment: {
      type: String,
      enum: ['sandbox', 'development', 'testing'],
      default: 'sandbox'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      delete ret.secret; // Don't expose secret in JSON
      return ret;
    }
  }
});

// Indexes for efficient querying
SandboxWebhookSchema.index({ userId: 1, isActive: 1 });
SandboxWebhookSchema.index({ url: 1 });
SandboxWebhookSchema.index({ events: 1 });

// Generate secret before validation so required validators pass
SandboxWebhookSchema.pre('validate', function(this: any, next) {
  if (this.isNew && !this.secret) {
    this.secret = this.generateWebhookSecret();
  }
  next();
});

// Instance methods
SandboxWebhookSchema.methods.generateWebhookSecret = function(this: any): string {
  const prefix = 'whsec';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxWebhookSchema.methods.supportsEvent = function(this: any, event: string): boolean {
  return this.events.includes(event);
};

SandboxWebhookSchema.methods.getDeliveryRate = function(this: any): number {
  if (this.deliveryStats.totalAttempts === 0) return 0;
  return (this.deliveryStats.successfulDeliveries / this.deliveryStats.totalAttempts) * 100;
};

SandboxWebhookSchema.methods.recordSuccessfulDelivery = function(this: any) {
  this.deliveryStats.totalAttempts += 1;
  this.deliveryStats.successfulDeliveries += 1;
  this.deliveryStats.lastSuccessfulDelivery = new Date();
};

SandboxWebhookSchema.methods.recordFailedDelivery = function(this: any) {
  this.deliveryStats.totalAttempts += 1;
  this.deliveryStats.failedDeliveries += 1;
  this.deliveryStats.lastFailedDelivery = new Date();
};

SandboxWebhookSchema.methods.calculateRetryDelay = function(this: any, attemptNumber: number): number {
  const baseDelay = this.retryConfig.retryDelay;
  const multiplier = Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1);
  return baseDelay * multiplier;
};

// Static methods
SandboxWebhookSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

SandboxWebhookSchema.statics.findByEvent = function(event: string) {
  return this.find({ events: event, isActive: true });
};

SandboxWebhookSchema.statics.deactivateWebhook = function(webhookId: string) {
  return this.findByIdAndUpdate(
    webhookId,
    { isActive: false },
    { new: true }
  );
};

const SandboxWebhook = mongoose.model<ISandboxWebhook, ISandboxWebhookStatics>('SandboxWebhook', SandboxWebhookSchema);

export default SandboxWebhook;
