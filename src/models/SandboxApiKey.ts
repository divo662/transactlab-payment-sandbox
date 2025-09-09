import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Define the interface for instance methods
interface ISandboxApiKeyMethods {
  generateApiKey(): string;
  generateSecretKey(): string;
  hasPermission(permission: string): boolean;
  isExpired(): boolean;
  canMakeRequest(): boolean;
}

// Define the interface for static methods
interface ISandboxApiKeyStatics {
  findByApiKey(apiKey: string): Promise<ISandboxApiKey | null>;
  getUserKeys(userId: string): Promise<ISandboxApiKey[]>;
  deactivateKey(apiKey: string): Promise<ISandboxApiKey | null>;
  updateUsage(apiKey: string): Promise<ISandboxApiKey | null>;
}

export interface ISandboxApiKey extends Document, ISandboxApiKeyMethods {
  userId: string;
  name: string;
  apiKey: string;
  secretKey: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  usageCount: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  webhookUrl?: string;
  webhookSecret?: string;
  metadata: {
    createdFor: string;
    environment: 'sandbox' | 'development' | 'testing';
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SandboxApiKeySchema = new Schema<ISandboxApiKey>({
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
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  secretKey: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'payments:read',
      'payments:write',
      'customers:read',
      'customers:write',
      'webhooks:read',
      'webhooks:write',
      'transactions:read',
      'transactions:write',
      'refunds:read',
      'refunds:write',
      'subscriptions:read',
      'subscriptions:write'
    ],
    default: ['payments:read', 'payments:write', 'customers:read', 'webhooks:read']
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  webhookUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional
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
  webhookSecret: {
    type: String
  },
  metadata: {
    createdFor: {
      type: String,
      default: 'sandbox-testing'
    },
    environment: {
      type: String,
      enum: ['sandbox', 'development', 'testing'],
      default: 'sandbox'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      delete ret.secretKey; // Don't expose secret key in JSON
      return ret;
    }
  }
});

// Indexes for efficient querying
SandboxApiKeySchema.index({ userId: 1, isActive: 1 });
SandboxApiKeySchema.index({ apiKey: 1, isActive: 1 });
SandboxApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate keys before validation so required validators pass
SandboxApiKeySchema.pre('validate', function(this: any, next) {
  if (this.isNew && !this.apiKey) {
    this.apiKey = this.generateApiKey();
  }
  if (this.isNew && !this.secretKey) {
    this.secretKey = this.generateSecretKey();
  }
  next();
});

// Instance methods
SandboxApiKeySchema.methods.generateApiKey = function(this: any): string {
  const prefix = 'sk_test';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxApiKeySchema.methods.generateSecretKey = function(this: any): string {
  const prefix = 'sk_test_secret';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxApiKeySchema.methods.hasPermission = function(this: any, permission: string): boolean {
  return this.permissions.includes(permission);
};

SandboxApiKeySchema.methods.isExpired = function(this: any): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

SandboxApiKeySchema.methods.canMakeRequest = function(this: any): boolean {
  if (!this.isActive) return false;
  if (this.isExpired()) return false;
  return true;
};

// Static methods
SandboxApiKeySchema.statics.findByApiKey = function(apiKey: string) {
  return this.findOne({ apiKey, isActive: true });
};

SandboxApiKeySchema.statics.getUserKeys = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

SandboxApiKeySchema.statics.deactivateKey = function(apiKey: string) {
  return this.findOneAndUpdate(
    { apiKey },
    { isActive: false },
    { new: true }
  );
};

SandboxApiKeySchema.statics.updateUsage = function(apiKey: string) {
  return this.findOneAndUpdate(
    { apiKey },
    {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    },
    { new: true }
  );
};

const SandboxApiKey = mongoose.model<ISandboxApiKey, Model<ISandboxApiKey, {}, {}, {}, ISandboxApiKeyStatics>>('SandboxApiKey', SandboxApiKeySchema);

export default SandboxApiKey;
