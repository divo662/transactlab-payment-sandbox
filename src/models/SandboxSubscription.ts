import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

export interface ISandboxSubscription extends Document {
  subscriptionId: string;
  userId: string;
  customerEmail: string;
  productId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  defaultPaymentMethod?: string;
  metadata?: Record<string, any>;
}

const SandboxSubscriptionSchema = new Schema<ISandboxSubscription>(
  {
    subscriptionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true },
    productId: { type: String, required: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ['trialing', 'active', 'past_due', 'canceled', 'paused'], default: 'active' },
    startDate: { type: Date, required: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    defaultPaymentMethod: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SandboxSubscriptionSchema.pre('validate', function (next) {
  if (!this.subscriptionId) {
    this.subscriptionId = `sub_${Math.random().toString(36).slice(2, 10)}`;
  }
  if (!this.startDate) this.startDate = new Date();
  if (!this.currentPeriodStart) this.currentPeriodStart = new Date();
  next();
});

export const SandboxSubscription: Model<ISandboxSubscription> =
  mongoose.models.SandboxSubscription || mongoose.model<ISandboxSubscription>('SandboxSubscription', SandboxSubscriptionSchema);

export default SandboxSubscription;
