import mongoose, { Document, Schema, Model } from 'mongoose';
import { CURRENCIES } from '../utils/constants/currencies';

export interface IPaymentLink extends Document {
  merchantId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  linkType: 'single' | 'product' | 'subscription' | 'donation' | 'custom';
  title: string;
  description?: string;
  amount: number;
  currency: string;
  quantity?: number;
  isActive: boolean;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  settings: {
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
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentLinkSchema = new Schema<IPaymentLink>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentChannel',
      required: [true, 'Payment channel ID is required']
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    linkType: {
      type: String,
      required: [true, 'Link type is required'],
      enum: {
        values: ['single', 'product', 'subscription', 'donation', 'custom'],
        message: 'Invalid link type'
      }
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
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
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date
    },
    maxUses: {
      type: Number,
      min: [1, 'Maximum uses must be at least 1']
    },
    currentUses: {
      type: Number,
      default: 0,
      min: [0, 'Current uses cannot be negative']
    },
    settings: {
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
paymentLinkSchema.index({ merchantId: 1 });
paymentLinkSchema.index({ channelId: 1 });
paymentLinkSchema.index({ productId: 1 });
paymentLinkSchema.index({ customerId: 1 });
paymentLinkSchema.index({ linkType: 1 });
paymentLinkSchema.index({ isActive: 1 });
paymentLinkSchema.index({ expiresAt: 1 });

// Compound indexes
paymentLinkSchema.index({ merchantId: 1, isActive: 1 });
paymentLinkSchema.index({ merchantId: 1, linkType: 1 });
paymentLinkSchema.index({ channelId: 1, isActive: 1 });

// Virtual for is expired
paymentLinkSchema.virtual('isExpired').get(function (this: any) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for is usable
paymentLinkSchema.virtual('isUsable').get(function (this: any) {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.maxUses && this.currentUses >= this.maxUses) return false;
  return true;
});

// Virtual for remaining uses
paymentLinkSchema.virtual('remainingUses').get(function (this: any) {
  if (!this.maxUses) return null;
  return Math.max(0, this.maxUses - this.currentUses);
});

// Virtual for total amount
paymentLinkSchema.virtual('totalAmount').get(function (this: any) {
  return this.amount * (this.quantity || 1);
});

// Virtual for payment link URL
paymentLinkSchema.virtual('paymentUrl').get(function (this: any) {
  return `/pay/${this._id}`;
});

// Pre-save middleware to set default values
paymentLinkSchema.pre('save', function (next) {
  if (this.linkType === 'product' && !this.productId) {
    throw new Error('Product ID is required for product payment links');
  }
  next();
});

// Instance method to increment usage
paymentLinkSchema.methods.incrementUsage = async function () {
  if (!this.isUsable) {
    throw new Error('Payment link is not usable');
  }
  
  this.currentUses += 1;
  return await this.save();
};

// Instance method to check if link can be used
paymentLinkSchema.methods.canBeUsed = function () {
  if (!this.isActive) return { canUse: false, reason: 'Link is not active' };
  if (this.isExpired) return { canUse: false, reason: 'Link has expired' };
  if (this.maxUses && this.currentUses >= this.maxUses) return { canUse: false, reason: 'Link usage limit reached' };
  
  return { canUse: true, reason: 'Link is available' };
};

// Instance method to get formatted amount
paymentLinkSchema.methods.getFormattedAmount = function () {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.totalAmount);
};

// Instance method to extend expiration
paymentLinkSchema.methods.extendExpiration = async function (days: number) {
  if (this.expiresAt) {
    this.expiresAt = new Date(this.expiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
  } else {
    this.expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  }
  return await this.save();
};

// Static method to find active links by merchant
paymentLinkSchema.statics.findActiveByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true });
};

// Static method to find links by type
paymentLinkSchema.statics.findByType = function (merchantId: mongoose.Types.ObjectId, type: string) {
  return this.find({ merchantId, linkType: type, isActive: true });
};

// Static method to find expired links
paymentLinkSchema.statics.findExpired = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({
    merchantId,
    expiresAt: { $lt: new Date() },
    isActive: true
  });
};

// Static method to find links by product
paymentLinkSchema.statics.findByProduct = function (productId: mongoose.Types.ObjectId) {
  return this.find({ productId, isActive: true });
};

// Static method to get link statistics
paymentLinkSchema.statics.getStats = function (merchantId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
    {
      $group: {
        _id: null,
        totalLinks: { $sum: 1 },
        activeLinks: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalUses: { $sum: '$currentUses' },
        totalAmount: { $sum: '$amount' },
        linkTypes: { $addToSet: '$linkType' }
      }
    }
  ]);
};

// Static method to cleanup expired links
paymentLinkSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      $set: { isActive: false }
    }
  );
  
  return result.modifiedCount;
};

const PaymentLink: Model<IPaymentLink> = mongoose.model<IPaymentLink>('PaymentLink', paymentLinkSchema);

export default PaymentLink;
