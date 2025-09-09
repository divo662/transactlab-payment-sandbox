import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISandboxTeamMember {
  email: string;
  userId?: string;
  status: 'invited' | 'active';
  invitedAt?: Date;
  joinedAt?: Date;
  inviteToken?: string;
  lastSwitchAt?: Date;
}

export interface ISandboxTeamInvite {
  email: string;
  token: string;
  expiresAt: Date;
}

export interface ISandboxTeam extends Document {
  name: string;
  ownerId: string;
  members: ISandboxTeamMember[];
  invites: ISandboxTeamInvite[];
  logs: Array<{ at: Date; type: string; actorEmail?: string; meta?: any }>;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxTeamSchema = new Schema<ISandboxTeam>({
  name: { type: String, required: true, trim: true },
  ownerId: { type: String, required: true, index: true },
  members: [
    {
      email: { type: String, required: true, lowercase: true },
      userId: { type: String },
      status: { type: String, enum: ['invited', 'active'], default: 'invited' },
      invitedAt: { type: Date },
      joinedAt: { type: Date },
      inviteToken: { type: String },
      lastSwitchAt: { type: Date }
    }
  ],
  invites: [
    {
      email: { type: String, required: true, lowercase: true },
      token: { type: String, required: true },
      expiresAt: { type: Date, required: true }
    }
  ],
  logs: [
    {
      at: { type: Date, default: () => new Date() },
      type: { type: String, required: true },
      actorEmail: { type: String },
      meta: { type: Schema.Types.Mixed }
    }
  ]
}, { timestamps: true });

export const SandboxTeam: Model<ISandboxTeam> = mongoose.models.SandboxTeam || mongoose.model<ISandboxTeam>('SandboxTeam', SandboxTeamSchema);

export default SandboxTeam;


