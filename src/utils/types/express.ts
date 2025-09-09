import { Request } from 'express';
import { Types } from 'mongoose';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        _id: Types.ObjectId;
        email: string;
        role: string;
        merchantId?: Types.ObjectId;
        permissions?: string[];
        tier?: string;
      };
      merchant?: {
        _id: Types.ObjectId;
        businessName: string;
        businessEmail: string;
        isActive: boolean;
      };
      apiKey?: {
        _id: Types.ObjectId;
        key: string;
        merchantId: Types.ObjectId;
        permissions: string[];
        isActive: boolean;
        restrictions: {
          rateLimit: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
          };
        };
      };
      transaction?: {
        _id: Types.ObjectId;
        reference: string;
        amount: number;
        currency: string;
        status: string;
        merchantId: Types.ObjectId;
      };
      rateLimit?: {
        limit: number;
        remaining: number;
        reset: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: NonNullable<Request['user']>;
}

export interface MerchantRequest extends Request {
  user: NonNullable<Request['user']>;
  merchant: NonNullable<Request['merchant']>;
}

export interface ApiKeyRequest extends Request {
  apiKey: NonNullable<Request['apiKey']>;
}

export interface TransactionRequest extends Request {
  transaction: NonNullable<Request['transaction']>;
} 