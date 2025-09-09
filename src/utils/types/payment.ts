import { Types } from 'mongoose';
import { Currency, PaymentMethod, TransactionStatus, TransactionType } from '../constants';

export interface PaymentInitiateRequest {
  amount: number;
  currency: Currency;
  email: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  payment_method?: PaymentMethod;
  card_details?: {
    number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    pin?: string;
  };
  bank_details?: {
    account_number: string;
    account_bank: string;
    account_name?: string;
  };
  ussd_details?: {
    bank: string;
    phone_number: string;
  };
  mobile_money_details?: {
    provider: string;
    phone_number: string;
  };
}

export interface PaymentVerifyRequest {
  reference: string;
}

export interface TransactionResponse {
  _id: Types.ObjectId;
  reference: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  customer_email: string;
  customer_name?: string;
  merchant_id: Types.ObjectId;
  fees: number;
  gateway_response?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RefundRequest {
  transaction_id: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  _id: Types.ObjectId;
  transaction_id: Types.ObjectId;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookEvent {
  event: string;
  data: {
    id: string;
    reference: string;
    amount: number;
    currency: Currency;
    status: TransactionStatus;
    payment_method: PaymentMethod;
    customer_email: string;
    customer_name?: string;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
  };
  sent_at: Date;
}

export interface SubscriptionRequest {
  amount: number;
  currency: Currency;
  email: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_count: number;
  start_date?: Date;
  end_date?: Date;
}

export interface SubscriptionResponse {
  _id: Types.ObjectId;
  reference: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  customer_email: string;
  customer_name?: string;
  merchant_id: Types.ObjectId;
  interval: string;
  interval_count: number;
  next_payment_date: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  enabled: boolean;
  min_amount?: number;
  max_amount?: number;
  fees_percentage?: number;
  fees_fixed?: number;
  supported_currencies: Currency[];
}

export interface MerchantConfig {
  _id: Types.ObjectId;
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  logo?: string;
  website?: string;
  industry: string;
  currencies: Currency[];
  payment_methods: PaymentMethodConfig[];
  webhook_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} 