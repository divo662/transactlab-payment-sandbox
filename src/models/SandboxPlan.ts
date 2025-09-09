import mongoose, { Schema, Document, Model } from 'mongoose';

export type PlanInterval = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ISandboxPlan extends Document {
  planId: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  interval: PlanInterval;
  trialDays?: number;
  active: boolean;
}

const SandboxPlanSchema = new Schema<ISandboxPlan>(
  {
    planId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    interval: { type: String, enum: ['day', 'week', 'month', 'quarter', 'year'], required: true },
    trialDays: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SandboxPlanSchema.pre('validate', function (next) {
  if (!this.planId) {
    this.planId = `plan_${Math.random().toString(36).slice(2, 10)}`;
  }
  next();
});

export const SandboxPlan: Model<ISandboxPlan> =
  mongoose.models.SandboxPlan || mongoose.model<ISandboxPlan>('SandboxPlan', SandboxPlanSchema);

export default SandboxPlan;


