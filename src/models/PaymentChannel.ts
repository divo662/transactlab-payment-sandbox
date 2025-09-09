import mongoose, { Document, Schema, Model } from 'mongoose';
import { CURRENCIES } from '../utils/constants/currencies';
import { PAYMENT_METHODS } from '../utils/constants/paymentMethods';

export interface IPaymentChannel extends Document {
  merchantId: mongoose.Types.ObjectId;
  type: 'direct' | 'product' | 'subscription' | 'donation' | 'custom';
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  isDefault: boolean;
  settings: {
    allowedPaymentMethods: string[];
    supportedCurrencies: string[];
    defaultCurrency: string;
    allowPartialPayments: boolean;
    requireCustomerInfo: boolean;
    customerFields: string[];
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
    webhookUrl?: string;
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
      customCss?: string;
      pageTitle?: string;
      pageDescription?: string;
    };
    notifications: {
      email: boolean;
      sms: boolean;
      webhook: boolean;
    };
  };
  limits: {
    minimumAmount: number;
    maximumAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentChannelSchema = new Schema<IPaymentChannel>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    type: {
      type: String,
      required: [true, 'Payment channel type is required'],
      enum: {
        values: ['direct', 'product', 'subscription', 'donation', 'custom'],
        message: 'Invalid payment channel type'
      }
    },
    name: {
      type: String,
      required: [true, 'Payment channel name is required'],
      trim: true,
      maxlength: [100, 'Payment channel name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    settings: {
      allowedPaymentMethods: [{
        type: String,
        enum: {
          values: Object.values(PAYMENT_METHODS),
          message: 'Invalid payment method'
        }
      }],
      supportedCurrencies: [{
        type: String,
        enum: {
          values: Object.values(CURRENCIES),
          message: 'Invalid currency'
        }
      }],
      defaultCurrency: {
        type: String,
        required: [true, 'Default currency is required'],
        enum: {
          values: Object.values(CURRENCIES),
          message: 'Invalid default currency'
        }
      },
      allowPartialPayments: {
        type: Boolean,
        default: false
      },
      requireCustomerInfo: {
        type: Boolean,
        default: true
      },
      customerFields: [{
        type: String,
        enum: ['name', 'email', 'phone', 'address', 'company'],
        default: ['name', 'email']
      }],
      successRedirectUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
      },
      failureRedirectUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
      },
      webhookUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
      },
      branding: {
        primaryColor: {
          type: String,
          default: '#0a164d',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color']
        },
        secondaryColor: {
          type: String,
          default: '#1e3a8a',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color']
        },
        logoUrl: {
          type: String,
          trim: true
        },
        customCss: {
          type: String,
          trim: true
        },
        pageTitle: {
          type: String,
          trim: true,
          maxlength: [100, 'Page title cannot exceed 100 characters']
        },
        pageDescription: {
          type: String,
          trim: true,
          maxlength: [200, 'Page description cannot exceed 200 characters']
        }
      },
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
      }
    },
    limits: {
      minimumAmount: {
        type: Number,
        default: 0,
        min: [0, 'Minimum amount cannot be negative']
      },
      maximumAmount: {
        type: Number,
        min: [0, 'Maximum amount cannot be negative']
      },
      dailyLimit: {
        type: Number,
        min: [0, 'Daily limit cannot be negative']
      },
      monthlyLimit: {
        type: Number,
        min: [0, 'Monthly limit cannot be negative']
      }
    },
    fees: {
      percentage: {
        type: Number,
        default: 0,
        min: [0, 'Percentage fee cannot be negative'],
        max: [100, 'Percentage fee cannot exceed 100']
      },
      fixed: {
        type: Number,
        default: 0,
        min: [0, 'Fixed fee cannot be negative']
      },
      currency: {
        type: String,
        required: [true, 'Fee currency is required'],
        enum: {
          values: Object.values(CURRENCIES),
          message: 'Invalid fee currency'
        }
      }
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
paymentChannelSchema.index({ merchantId: 1 });
paymentChannelSchema.index({ merchantId: 1, type: 1 });
paymentChannelSchema.index({ merchantId: 1, isActive: 1 });
paymentChannelSchema.index({ slug: 1 }, { unique: true });
paymentChannelSchema.index({ merchantId: 1, isDefault: 1 });

// Compound indexes
paymentChannelSchema.index({ merchantId: 1, type: 1, isActive: 1 });

// Pre-save middleware to ensure only one default channel per merchant
paymentChannelSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await (this.constructor as any).updateMany(
      { merchantId: this.merchantId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for full branding settings
paymentChannelSchema.virtual('fullBranding').get(function (this: any) {
  return {
    ...this.settings.branding,
    hasCustomStyling: !!(this.settings.branding.customCss || this.settings.branding.logoUrl)
  };
});

// Virtual for is available
paymentChannelSchema.virtual('isAvailable').get(function (this: any) {
  return this.isActive;
});

// Instance method to calculate fees for an amount
paymentChannelSchema.methods.calculateFees = function (amount: number, currency: string) {
  if (!this.settings.supportedCurrencies.includes(currency)) {
    throw new Error(`Currency ${currency} is not supported for this payment channel`);
  }
  
  if (amount < this.limits.minimumAmount) {
    throw new Error(`Amount is below minimum limit of ${this.limits.minimumAmount}`);
  }
  
  if (this.limits.maximumAmount && amount > this.limits.maximumAmount) {
    throw new Error(`Amount exceeds maximum limit of ${this.limits.maximumAmount}`);
  }
  
  const percentageFee = (amount * this.fees.percentage) / 100;
  const totalFee = percentageFee + this.fees.fixed;
  
  return {
    amount,
    fee: totalFee,
    totalAmount: amount + totalFee,
    breakdown: {
      percentageFee,
      fixedFee: this.fees.fixed,
      totalFee
    }
  };
};

// Instance method to check if payment method is allowed
paymentChannelSchema.methods.allowsPaymentMethod = function (method: string) {
  return this.settings.allowedPaymentMethods.includes(method);
};

// Instance method to check if currency is supported
paymentChannelSchema.methods.supportsCurrency = function (currency: string) {
  return this.settings.supportedCurrencies.includes(currency);
};

// Instance method to toggle active status
paymentChannelSchema.methods.toggleActive = async function () {
  this.isActive = !this.isActive;
  return await this.save();
};

// Static method to find active channels for merchant
paymentChannelSchema.statics.findActiveByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true });
};

// Static method to find default channel for merchant
paymentChannelSchema.statics.findDefaultByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.findOne({ merchantId, isDefault: true, isActive: true });
};

// Static method to find channels by type
paymentChannelSchema.statics.findByType = function (merchantId: mongoose.Types.ObjectId, type: string) {
  return this.find({ merchantId, type, isActive: true });
};

// Static method to generate unique slug
paymentChannelSchema.statics.generateSlug = async function (name: string, merchantId: mongoose.Types.ObjectId) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let counter = 1;
  let finalSlug = slug;
  
  while (await this.findOne({ slug: finalSlug, merchantId })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
};

const PaymentChannel: Model<IPaymentChannel> = mongoose.model<IPaymentChannel>('PaymentChannel', paymentChannelSchema);

export default PaymentChannel;
