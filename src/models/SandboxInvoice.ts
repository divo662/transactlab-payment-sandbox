import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for instance methods
interface ISandboxInvoiceMethods {
  markAsPaid(): Promise<void>;
  markAsOverdue(): Promise<void>;
  isOverdue(): boolean;
  getDaysUntilDue(): number;
}

// Interface for static methods
interface ISandboxInvoiceStatics {
  findByCustomer(customerEmail: string): Promise<ISandboxInvoice[]>;
  findOverdue(): Promise<ISandboxInvoice[]>;
  generateInvoiceNumber(): string;
}

export interface ISandboxInvoice extends Document, ISandboxInvoiceMethods {
  invoiceId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: Date;
  paidAmount?: number;
  sessionId?: string; // Link to payment session if paid
  metadata: {
    source: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SandboxInvoiceSchema = new Schema<ISandboxInvoice>({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'NGN'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paidAt: {
    type: Date
  },
  paidAmount: {
    type: Number,
    min: 0
  },
  sessionId: {
    type: String,
    ref: 'SandboxSession'
  },
  metadata: {
    source: {
      type: String,
      default: 'sandbox-invoice'
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
SandboxInvoiceSchema.index({ userId: 1, status: 1 });
SandboxInvoiceSchema.index({ customerEmail: 1 });
SandboxInvoiceSchema.index({ dueDate: 1 });
SandboxInvoiceSchema.index({ invoiceId: 1 });

// Instance methods
SandboxInvoiceSchema.methods.markAsPaid = async function(sessionId?: string, paidAmount?: number): Promise<void> {
  this.status = 'paid';
  this.paidAt = new Date();
  this.sessionId = sessionId;
  this.paidAmount = paidAmount || this.amount;
  return await this.save();
};

SandboxInvoiceSchema.methods.markAsOverdue = async function(): Promise<void> {
  this.status = 'overdue';
  return await this.save();
};

SandboxInvoiceSchema.methods.isOverdue = function(): boolean {
  return this.status === 'overdue' || (this.status === 'sent' && this.dueDate < new Date());
};

SandboxInvoiceSchema.methods.getDaysUntilDue = function(): number {
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static methods
SandboxInvoiceSchema.statics.findByCustomer = function(customerEmail: string) {
  return this.find({ customerEmail: customerEmail.toLowerCase() }).sort({ createdAt: -1 });
};

SandboxInvoiceSchema.statics.findOverdue = function() {
  return this.find({
    status: 'sent',
    dueDate: { $lt: new Date() }
  });
};

SandboxInvoiceSchema.statics.generateInvoiceNumber = function(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `INV-${timestamp}-${random}`.toUpperCase();
};

// Pre-save middleware
SandboxInvoiceSchema.pre('save', function(next) {
  // Auto-generate invoice ID if not provided
  if (!this.invoiceId) {
    this.invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Check if invoice is overdue
  if (this.status === 'sent' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  
  next();
});

const SandboxInvoice = mongoose.model<ISandboxInvoice, ISandboxInvoiceStatics>('SandboxInvoice', SandboxInvoiceSchema);

export default SandboxInvoice;
