import { logger } from '../../utils/helpers/logger';

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export interface CurrencyFormat {
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  format: CurrencyFormat;
}

/**
 * Currency Service
 * Handles currency conversion and formatting
 */
export class CurrencyService {
  private static readonly SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
    NGN: {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      format: {
        symbol: '₦',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    },
    USD: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      format: {
        symbol: '$',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    },
    EUR: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      format: {
        symbol: '€',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    },
    GBP: {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      format: {
        symbol: '£',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    },
    CAD: {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      format: {
        symbol: 'C$',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    },
    AUD: {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      format: {
        symbol: 'A$',
        position: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.'
      }
    }
  };

  // Mock exchange rates (in a real app, these would come from an API)
  private static readonly EXCHANGE_RATES: Record<string, number> = {
    'USD_NGN': 1500,
    'EUR_NGN': 1650,
    'GBP_NGN': 1950,
    'CAD_NGN': 1100,
    'AUD_NGN': 1000,
    'NGN_USD': 1 / 1500,
    'EUR_USD': 1.1,
    'GBP_USD': 1.3,
    'CAD_USD': 0.73,
    'AUD_USD': 0.67,
    'NGN_EUR': 1 / 1650,
    'USD_EUR': 1 / 1.1,
    'GBP_EUR': 1.18,
    'CAD_EUR': 0.66,
    'AUD_EUR': 0.61,
    'NGN_GBP': 1 / 1950,
    'USD_GBP': 1 / 1.3,
    'EUR_GBP': 1 / 1.18,
    'CAD_GBP': 0.56,
    'AUD_GBP': 0.52,
    'NGN_CAD': 1 / 1100,
    'USD_CAD': 1 / 0.73,
    'EUR_CAD': 1 / 0.66,
    'GBP_CAD': 1 / 0.56,
    'AUD_CAD': 0.92,
    'NGN_AUD': 1 / 1000,
    'USD_AUD': 1 / 0.67,
    'EUR_AUD': 1 / 0.61,
    'GBP_AUD': 1 / 0.52,
    'CAD_AUD': 1 / 0.92
  };

  /**
   * Get supported currencies
   */
  static getSupportedCurrencies(): string[] {
    return Object.keys(this.SUPPORTED_CURRENCIES);
  }

  /**
   * Get currency info
   */
  static getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
    try {
      const code = currencyCode.toUpperCase();
      return this.SUPPORTED_CURRENCIES[code] || null;
    } catch (error) {
      logger.error('Failed to get currency info', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currencyCode
      });
      return null;
    }
  }

