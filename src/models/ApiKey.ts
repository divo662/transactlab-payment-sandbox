import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IApiKey extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  secret: string;
  type: 'public' | 'secret' | 'test';
  permissions: string[];
  isActive: boolean;
  isRevoked: boolean;
  lastUsedAt?: Date;
  usageStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequestAt?: Date;
  };
  restrictions: {
    ipWhitelist: string[];
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    };
    allowedEndpoints: string[];
    blockedEndpoints: string[];
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    name: {
      type: String,
      required: [true, 'API key name is required'],
      trim: true,
      maxlength: [100, 'API key name cannot exceed 100 characters']
    },
    key: {
      type: String,
      required: [true, 'API key is required'],
      unique: true,
      select: false
    },
    secret: {
      type: String,
      required: [true, 'API secret is required'],
      select: false
    },
    type: {
      type: String,
      required: [true, 'API key type is required'],
      enum: {
        values: ['public', 'secret', 'test'],
        message: 'Invalid API key type'
      },
      default: 'test'
    },
    permissions: [{
      type: String,
      enum: {
        values: [
          'transactions.read',
          'transactions.write',
          'transactions.refund',
          'merchants.read',
          'merchants.write',
          'webhooks.read',
          'webhooks.write',
          'analytics.read',
          'subscriptions.read',
          'subscriptions.write',
          'customers.read',
          'customers.write'
        ],
        message: 'Invalid permission'
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    lastUsedAt: {
      type: Date
    },
    usageStats: {
      totalRequests: {
        type: Number,
        default: 0,
        min: [0, 'Total requests cannot be negative']
      },
      successfulRequests: {
        type: Number,
        default: 0,
        min: [0, 'Successful requests cannot be negative']
      },
      failedRequests: {
        type: Number,
        default: 0,
        min: [0, 'Failed requests cannot be negative']
      },
      lastRequestAt: {
        type: Date
      }
    },
    restrictions: {
      ipWhitelist: [{
        type: String,
        trim: true
      }],
      rateLimit: {
        requestsPerMinute: {
          type: Number,
          default: 60,
          min: [1, 'Rate limit must be at least 1 request per minute']
        },
        requestsPerHour: {
          type: Number,
          default: 1000,
          min: [1, 'Rate limit must be at least 1 request per hour']
        },
        requestsPerDay: {
          type: Number,
          default: 10000,
          min: [1, 'Rate limit must be at least 1 request per day']
        }
      },
      allowedEndpoints: [{
        type: String,
        trim: true
      }],
      blockedEndpoints: [{
        type: String,
        trim: true
      }]
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.key;
        delete ret.secret;
        return ret;
      }
    }
  }
);

// Indexes
apiKeySchema.index({ merchantId: 1 });
apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ merchantId: 1, type: 1 });
apiKeySchema.index({ merchantId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });

// Compound indexes
apiKeySchema.index({ merchantId: 1, type: 1, isActive: 1 });
apiKeySchema.index({ isActive: 1, isRevoked: 1 });

// Virtual for is valid
apiKeySchema.virtual('isValid').get(function (this: any) {
  if (this['isRevoked'] || !this['isActive']) return false;
  if (this['expiresAt'] && this['expiresAt'] < new Date()) return false;
  return true;
});

// Virtual for success rate
apiKeySchema.virtual('successRate').get(function (this: any) {
  if (this['usageStats']['totalRequests'] === 0) return 0;
  return (this['usageStats']['successfulRequests'] / this['usageStats']['totalRequests']) * 100;
});

// Virtual for is expired
apiKeySchema.virtual('isExpired').get(function (this: any) {
  return this['expiresAt'] && this['expiresAt'] < new Date();
});

// Pre-save middleware to generate API key and secret if not provided
apiKeySchema.pre('save', function (next) {
  if (!this['key']) {
    this['key'] = `pk_${this['type']}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
  if (!this['secret']) {
    this['secret'] = `sk_${this['type']}_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }
  next();
});

// Instance method to update usage statistics
apiKeySchema.methods['updateUsageStats'] = async function (success: boolean) {
  this['usageStats']['totalRequests'] += 1;
  this['lastUsedAt'] = new Date();
  this['usageStats']['lastRequestAt'] = new Date();
  
  if (success) {
    this['usageStats']['successfulRequests'] += 1;
  } else {
    this['usageStats']['failedRequests'] += 1;
  }
  
  return await this['save']();
};

// Instance method to revoke API key
apiKeySchema.methods['revoke'] = async function () {
  this['isRevoked'] = true;
  this['isActive'] = false;
  return await this['save']();
};

// Instance method to reactivate API key
apiKeySchema.methods['reactivate'] = async function () {
  this['isRevoked'] = false;
  this['isActive'] = true;
  return await this['save']();
};

// Instance method to add permission
apiKeySchema.methods['addPermission'] = async function (permission: string) {
  if (!this['permissions'].includes(permission)) {
    this['permissions'].push(permission);
    return await this['save']();
  }
  return this;
};

// Instance method to remove permission
apiKeySchema.methods['removePermission'] = async function (permission: string) {
  this['permissions'] = this['permissions'].filter((p: string) => p !== permission);
  return await this['save']();
};

// Instance method to check permission
apiKeySchema.methods['hasPermission'] = function (permission: string) {
  return this['permissions'].includes(permission);
};

// Instance method to check if endpoint is allowed
apiKeySchema.methods['isEndpointAllowed'] = function (endpoint: string) {
  // Check if endpoint is explicitly blocked
  if (this['restrictions']['blockedEndpoints'].includes(endpoint)) {
    return false;
  }
  
  // Check if there are allowed endpoints and this one is not in the list
  if (this['restrictions']['allowedEndpoints'].length > 0 && 
      !this['restrictions']['allowedEndpoints'].includes(endpoint)) {
    return false;
  }
  
  return true;
};

// Instance method to check IP whitelist
apiKeySchema.methods['isIpAllowed'] = function (ip: string) {
  if (this['restrictions']['ipWhitelist'].length === 0) return true;
  return this['restrictions']['ipWhitelist'].includes(ip);
};

// Static method to find active API keys for merchant
apiKeySchema.statics['findActiveByMerchant'] = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true, isRevoked: false });
};

// Static method to find API key by key string
apiKeySchema.statics['findByKey'] = function (key: string) {
  return this.findOne({ key }).select('+key +secret');
};

// Static method to find API keys by type
apiKeySchema.statics['findByType'] = function (merchantId: mongoose.Types.ObjectId, type: string) {
  return this.find({ merchantId, type, isActive: true, isRevoked: false });
};

// Static method to find expired API keys
apiKeySchema.statics['findExpired'] = function () {
  return this.find({
    expiresAt: { $lt: new Date() },
    isActive: true
  });
};

// Static method to get API key statistics
apiKeySchema.statics['getStats'] = function (merchantId?: mongoose.Types.ObjectId) {
  const match: any = {};
  if (merchantId) {
    match.merchantId = merchantId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalKeys: { $sum: 1 },
        activeKeys: {
          $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isRevoked', false] }] }, 1, 0] }
        },
        revokedKeys: {
          $sum: { $cond: [{ $eq: ['$isRevoked', true] }, 1, 0] }
        },
        totalRequests: { $sum: '$usageStats.totalRequests' },
        totalSuccess: { $sum: '$usageStats.successfulRequests' },
        totalFailures: { $sum: '$usageStats.failedRequests' }
      }
    }
  ]);
};

const ApiKey: Model<IApiKey> = mongoose.model<IApiKey>('ApiKey', apiKeySchema);

export default ApiKey; 