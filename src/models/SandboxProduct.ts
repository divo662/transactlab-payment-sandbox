import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISandboxProduct extends Document {
  productId: string;
  userId: string;
  name: string;
  description?: string;
  image?: string; // URL or base64 image data
  active: boolean;
}

const SandboxProductSchema = new Schema<ISandboxProduct>(
  {
    productId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String }, // URL or base64 image data
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SandboxProductSchema.pre('validate', function (next) {
  if (!this.productId) {
    // simple id
    this.productId = `prod_${Math.random().toString(36).slice(2, 10)}`;
  }
  next();
});

export const SandboxProduct: Model<ISandboxProduct> =
  mongoose.models.SandboxProduct || mongoose.model<ISandboxProduct>('SandboxProduct', SandboxProductSchema);

export default SandboxProduct;


