import mongoose, { Schema, Document } from 'mongoose';

export interface ISandboxConfig extends Document {
  userId: string;
  testApiKey: string;
  testSecretKey: string;
  testWebhookUrl: string;
  webhookEndpoint: string;
  webhookSecret: string;
  sandboxMode: boolean;
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
  }
}, { timestamps: true });

SandboxConfigSchema.index({ userId: 1 });

export default mongoose.model<ISandboxConfig>('SandboxConfig', SandboxConfigSchema);
