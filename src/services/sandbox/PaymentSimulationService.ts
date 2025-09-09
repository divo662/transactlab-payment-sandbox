import { logger } from '../../utils/helpers/logger';
import crypto from 'crypto';

export interface PaymentRequest {
  sessionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerEmail: string;
  customerName?: string;
  cardDetails?: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: string;
  error?: string;
  processingTime: number;
  gatewayResponse?: any;
}

export interface FailureScenario {
  type: 'card_declined' | 'insufficient_funds' | 'expired_card' | 'invalid_cvv' | 'network_error' | 'timeout' | 'fraud_detection';
  probability: number;
  errorMessage: string;
  httpStatus: number;
}

export class PaymentSimulationService {
  private failureScenarios: FailureScenario[] = [
    {
      type: 'card_declined',
      probability: 0.05, // 5%
      errorMessage: 'Card was declined by the issuing bank',
      httpStatus: 402
    },
    {
      type: 'insufficient_funds',
      probability: 0.08, // 8%
      errorMessage: 'Insufficient funds in the account',
      httpStatus: 402
    },
    {
      type: 'expired_card',
      probability: 0.02, // 2%
      errorMessage: 'Card has expired',
      httpStatus: 400
    },
    {
      type: 'invalid_cvv',
      probability: 0.03, // 3%
      errorMessage: 'Invalid CVV code',
      httpStatus: 400
    },
    {
      type: 'network_error',
      probability: 0.01, // 1%
      errorMessage: 'Network error occurred during processing',
      httpStatus: 503
    },
    {
      type: 'timeout',
      probability: 0.01, // 1%
      errorMessage: 'Payment processing timed out',
      httpStatus: 408
    },
    {
      type: 'fraud_detection',
      probability: 0.005, // 0.5%
      errorMessage: 'Transaction flagged for fraud detection',
      httpStatus: 403
    }
  ];

  /**
   * Process a payment with realistic simulation
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing payment for session ${request.sessionId} via ${request.paymentMethod}`);

      // Simulate processing delay (1-3 seconds)
      const processingDelay = this.getRandomDelay(1000, 3000);
      await this.sleep(processingDelay);

      // Validate payment data
      const validationResult = this.validatePaymentData(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          status: 'failed',
          error: validationResult.error,
          processingTime: Date.now() - startTime
        };
      }

      // Check for failure scenarios
      const failureScenario = this.checkFailureScenarios();
      if (failureScenario) {
        logger.info(`Payment failed due to ${failureScenario.type} for session ${request.sessionId}`);
        
        return {
          success: false,
          status: 'failed',
          error: failureScenario.errorMessage,
          processingTime: Date.now() - startTime,
          gatewayResponse: {
            error: {
              type: failureScenario.type,
              message: failureScenario.errorMessage,
              code: `PAYMENT_${failureScenario.type.toUpperCase()}`,
              http_status: failureScenario.httpStatus
            }
          }
        };
      }

      // Simulate successful payment
      const transactionId = this.generateTransactionId();
      const processingTime = Date.now() - startTime;

      logger.info(`Payment processed successfully for session ${request.sessionId}, transaction ID: ${transactionId}`);

      return {
        success: true,
        transactionId,
        status: 'completed',
        processingTime,
        gatewayResponse: {
          id: transactionId,
          status: 'succeeded',
          amount: request.amount,
          currency: request.currency,
          payment_method: request.paymentMethod,
          customer: {
            email: request.customerEmail,
            name: request.customerName
          },
          created_at: new Date().toISOString(),
          processing_time_ms: processingTime
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`Unexpected error processing payment for session ${request.sessionId}:`, error);
      
      return {
        success: false,
        status: 'failed',
        error: 'An unexpected error occurred during payment processing',
        processingTime
      };
    }
  }

  /**
   * Validate payment data
   */
  private validatePaymentData(request: PaymentRequest): { isValid: boolean; error?: string } {
    // Validate amount
    if (request.amount <= 0) {
      return { isValid: false, error: 'Invalid amount' };
    }

    // Validate currency
    const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK'];
    if (!validCurrencies.includes(request.currency)) {
      return { isValid: false, error: 'Invalid currency' };
    }

    // Validate payment method
    const validPaymentMethods = ['card', 'bank_transfer', 'mobile_money', 'crypto', 'wallet'];
    if (!validPaymentMethods.includes(request.paymentMethod)) {
      return { isValid: false, error: 'Invalid payment method' };
    }

    // Validate card details if payment method is card
    if (request.paymentMethod === 'card') {
      if (!request.cardDetails) {
        return { isValid: false, error: 'Card details are required for card payments' };
      }

      const cardValidation = this.validateCardDetails(request.cardDetails);
      if (!cardValidation.isValid) {
        return cardValidation;
      }
    }

    // Validate customer email
    if (!request.customerEmail || !this.isValidEmail(request.customerEmail)) {
      return { isValid: false, error: 'Valid customer email is required' };
    }

    return { isValid: true };
  }

