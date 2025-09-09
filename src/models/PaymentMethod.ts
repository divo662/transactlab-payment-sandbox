import mongoose, { Document, Schema, Model } from 'mongoose';
import { PAYMENT_METHODS, CardType, BankCode, MobileMoneyProvider } from '../utils/constants/paymentMethods';
import { CURRENCIES } from '../utils/constants/currencies';

export interface IPaymentMethod extends Document {
  merchantId: mongoose.Types.ObjectId;
  type: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed: number;
    minimum: number;
    maximum: number;
  };
  limits: {
    minimumAmount: number;
    maximumAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  settings: {
    requireCvv: boolean;
    requireBillingAddress: boolean;
    requireShippingAddress: boolean;
    allowPartialPayments: boolean;
    autoCapture: boolean;
    captureDelay?: number; // in minutes
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    type: {
      type: String,
      required: [true, 'Payment method type is required'],
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Invalid payment method type'
      }
    },
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      maxlength: [50, 'Payment method name cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    supportedCurrencies: [{
      type: String,
      enum: {
        values: Object.values(CURRENCIES),
        message: 'Invalid currency'
      }
    }],
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
      minimum: {
        type: Number,
        default: 0,
        min: [0, 'Minimum fee cannot be negative']
      },
      maximum: {
        type: Number,
        min: [0, 'Maximum fee cannot be negative']
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
    settings: {
      requireCvv: {
        type: Boolean,
        default: true
      },
      requireBillingAddress: {
        type: Boolean,
        default: false
      },
      requireShippingAddress: {
        type: Boolean,
        default: false
      },
      allowPartialPayments: {
        type: Boolean,
        default: false
      },
      autoCapture: {
        type: Boolean,
        default: true
      },
      captureDelay: {
        type: Number,
        min: [0, 'Capture delay cannot be negative']
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
paymentMethodSchema.index({ merchantId: 1 });
paymentMethodSchema.index({ merchantId: 1, type: 1 });
paymentMethodSchema.index({ merchantId: 1, isActive: 1 });
paymentMethodSchema.index({ merchantId: 1, isDefault: 1 });

// Compound indexes
paymentMethodSchema.index({ merchantId: 1, type: 1, isActive: 1 });

// Virtual for total fee calculation
paymentMethodSchema.virtual('calculateFee').get(function (this: any, amount: number) {
  const percentageFee = (amount * this.fees.percentage) / 100;
  const totalFee = percentageFee + this.fees.fixed;
  
  if (this.fees.minimum && totalFee < this.fees.minimum) {
    return this.fees.minimum;
  }
  
  if (this.fees.maximum && totalFee > this.fees.maximum) {
    return this.fees.maximum;
  }
  
  return totalFee;
});

// Virtual for is available
paymentMethodSchema.virtual('isAvailable').get(function (this: any) {
  return this.isActive;
});

// Pre-save middleware to ensure only one default payment method per merchant
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await (this.constructor as any).updateMany(
      { merchantId: this.merchantId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Instance method to calculate fees for an amount
paymentMethodSchema.methods.calculateFees = function (amount: number, currency: string) {
  if (!this.supportedCurrencies.includes(currency)) {
    throw new Error(`Currency ${currency} is not supported for this payment method`);
  }
  
  if (amount < this.limits.minimumAmount) {
    throw new Error(`Amount is below minimum limit of ${this.limits.minimumAmount}`);
  }
  
  if (this.limits.maximumAmount && amount > this.limits.maximumAmount) {
    throw new Error(`Amount exceeds maximum limit of ${this.limits.maximumAmount}`);
  }
  
  const percentageFee = (amount * this.fees.percentage) / 100;
  const totalFee = percentageFee + this.fees.fixed;
  
  let finalFee = totalFee;
  
  if (this.fees.minimum && finalFee < this.fees.minimum) {
    finalFee = this.fees.minimum;
  }
  
  if (this.fees.maximum && finalFee > this.fees.maximum) {
    finalFee = this.fees.maximum;
  }
  
  return {
    amount,
    fee: finalFee,
    totalAmount: amount + finalFee,
    breakdown: {
      percentageFee,
      fixedFee: this.fees.fixed,
      finalFee
    }
  };
};

// Instance method to check if payment method supports currency
paymentMethodSchema.methods.supportsCurrency = function (currency: string) {
  return this.supportedCurrencies.includes(currency);
};

// Instance method to toggle active status
paymentMethodSchema.methods.toggleActive = async function () {
  this.isActive = !this.isActive;
  return await this.save();
};

// Static method to find active payment methods for merchant
paymentMethodSchema.statics.findActiveByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true });
};

// Static method to find default payment method for merchant
paymentMethodSchema.statics.findDefaultByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.findOne({ merchantId, isDefault: true, isActive: true });
};

// Static method to find payment methods by type
paymentMethodSchema.statics.findByType = function (merchantId: mongoose.Types.ObjectId, type: string) {
  return this.find({ merchantId, type, isActive: true });
};

const PaymentMethod: Model<IPaymentMethod> = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod; 