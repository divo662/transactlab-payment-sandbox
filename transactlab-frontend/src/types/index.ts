export type Role = "merchant" | "admin"; // All users are merchants by default

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  
  // Merchant-specific fields
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  industry?: string;
  businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  businessSize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  website?: string;
  description?: string;
  
  // Business verification
  isBusinessVerified: boolean;
  businessVerificationDocuments?: string[];
  
  // Payment settings
  defaultCurrency: string;
  supportedCurrencies: string[];
  paymentMethods: string[];
  
  // Security & verification
  isKycVerified?: boolean;
  kyc?: {
    provider?: string;
    lastSessionId?: string;
    lastStatus?: string;
  };
  securityQuestion?: {
    question: string;
    answer: string;
  };
  
  lastLogin?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// Merchant interface removed - all users are now merchants with merchant capabilities built into the User interface

export interface BusinessProfileData {
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  industry: string;
  website?: string;
  description?: string;
  businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  paymentMethods: string[];
}

export interface PaymentMethodSetup {
  id?: string; // Optional ID for new methods, required for existing ones
  type: string;
  label: string;
  isDefault: boolean;
  provider?: string;
  accountNumber?: string;
  bankCode?: string;
  cardType?: string;
  last4?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  isComplete: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    tokens: AuthTokens;
  };
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  securityAnswer: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  businessName: string;
  businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  industry?: string;
  website?: string;
  description?: string;
  securityQuestion: string;
  securityAnswer: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  currency: string;
  customerId: string;
  methodId: string;
  status: TransactionStatus;
  reference: string;
}

export type PaymentMethodType = "card" | "bank" | "wallet";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  last4?: string;
  provider?: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// Merchant interface removed - all users are now merchants with merchant capabilities built into the User interface

export interface BusinessProfileData {
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  industry: string;
  website?: string;
  description?: string;
  businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  paymentMethods: string[];
}

export interface MetricCard {
  label: string;
  value: string;
  delta?: string;
}

export interface ChartPoint {
  name: string;
  value: number;
}
