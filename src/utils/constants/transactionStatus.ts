export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CHARGEBACK: 'chargeback',
  DISPUTED: 'disputed'
} as const;

export const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  CHARGEBACK: 'chargeback',
  TRANSFER: 'transfer',
  SUBSCRIPTION: 'subscription'
} as const;

export const TRANSACTION_CHANNELS = {
  WEB: 'web',
  MOBILE: 'mobile',
  API: 'api',
  POS: 'pos',
  ATM: 'atm'
} as const;

export const FAILURE_REASONS = {
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  CARD_DECLINED: 'card_declined',
  EXPIRED_CARD: 'expired_card',
  INVALID_CARD: 'invalid_card',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  CANCELLED_BY_USER: 'cancelled_by_user',
  FRAUD_DETECTED: 'fraud_detected',
  BANK_DECLINED: 'bank_declined',
  INVALID_ACCOUNT: 'invalid_account'
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
export type TransactionChannel = typeof TRANSACTION_CHANNELS[keyof typeof TRANSACTION_CHANNELS];
export type FailureReason = typeof FAILURE_REASONS[keyof typeof FAILURE_REASONS]; 