  /**
   * Check if currency is supported
   */
  static isSupportedCurrency(currencyCode: string): boolean {
    try {
      const code = currencyCode.toUpperCase();
      return code in this.SUPPORTED_CURRENCIES;
    } catch (error) {
      logger.error('Failed to check if currency is supported', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currencyCode
      });
      return false;
    }
  }

  /**
   * Get exchange rate
   */
  static getExchangeRate(fromCurrency: string, toCurrency: string): number | null {
    try {
      const from = fromCurrency.toUpperCase();
      const to = toCurrency.toUpperCase();

      if (from === to) {
        return 1;
      }

      const rateKey = `${from}_${to}`;
      const rate = this.EXCHANGE_RATES[rateKey];

      if (rate !== undefined) {
        return rate;
      }

      // Try reverse rate
      const reverseRateKey = `${to}_${from}`;
      const reverseRate = this.EXCHANGE_RATES[reverseRateKey];

      if (reverseRate !== undefined) {
        return 1 / reverseRate;
      }

      logger.warn('Exchange rate not found', {
        fromCurrency: from,
        toCurrency: to
      });

      return null;
    } catch (error) {
      logger.error('Failed to get exchange rate', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fromCurrency,
        toCurrency
      });
      return null;
    }
  }

  /**
   * Convert currency
   */
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number | null {
    try {
      const rate = this.getExchangeRate(fromCurrency, toCurrency);
      
      if (rate === null) {
        return null;
      }

      return amount * rate;
    } catch (error) {
      logger.error('Failed to convert currency', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        fromCurrency,
        toCurrency
      });
      return null;
    }
  }

  /**
   * Format currency amount
   */
  static formatCurrency(
    amount: number,
    currencyCode: string,
    options: {
      showSymbol?: boolean;
      showCode?: boolean;
      decimalPlaces?: number;
    } = {}
  ): string {
    try {
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      if (!currencyInfo) {
        return amount.toString();
      }

      const {
        showSymbol = true,
        showCode = false,
        decimalPlaces = currencyInfo.format.decimalPlaces
      } = options;

      // Format the number
      const formattedNumber = this.formatNumber(
        amount,
        decimalPlaces,
        currencyInfo.format.thousandSeparator,
        currencyInfo.format.decimalSeparator
      );

      let result = formattedNumber;

      // Add symbol
      if (showSymbol) {
        if (currencyInfo.format.position === 'before') {
          result = currencyInfo.format.symbol + result;
        } else {
          result = result + currencyInfo.format.symbol;
        }
      }

      // Add currency code
      if (showCode) {
        result += ` ${currencyCode}`;
      }

      return result;
    } catch (error) {
      logger.error('Failed to format currency', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        currencyCode,
        options
      });
      return amount.toString();
    }
  }

  /**
   * Format number with separators
   */
  static formatNumber(
    number: number,
    decimalPlaces: number = 2,
    thousandSeparator: string = ',',
    decimalSeparator: string = '.'
  ): string {
    try {
      const fixed = number.toFixed(decimalPlaces);
      const parts = fixed.split('.');
      
      // Add thousand separators
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
      
      return parts.join(decimalSeparator);
    } catch (error) {
      logger.error('Failed to format number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        number,
        decimalPlaces,
        thousandSeparator,
        decimalSeparator
      });
      return number.toString();
    }
  }

  /**
   * Parse currency string
   */
  static parseCurrency(
    currencyString: string,
    currencyCode: string
  ): number | null {
    try {
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      if (!currencyInfo) {
        return null;
      }

      // Remove symbol and currency code
      let cleaned = currencyString
        .replace(new RegExp(currencyInfo.format.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
        .replace(new RegExp(currencyCode, 'gi'), '')
        .trim();

      // Remove thousand separators
      cleaned = cleaned.replace(new RegExp(currencyInfo.format.thousandSeparator, 'g'), '');

      // Replace decimal separator with standard decimal point
      cleaned = cleaned.replace(currencyInfo.format.decimalSeparator, '.');

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      logger.error('Failed to parse currency string', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currencyString,
        currencyCode
      });
      return null;
    }
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currencyCode: string): string | null {
    try {
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      return currencyInfo?.format.symbol || null;
    } catch (error) {
      logger.error('Failed to get currency symbol', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currencyCode
      });
      return null;
    }
  }

  /**
   * Get currency name
   */
  static getCurrencyName(currencyCode: string): string | null {
    try {
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      return currencyInfo?.name || null;
    } catch (error) {
      logger.error('Failed to get currency name', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currencyCode
      });
      return null;
    }
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(amount: number, total: number): number {
    try {
      if (total === 0) {
        return 0;
      }
      return (amount / total) * 100;
    } catch (error) {
      logger.error('Failed to calculate percentage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        total
      });
      return 0;
    }
  }

  /**
   * Calculate tax amount
   */
  static calculateTax(amount: number, taxRate: number): number {
    try {
      return amount * (taxRate / 100);
    } catch (error) {
      logger.error('Failed to calculate tax', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        taxRate
      });
      return 0;
    }
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(amount: number, discountRate: number): number {
    try {
      return amount * (discountRate / 100);
    } catch (error) {
      logger.error('Failed to calculate discount', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        discountRate
      });
      return 0;
    }
  }

  /**
   * Calculate fee amount
   */
  static calculateFee(amount: number, feeRate: number, minimumFee: number = 0): number {
    try {
      const fee = amount * (feeRate / 100);
      return Math.max(fee, minimumFee);
    } catch (error) {
      logger.error('Failed to calculate fee', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        feeRate,
        minimumFee
      });
      return 0;
    }
  }

  /**
   * Round to currency precision
   */
  static roundToCurrencyPrecision(amount: number, currencyCode: string): number {
    try {
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      const decimalPlaces = currencyInfo?.format.decimalPlaces || 2;
      
      const multiplier = Math.pow(10, decimalPlaces);
      return Math.round(amount * multiplier) / multiplier;
    } catch (error) {
      logger.error('Failed to round to currency precision', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        currencyCode
      });
      return amount;
    }
  }

  /**
   * Get all currency info
   */
  static getAllCurrencyInfo(): Record<string, CurrencyInfo> {
    return { ...this.SUPPORTED_CURRENCIES };
  }

  /**
   * Update exchange rate (for testing/mocking)
   */
  static updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): void {
    try {
      const from = fromCurrency.toUpperCase();
      const to = toCurrency.toUpperCase();
      const rateKey = `${from}_${to}`;
      
      this.EXCHANGE_RATES[rateKey] = rate;
      
      logger.info('Exchange rate updated', {
        fromCurrency: from,
        toCurrency: to,
        rate
      });
    } catch (error) {
      logger.error('Failed to update exchange rate', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fromCurrency,
        toCurrency,
        rate
      });
    }
  }
}

export default CurrencyService; 