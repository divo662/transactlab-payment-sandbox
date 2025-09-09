/**
 * Payment Helper Functions
 * Utility functions for payment processing
 */

import { CURRENCIES, Currency } from '../constants/currencies';

/**
 * Generate a unique reference for transactions
 */
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Calculate transaction fees based on amount, currency, and merchant fee structure
 */
export function calculateFees(amount: number, currency: Currency, feeStructure?: any): number {
  if (!feeStructure) {
    // Default fee structure: 2.9% + $0.30
    return Math.round((amount * 0.029 + 30) * 100) / 100;
  }

  // Use merchant's custom fee structure
  const { percentage, fixed } = feeStructure;
  const percentageFee = (amount * (percentage || 0)) / 100;
  const fixedFee = fixed || 0;
  
  return Math.round((percentageFee + fixedFee) * 100) / 100;
}

/**
 * Validate transaction amount
 */
export function validateAmount(amount: number, currency: Currency): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!Object.values(CURRENCIES).includes(currency)) {
    return { valid: false, error: 'Invalid currency' };
  }

  // Currency-specific validations
  switch (currency) {
    case 'USD':
    case 'EUR':
    case 'GBP':
      if (amount < 0.50) {
        return { valid: false, error: 'Amount must be at least $0.50' };
      }
      break;
    case 'NGN':
      if (amount < 100) {
        return { valid: false, error: 'Amount must be at least ₦100' };
      }
      break;
    default:
      // For other currencies, just ensure positive amount
      break;
  }

  return { valid: true };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

/**
 * Convert amount between currencies (simplified)
 */
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency, rate: number): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  return Math.round(amount * rate * 100) / 100;
} 