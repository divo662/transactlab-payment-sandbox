import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxCustomer extends Document {
  customerId: string;
  userId: string;
  merchantId: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  description?: string;
  totalTransactions: number;
  totalSpent: number;
  currency: string;
  transactionsByCurrency: Array<{
    currency: string;
    count: number;
    total: number;
  }>;
  isSandbox: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxCustomerSchema = new Schema<ISandboxCustomer>({
  customerId: {
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
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  address: {
    line1: { type: String, required: false },
    line2: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalCode: { type: String, required: false },
    country: { type: String, required: true, default: 'NG' }
  },
  description: {
    type: String,
    required: false
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  transactionsByCurrency: [{
    currency: { type: String, required: true },
    count: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  isSandbox: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
SandboxCustomerSchema.index({ userId: 1, merchantId: 1 });

export default mongoose.model<ISandboxCustomer>('SandboxCustomer', SandboxCustomerSchema);
