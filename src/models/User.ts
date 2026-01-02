import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  // KYC status
  isKycVerified?: boolean;
  kyc?: {
    provider?: string;
    lastSessionId?: string;
    lastStatus?: string;
  };
  
  // Merchant-specific fields (deprecated in sandbox)
  // businessName: string;
  // businessEmail?: string;
  // businessPhone?: string;
  // industry?: string;
  // businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  // businessSize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  // website?: string;
  // description?: string;
  // isBusinessVerified: boolean;
  // businessVerificationDocuments?: string[];
  
  // Payment settings
  defaultCurrency: string;
  supportedCurrencies: string[];
  paymentMethods: string[];
  
  // Security & verification
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  securityQuestionResetToken?: string;
  securityQuestionResetExpires?: Date;
  securityQuestion: {
    question: string;
    answer: string;
  };
  
  // Account management
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  totpEnabled?: boolean;
  totpSecret?: string;
  totpBackupCodes?: string[];
  
  // Security settings
  securitySettings?: {
    requireEmailVerification: boolean;
    allowNewDeviceLogin: boolean;
    notifyOnNewDevice: boolean;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxConcurrentSessions: number;
  };
  
  // Trusted devices
  trustedDevices: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    userAgent: string;
    ipAddress: string;
    location?: string;
    trustedAt: Date;
    lastUsed: Date;
  }>;
  
  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    timezone: string;
    currency: string;
    dashboardTheme: 'light' | 'dark' | 'auto';
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  compareSecurityAnswer(candidateAnswer: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  unlockAccount(): Promise<void>;
  isDeviceTrusted(deviceId: string): boolean;
  addTrustedDevice(deviceData: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    userAgent: string;
    ipAddress: string;
    location?: string;
  }): Promise<void>;
  getFullBusinessName(): string;
  isIndividualDeveloper(): boolean;
  isBusinessEntity(): boolean;
  generateTotpBackupCodes(): string[];
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    avatar: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // KYC status
    isKycVerified: {
      type: Boolean,
      default: false
    },
    kyc: {
      provider: { type: String, default: 'kycplayground' },
      lastSessionId: { type: String },
      lastStatus: { type: String }
    },
    
    // Merchant-specific fields (deprecated in sandbox)
    // businessName: { type: String },
    // businessEmail: { type: String },
    // businessPhone: { type: String },
    // industry: { type: String },
    // businessType: { type: String },
    // businessSize: { type: String },
    // website: { type: String },
    // description: { type: String },
    // isBusinessVerified: { type: Boolean },
    // businessVerificationDocuments: [String],
    
    // Payment settings
    defaultCurrency: {
      type: String,
      default: 'NGN'
    },
    supportedCurrencies: [{
      type: String,
      default: ['NGN', 'USD', 'EUR', 'GBP']
    }],
    paymentMethods: [{
      type: String,
      default: ['card', 'bank_transfer', 'mobile_money']
    }],
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    securityQuestionResetToken: {
      type: String,
      select: false
    },
    securityQuestionResetExpires: {
      type: Date,
      select: false
    },
    lastLogin: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    twoFactorSecret: {
      type: String,
      select: false
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    totpEnabled: {
      type: Boolean,
      default: false
    },
    totpSecret: {
      type: String,
      select: false
    },
    totpBackupCodes: [{
      type: String,
      select: false
    }],
    securitySettings: {
      requireEmailVerification: {
        type: Boolean,
        default: true
      },
      allowNewDeviceLogin: {
        type: Boolean,
        default: true
      },
      notifyOnNewDevice: {
        type: Boolean,
        default: true
      },
      requireTwoFactor: {
        type: Boolean,
        default: false
      },
      sessionTimeout: {
        type: Number,
        default: 60
      },
      maxConcurrentSessions: {
        type: Number,
        default: 5
      }
    },
    trustedDevices: [{
      deviceId: {
        type: String,
        required: true
      },
      deviceName: {
        type: String,
        required: true
      },
      deviceType: {
        type: String,
        required: true,
        enum: ['desktop', 'mobile', 'tablet', 'unknown']
      },
      userAgent: {
        type: String,
        required: true
      },
      ipAddress: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
      trustedAt: {
        type: Date,
        default: Date.now
      },
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }],
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        push: {
          type: Boolean,
          default: false
        }
      },
      language: {
        type: String,
        default: 'en'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      currency: {
        type: String,
        default: 'NGN'
      },
      dashboardTheme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      }
    },
    securityQuestion: {
      question: {
        type: String,
        required: function(this: any) {
          // Only require security question for new users or when explicitly setting it
          return this.isNew || this.securityQuestion?.answer;
        },
        enum: [
          'What was your first pet\'s name?',
          'In what city were you born?',
          'What was your mother\'s maiden name?',
          'What was the name of your first school?',
          'What is your favorite book?',
          'What was your childhood nickname?',
          'What is the name of the street you grew up on?',
          'What is your favorite movie?'
        ]
      },
      answer: {
        type: String,
        required: function(this: any) {
          // Only require security answer for new users or when explicitly setting it
          return this.isNew || this.securityQuestion?.question;
        },
        minlength: [2, 'Answer must be at least 2 characters long'],
        select: false
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.twoFactorSecret;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.securityQuestion.answer;
        return ret;
      }
    }
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function (this: any) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for isLocked - REMOVED (conflicts with instance method)

