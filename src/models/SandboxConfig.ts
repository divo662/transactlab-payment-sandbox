import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxConfig extends Document {
  userId: string;
  testApiKey: string;
  testSecretKey: string;
  testWebhookUrl: string;
  webhookEndpoint: string;
  webhookSecret: string;
  sandboxMode: boolean;
  fraud?: {
    enabled: boolean;
    blockThreshold: number;
    reviewThreshold: number;
    flagThreshold: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SandboxConfigSchema = new Schema<ISandboxConfig>({
  userId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  testApiKey: { 
    type: String, 
    required: true 
  },
  testSecretKey: { 
    type: String, 
    required: true 
  },
  testWebhookUrl: { 
    type: String, 
    required: true 
  },
  webhookEndpoint: { 
    type: String, 
    default: '' 
  },
  webhookSecret: { 
    type: String, 
    default: '' 
  },
  sandboxMode: { 
    type: Boolean, 
    default: true 
  },
  fraud: {
    enabled: { type: Boolean, default: true },
    blockThreshold: { type: Number, default: 70 },
    reviewThreshold: { type: Number, default: 50 },
    flagThreshold: { type: Number, default: 30 }
  }
}, { timestamps: true });

SandboxConfigSchema.index({ userId: 1 });

export default mongoose.model<ISandboxConfig>('SandboxConfig', SandboxConfigSchema);