  /**
   * Validate card details
   */
  private validateCardDetails(cardDetails: any): { isValid: boolean; error?: string } {
    // Validate card number (basic Luhn algorithm check)
    if (!this.isValidCardNumber(cardDetails.cardNumber)) {
      return { isValid: false, error: 'Invalid card number' };
    }

    // Validate expiry date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(cardDetails.expiryYear);
    const expiryMonth = parseInt(cardDetails.expiryMonth);

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    // Validate CVV
    if (!cardDetails.cvv || cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    // Validate cardholder name
    if (!cardDetails.cardholderName || cardDetails.cardholderName.trim().length < 2) {
      return { isValid: false, error: 'Cardholder name is required' };
    }

    return { isValid: true };
  }

  /**
   * Check for failure scenarios based on probability
   */
  private checkFailureScenarios(): FailureScenario | null {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const scenario of this.failureScenarios) {
      cumulativeProbability += scenario.probability;
      if (random <= cumulativeProbability) {
        return scenario;
      }
    }

    return null;
  }

  /**
   * Generate realistic transaction ID
   */
  private generateTransactionId(): string {
    const prefix = 'txn';
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate random delay within a range
   */
  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate card number using Luhn algorithm
   */
  private isValidCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Simulate refund processing
   */
  async processRefund(transactionId: string, amount: number, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    status: string;
    error?: string;
  }> {
    try {
      // Simulate processing delay
      await this.sleep(this.getRandomDelay(500, 1500));

      // Check for refund failure scenarios (lower probability)
      if (Math.random() < 0.02) { // 2% failure rate
        return {
          success: false,
          status: 'failed',
          error: 'Refund processing failed due to system error'
        };
      }

      const refundId = `ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      logger.info(`Refund processed successfully: ${refundId} for transaction ${transactionId}`);

      return {
        success: true,
        refundId,
        status: 'completed'
      };
    } catch (error) {
      logger.error(`Error processing refund for transaction ${transactionId}:`, error);
      return {
        success: false,
        status: 'failed',
        error: 'An unexpected error occurred during refund processing'
      };
    }
  }

  /**
   * Get payment method details for simulation
   */
  getPaymentMethodDetails(method: string): {
    name: string;
    description: string;
    processingTime: { min: number; max: number };
    successRate: number;
  } {
    const methodDetails = {
      card: {
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, American Express, Discover',
        processingTime: { min: 1000, max: 3000 },
        successRate: 0.92
      },
      bank_transfer: {
        name: 'Bank Transfer',
        description: 'ACH, SEPA, Wire Transfer',
        processingTime: { min: 2000, max: 5000 },
        successRate: 0.95
      },
      mobile_money: {
        name: 'Mobile Money',
        description: 'M-Pesa, Orange Money, MTN Mobile Money',
        processingTime: { min: 1500, max: 4000 },
        successRate: 0.88
      },
      crypto: {
        name: 'Cryptocurrency',
        description: 'Bitcoin, Ethereum, USDC, USDT',
        processingTime: { min: 3000, max: 10000 },
        successRate: 0.85
      },
      wallet: {
        name: 'Digital Wallet',
        description: 'PayPal, Apple Pay, Google Pay',
        processingTime: { min: 800, max: 2500 },
        successRate: 0.90
      }
    };

    return methodDetails[method as keyof typeof methodDetails] || methodDetails.card;
  }
}

export default PaymentSimulationService;