// Pre-save middleware to hash password
userSchema.pre('save', async function (this: any, next: any) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    console.log('🔍 Password Comparison Debug:');
    console.log('  Candidate Password:', `"${candidatePassword}"`);
    console.log('  Stored Password Hash:', `"${this.password}"`);
    
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('  Password Comparison Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Password Comparison Error:', error);
    return false;
  }
};

// Instance method to compare security question answer
userSchema.methods.compareSecurityAnswer = async function (candidateAnswer: string): Promise<boolean> {
  try {
    // Check if securityQuestion and answer exist
    if (!this.securityQuestion || !this.securityQuestion.answer) {
      console.log('🔍 Security Answer Comparison Debug:');
      console.log('  Candidate Answer:', `"${candidateAnswer}"`);
      console.log('  Stored Answer: MISSING (securityQuestion or answer is undefined)');
      console.log('  Security Question Object:', this.securityQuestion);
      console.log('  ❌ Security answer not available in user object');
      return false;
    }

    // Add debug logging
    console.log('🔍 Security Answer Comparison Debug:');
    console.log('  Candidate Answer:', `"${candidateAnswer}"`);
    console.log('  Stored Answer:', `"${this.securityQuestion.answer}"`);
    console.log('  Candidate (lowercase):', `"${candidateAnswer.toLowerCase().trim()}"`);
    console.log('  Stored (lowercase):', `"${this.securityQuestion.answer.toLowerCase().trim()}"`);
    
    const result = candidateAnswer.toLowerCase().trim() === this.securityQuestion.answer.toLowerCase().trim();
    console.log('  Comparison Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Security Answer Comparison Error:', error);
    return false;
  }
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts (DISABLED FOR DEVELOPMENT)
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // DISABLED: Account locking removed for development
  console.log('🔒 Account locking disabled for development');
  
  // Just increment the counter without locking
  return await this.updateOne({
    $inc: { loginAttempts: 1 }
  });
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return await this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Instance method to unlock account (for development)
userSchema.methods.unlockAccount = async function (): Promise<void> {
  return await this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check if device is trusted
userSchema.methods.isDeviceTrusted = function (deviceId: string): boolean {
  if (!this.trustedDevices || this.trustedDevices.length === 0) {
    return false;
  }
  
  return this.trustedDevices.some((device: any) => device.deviceId === deviceId);
};

// Instance method to add trusted device
userSchema.methods.addTrustedDevice = async function (deviceData: {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
}): Promise<void> {
  const now = new Date();
  
  // Check if device already exists
  const existingDeviceIndex = this.trustedDevices.findIndex(
    (device: any) => device.deviceId === deviceData.deviceId
  );
  
  if (existingDeviceIndex >= 0) {
    // Update existing device
    this.trustedDevices[existingDeviceIndex].lastUsed = now;
  } else {
    // Add new trusted device
    this.trustedDevices.push({
      ...deviceData,
      trustedAt: now,
      lastUsed: now
    });
  }
  
  await this.save();
};

// Instance method to get full business name
// userSchema.methods.getFullBusinessName = function (): string {
//   if (this.businessType === 'individual') {
//     return `${this.firstName} ${this.lastName}`;
//   }
//   return this.businessName;
// };

// Instance method to check if user is individual developer
// userSchema.methods.isIndividualDeveloper = function (): boolean {
//   return this.businessType === 'individual';
// };

// Instance method to check if user is business entity
// userSchema.methods.isBusinessEntity = function (): boolean {
//   return this.businessType !== 'individual';
// };

// Instance method to generate TOTP backup codes
userSchema.methods.generateTotpBackupCodes = function (): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  // Store backup codes in the user document (you might want to hash these)
  if (!this.totpBackupCodes) {
    this.totpBackupCodes = codes;
  }
  
  return codes;
};

// Instance method to verify TOTP code
userSchema.methods.verifyTotpCode = async function (code: string): Promise<boolean> {
  try {
    if (!this.totpSecret) {
      console.error('TOTP secret not found for user');
      return false;
    }

    const speakeasy = require('speakeasy');
    
    const verified = speakeasy.totp.verify({
      secret: this.totpSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps (60 seconds) of tolerance
    });

    console.log('TOTP Verification Debug:', {
      userId: this._id,
      code,
      secret: this.totpSecret ? 'present' : 'missing',
      verified
    });

    return verified;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};

// Instance method to check if backup code is valid
userSchema.methods.isBackupCodeValid = function (code: string): boolean {
  if (!this.totpBackupCodes || this.totpBackupCodes.length === 0) {
    return false;
  }
  
  return this.totpBackupCodes.includes(code.toUpperCase());
};

// Instance method to use backup code (remove it after use)
userSchema.methods.useBackupCode = async function (code: string): Promise<void> {
  if (!this.totpBackupCodes) {
    return;
  }
  
  // Remove the used backup code
  this.totpBackupCodes = this.totpBackupCodes.filter(
    (backupCode: string) => backupCode !== code.toUpperCase()
  );
  
  await this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User; 