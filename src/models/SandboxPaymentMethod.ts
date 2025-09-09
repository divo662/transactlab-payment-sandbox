import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for instance methods
interface ISandboxPaymentMethodMethods {
  maskCardNumber(): string;
  isExpired(): boolean;
  getExpiryDate(): Date;
}

// Interface for static methods
interface ISandboxPaymentMethodStatics {
  findByCustomer(customerEmail: string): Promise<ISandboxPaymentMethod[]>;
  findActive(): Promise<ISandboxPaymentMethod[]>;
}

export interface ISandboxPaymentMethod extends Document, ISandboxPaymentMethodMethods {
  paymentMethodId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  type: 'card' | 'bank_account' | 'wallet';
  cardDetails?: {
    brand: string; // visa, mastercard, etc.
    last4: string;
    expMonth: number;
    expYear: number;
    cardholderName: string;
    billingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    phone?: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    routingNumber?: string;
  };
  walletDetails?: {
    provider: string; // paypal, apple_pay, google_pay, etc.
    walletId: string;
  };
  isDefault: boolean;
  isActive: boolean;
  metadata: {
    source: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SandboxPaymentMethodSchema = new Schema<ISandboxPaymentMethod>({
  paymentMethodId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['card', 'bank_account', 'wallet'],
    required: true
  },
  cardDetails: {
    brand: {
      type: String,
      lowercase: true
    },
    last4: {
      type: String,
      length: 4
    },
    expMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    expYear: {
      type: Number,
      min: new Date().getFullYear()
    },
    cardholderName: {
      type: String,
      trim: true
    },
    billingAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    phone: { type: String, trim: true }
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    accountName: {
      type: String,
      trim: true
    },
    routingNumber: {
      type: String,
      trim: true
    }
  },
  walletDetails: {
    provider: {
      type: String,
      lowercase: true
    },
    walletId: {
      type: String,
      trim: true
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    source: {
      type: String,
      default: 'sandbox-payment-method'
    },
    tags: [String],
    customFields: {
      type: Map,
      of: Schema.Types.Mixed
    }
  }
}, {
  timestamps: true
});

// Indexes
SandboxPaymentMethodSchema.index({ userId: 1, customerEmail: 1 });
SandboxPaymentMethodSchema.index({ customerEmail: 1, isActive: 1 });
SandboxPaymentMethodSchema.index({ paymentMethodId: 1 });

// Instance methods
SandboxPaymentMethodSchema.methods.maskCardNumber = function(): string {
  if (this.type === 'card' && this.cardDetails?.last4) {
    return `**** **** **** ${this.cardDetails.last4}`;
  }
  return '****';
};

SandboxPaymentMethodSchema.methods.isExpired = function(): boolean {
  if (this.type === 'card' && this.cardDetails?.expYear && this.cardDetails?.expMonth) {
    const now = new Date();
    const expiryDate = new Date(this.cardDetails.expYear, this.cardDetails.expMonth - 1);
    return expiryDate < now;
  }
  return false;
};

SandboxPaymentMethodSchema.methods.getExpiryDate = function(): Date {
  if (this.type === 'card' && this.cardDetails?.expYear && this.cardDetails?.expMonth) {
    return new Date(this.cardDetails.expYear, this.cardDetails.expMonth - 1);
  }
  return new Date();
};

// Static methods
SandboxPaymentMethodSchema.statics.findByCustomer = function(customerEmail: string) {
  return this.find({ 
    customerEmail: customerEmail.toLowerCase(),
    isActive: true 
  }).sort({ isDefault: -1, createdAt: -1 });
};

SandboxPaymentMethodSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Pre-save middleware
SandboxPaymentMethodSchema.pre('save', function(next) {
  // Auto-generate payment method ID if not provided
  if (!this.paymentMethodId) {
    this.paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // If this is being set as default, unset other defaults for this customer
  if (this.isDefault && this.isModified('isDefault')) {
    // Use the model directly instead of this.constructor
    const model = this.constructor as any;
    model.updateMany(
      { 
        customerEmail: this.customerEmail,
        _id: { $ne: this._id }
      },
      { $set: { isDefault: false } }
    );
  }
  
  next();
});

const SandboxPaymentMethod = mongoose.model<ISandboxPaymentMethod, ISandboxPaymentMethodStatics>('SandboxPaymentMethod', SandboxPaymentMethodSchema);

export default SandboxPaymentMethod;
