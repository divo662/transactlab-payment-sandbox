import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Define the interface for instance methods
interface ISandboxSessionMethods {
  generateSessionId(): string;
  isExpired(): boolean;
  canBeProcessed(): boolean;
  getCheckoutUrl(): string;
  getTimeUntilExpiry(): number;
  getFormattedAmount(): string;
  getPaymentMethod(): string;
}

// Define the interface for static methods
interface ISandboxSessionStatics extends Model<ISandboxSession> {
  findBySessionId(sessionId: string): Promise<ISandboxSession | null>;
  findByUserId(userId: string, options: { limit?: number; status?: string }): Promise<ISandboxSession[]>;
  findExpiredSessions(): Promise<ISandboxSession[]>;
  expireSessions(): Promise<any>;
  getUserStats(userId: string): Promise<any[]>;
}

export interface ISandboxSession extends Document, ISandboxSessionMethods {
  sessionId: string;
  userId: string;
  apiKeyId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  productImage?: string;
  productName?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata: {
    source: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  paymentConfig: {
    allowedPaymentMethods: string[];
    requireCustomerEmail: boolean;
    requireCustomerName: boolean;
    autoCapture: boolean;
    captureAmount?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  expiresAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  webhookDelivered: boolean;
  webhookAttempts: number;
  lastWebhookAttempt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxSessionSchema = new Schema<ISandboxSession>({
  sessionId: {
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
  apiKeyId: {
    type: String,
    required: true,
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
    uppercase: true,
    enum: ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v);
      },
      message: 'Invalid email format'
    }
  },
  customerName: {
    type: String,
    trim: true
  },
  productImage: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true
  },
  successUrl: {
    type: String,
    required: false
  },
  cancelUrl: {
    type: String,
    required: false
  },
  metadata: {
    source: {
      type: String,
      default: 'sandbox-checkout'
    },
    tags: [String],
    customFields: Schema.Types.Mixed
  },
  paymentConfig: {
    allowedPaymentMethods: {
      type: [String],
      enum: ['card', 'bank_transfer', 'mobile_money', 'crypto', 'wallet'],
      default: ['card']
    },
    requireCustomerEmail: {
      type: Boolean,
      default: false
    },
    requireCustomerName: {
      type: Boolean,
      default: false
    },
    autoCapture: {
      type: Boolean,
      default: true
    },
    captureAmount: {
      type: Number,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
    default: 'pending',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: Date,
  cancelledAt: Date,
  failedAt: Date,
  failureReason: String,
  refundedAt: Date,
  refundAmount: Number,
  webhookDelivered: {
    type: Boolean,
    default: false
  },
  webhookAttempts: {
    type: Number,
    default: 0
  },
  lastWebhookAttempt: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient querying
SandboxSessionSchema.index({ userId: 1, status: 1 });
SandboxSessionSchema.index({ userId: 1, createdAt: -1 });
SandboxSessionSchema.index({ status: 1, expiresAt: 1 });
SandboxSessionSchema.index({ apiKeyId: 1, status: 1 });

// Generate critical fields before validation so required validators pass
SandboxSessionSchema.pre('validate', function(this: any, next) {
  if (this.isNew && !this.sessionId) {
    this.sessionId = this.generateSessionId();
  }
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes default
  }
  next();
});

// Pre-save middleware to update timestamps based on status
SandboxSessionSchema.pre('save', function(this: any, next) {
  const now = new Date();
  if (this.isModified('status')) {
    switch (this.status) {
      case 'completed':
        this.completedAt = now;
        break;
      case 'cancelled':
        this.cancelledAt = now;
        break;
      case 'failed':
        this.failedAt = now;
        break;
      case 'expired':
        break;
    }
  }
  next();
});

// Instance methods
SandboxSessionSchema.methods.generateSessionId = function(this: any): string {
  const prefix = 'sess';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxSessionSchema.methods.isExpired = function(this: any): boolean {
  return new Date() > this.expiresAt;
};

SandboxSessionSchema.methods.canBeProcessed = function(this: any): boolean {
  if (this.status !== 'pending') return false;
  if (this.isExpired()) return false;
  return true;
};

SandboxSessionSchema.methods.getCheckoutUrl = function(this: any): string {
  return `/checkout/${this.sessionId}`;
};

SandboxSessionSchema.methods.getTimeUntilExpiry = function(this: any): number {
  return Math.max(0, this.expiresAt.getTime() - Date.now());
};

SandboxSessionSchema.methods.getFormattedAmount = function(this: any): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount / 100);
};

SandboxSessionSchema.methods.getPaymentMethod = function(this: any): string {
  return (this.metadata as any)?.customFields?.paymentMethodUsed || 'card';
};

// Static methods
SandboxSessionSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ sessionId, status: { $ne: 'expired' } });
};

SandboxSessionSchema.statics.findByUserId = function(userId: string, options: { limit?: number; status?: string } = {}) {
  const query: any = { userId };
  if (options.status) query.status = options.status;
  const queryBuilder = this.find(query).sort({ createdAt: -1 });
  if (options.limit) queryBuilder.limit(options.limit);
  return queryBuilder;
};

SandboxSessionSchema.statics.findExpiredSessions = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  });
};

SandboxSessionSchema.statics.expireSessions = function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
};

SandboxSessionSchema.statics.getUserStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

const SandboxSession = mongoose.model<ISandboxSession, ISandboxSessionStatics>('SandboxSession', SandboxSessionSchema);

export default SandboxSession;
