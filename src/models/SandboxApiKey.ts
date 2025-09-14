import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Define the interface for instance methods
interface ISandboxApiKeyMethods {
  generateApiKey(): string;
  generateSecretKey(): string;
  hasPermission(permission: string): boolean;
  isExpired(): boolean;
  canMakeRequest(): boolean;
  regenerateKeys(): { apiKey: string; secretKey: string };
}

// Define the interface for static methods
interface ISandboxApiKeyStatics extends Model<ISandboxApiKey> {
  findByApiKey(apiKey: string): Promise<ISandboxApiKey | null>;
  getOrCreateUserKey(userId: string): Promise<ISandboxApiKey>;
  updateUsage(apiKey: string): Promise<ISandboxApiKey | null>;
}

export interface ISandboxApiKey extends Document, ISandboxApiKeyMethods {
  userId: string; // Single user per API key
  apiKey: string; // Single permanent API key
  secretKey: string; // Single permanent secret key
  isActive: boolean; // Can be deactivated but not deleted
  lastUsed?: Date;
  usageCount: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  webhookUrl?: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'development' | 'testing';
  createdAt: Date;
  updatedAt: Date;
}

const SandboxApiKeySchema = new Schema<ISandboxApiKey>({
  userId: {
    type: String,
    required: true,
    unique: true, // Only one API key per user
    index: true
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
  isActive: {
    type: Boolean,
    default: true,
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
  environment: {
    type: String,
    enum: ['sandbox', 'development', 'testing'],
    default: 'sandbox'
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
  const prefix = 'tk_test';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxApiKeySchema.methods.generateSecretKey = function(this: any): string {
  const prefix = 'tk_test_secret';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

SandboxApiKeySchema.methods.hasPermission = function(this: any, permission: string): boolean {
  // All sandbox API keys have full permissions for simplicity
  return true;
};

SandboxApiKeySchema.methods.isExpired = function(this: any): boolean {
  // Permanent keys never expire
  return false;
};

SandboxApiKeySchema.methods.canMakeRequest = function(this: any): boolean {
  return this.isActive;
};

SandboxApiKeySchema.methods.regenerateKeys = function(this: any): { apiKey: string; secretKey: string } {
  const newApiKey = this.generateApiKey();
  const newSecretKey = this.generateSecretKey();
  
  this.apiKey = newApiKey;
  this.secretKey = newSecretKey;
  
  return { apiKey: newApiKey, secretKey: newSecretKey };
};

// Static methods
SandboxApiKeySchema.statics.findByApiKey = function(apiKey: string) {
  return this.findOne({ apiKey, isActive: true });
};

SandboxApiKeySchema.statics.getOrCreateUserKey = async function(userId: string): Promise<ISandboxApiKey> {
  let userKey = await this.findOne({ userId });
  
  if (!userKey) {
    // Create new permanent API key for user
    userKey = new this({
      userId,
      isActive: true,
      environment: 'sandbox'
    });
    await userKey.save();
  }
  
  return userKey;
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

const SandboxApiKey = mongoose.model<ISandboxApiKey, ISandboxApiKeyStatics>('SandboxApiKey', SandboxApiKeySchema);

export default SandboxApiKey;
