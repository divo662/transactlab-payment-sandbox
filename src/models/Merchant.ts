import mongoose, { Document, Schema, Model } from 'mongoose';
import { CURRENCIES } from '../utils/constants/currencies';
import { PAYMENT_METHODS } from '../utils/constants/paymentMethods';

export interface IMerchant extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  logo?: string;
  website?: string;
  industry: string;
  description?: string;
  currencies: string[];
  paymentMethods: string[];
  webhookUrl?: string;
  webhookSecret?: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDocuments?: string[];
  monthlyTransactionLimit?: number;
  dailyTransactionLimit?: number;
  transactionVolume: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  lastTransactionAt?: Date;
  feeStructure?: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  settings: {
    notifications: {
      email: boolean;
      sms: boolean;
      webhook: boolean;
    };
    security: {
      twoFactorEnabled: boolean;
      ipWhitelist: string[];
      requireCvv: boolean;
    };
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
      customCss?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    businessPhone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    businessAddress: {
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
    logo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    currencies: [{
      type: String,
      enum: {
        values: Object.values(CURRENCIES),
        message: 'Invalid currency'
      }
    }],
    paymentMethods: [{
      type: String,
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Invalid payment method'
      }
    }],
    webhookUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    webhookSecret: {
      type: String,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDocuments: [{
      type: String,
      trim: true
    }],
    monthlyTransactionLimit: {
      type: Number,
      min: [0, 'Transaction limit cannot be negative']
    },
    dailyTransactionLimit: {
      type: Number,
      min: [0, 'Transaction limit cannot be negative']
    },
    transactionVolume: {
      type: Number,
      default: 0,
      min: [0, 'Transaction volume cannot be negative']
    },
    totalTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Total transactions cannot be negative']
    },
    successRate: {
      type: Number,
      default: 0,
      min: [0, 'Success rate cannot be negative'],
      max: [100, 'Success rate cannot exceed 100']
    },
    averageTransactionValue: {
      type: Number,
      default: 0,
      min: [0, 'Average transaction value cannot be negative']
    },
    lastTransactionAt: {
      type: Date
    },
    feeStructure: {
      percentage: {
        type: Number,
        default: 2.9,
        min: [0, 'Percentage fee cannot be negative'],
        max: [100, 'Percentage fee cannot exceed 100']
      },
      fixed: {
        type: Number,
        default: 30,
        min: [0, 'Fixed fee cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD',
        enum: {
          values: Object.values(CURRENCIES),
          message: 'Invalid currency for fee structure'
        }
      }
    },
    settings: {
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        webhook: {
          type: Boolean,
          default: true
        }
      },
      security: {
        twoFactorEnabled: {
          type: Boolean,
          default: false
        },
        ipWhitelist: [{
          type: String,
          trim: true
        }],
        requireCvv: {
          type: Boolean,
          default: true
        }
      },
      branding: {
        primaryColor: {
          type: String,
          default: '#007bff'
        },
        secondaryColor: {
          type: String,
          default: '#6c757d'
        },
        logoUrl: {
          type: String,
          trim: true
        },
        customCss: {
          type: String,
          trim: true
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.webhookSecret;
        return ret;
      }
    }
  }
);

// Indexes
merchantSchema.index({ userId: 1 }, { unique: true });
merchantSchema.index({ businessEmail: 1 });
merchantSchema.index({ businessName: 1 });
merchantSchema.index({ isActive: 1 });
merchantSchema.index({ isVerified: 1 });
merchantSchema.index({ createdAt: -1 });

// Compound indexes
merchantSchema.index({ isActive: 1, isVerified: 1 });
merchantSchema.index({ industry: 1, isActive: 1 });

// Virtual for full business address
merchantSchema.virtual('fullAddress').get(function (this: any) {
  if (!this.businessAddress) return null;
  const addr = this.businessAddress;
  return `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country} ${addr.postalCode}`.trim();
});

// Virtual for is fully verified
merchantSchema.virtual('isFullyVerified').get(function (this: any) {
  return this.isVerified && this.verificationDocuments && this.verificationDocuments.length > 0;
});

// Pre-save middleware to generate webhook secret if not provided
merchantSchema.pre('save', function (next) {
  if (this.webhookUrl && !this.webhookSecret) {
    this.webhookSecret = `whsec_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
  next();
});

// Instance method to update transaction statistics
merchantSchema.methods.updateTransactionStats = async function (amount: number, success: boolean) {
  this.totalTransactions += 1;
  this.transactionVolume += amount;
  this.lastTransactionAt = new Date();
  
  if (success) {
    const currentSuccessRate = this.successRate;
    const totalSuccess = (currentSuccessRate * (this.totalTransactions - 1)) / 100;
    this.successRate = ((totalSuccess + 1) / this.totalTransactions) * 100;
  }
  
  this.averageTransactionValue = this.transactionVolume / this.totalTransactions;
  
  return await this.save();
};

// Instance method to check transaction limits
merchantSchema.methods.checkTransactionLimits = function (amount: number) {
  if (this.dailyTransactionLimit && this.transactionVolume + amount > this.dailyTransactionLimit) {
    throw new Error('Daily transaction limit exceeded');
  }
  
  if (this.monthlyTransactionLimit && this.transactionVolume + amount > this.monthlyTransactionLimit) {
    throw new Error('Monthly transaction limit exceeded');
  }
  
  return true;
};

// Static method to find active merchants
merchantSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find verified merchants
merchantSchema.statics.findVerified = function () {
  return this.find({ isVerified: true, isActive: true });
};

// Static method to get merchant statistics
merchantSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalMerchants: { $sum: 1 },
        activeMerchants: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        verifiedMerchants: {
          $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isVerified', true] }] }, 1, 0] }
        },
        totalTransactionVolume: { $sum: '$transactionVolume' },
        avgSuccessRate: { $avg: '$successRate' }
      }
    }
  ]);
};

const Merchant: Model<IMerchant> = mongoose.model<IMerchant>('Merchant', merchantSchema);

export default Merchant; 