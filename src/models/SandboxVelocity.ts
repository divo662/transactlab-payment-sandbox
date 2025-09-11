import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxVelocity extends Document {
  key: string; // e.g., vel:<userId>:<email>
  count: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxVelocitySchema = new Schema<ISandboxVelocity>({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });

const SandboxVelocity = mongoose.model<ISandboxVelocity>('SandboxVelocity', SandboxVelocitySchema);

export default SandboxVelocity;


