const ConfigLoader = require('./config');
const HttpClient = require('./http-client');
const crypto = require('crypto');

/**
 * TransactLab Magic SDK - Node.js Runtime
 * 
 * This is the core runtime for the TransactLab Magic SDK.
 * It provides a simple interface for creating sessions, subscriptions,
 * and handling webhooks with automatic retries and error handling.
 */

class TransactLabSDK {
  constructor(config = {}) {
    this.configLoader = new ConfigLoader();
    this.config = this.configLoader.load(config);
    this.httpClient = new HttpClient(this.config);
  }

  /**
   * Create a checkout session for one-time payments
   * @param {Object} options - Session options
   * @param {number} options.amount - Amount in major currency units
   * @param {string} options.currency - Currency code (e.g., 'NGN', 'USD')
   * @param {string} options.description - Payment description
   * @param {string} options.customerEmail - Customer email
   * @param {string} [options.customerName] - Customer name
   * @param {Object} [options.metadata] - Custom metadata
   * @param {string} [options.successUrl] - Success redirect URL
   * @param {string} [options.cancelUrl] - Cancel redirect URL
   * @returns {Promise<Object>} Session data
   */
  async createSession(options) {
    const {
      amount,
      currency,
      description,
      customerEmail,
      customerName,
      metadata = {},
      successUrl,
      cancelUrl
    } = options;

    // Validate required fields
    if (!amount || !currency || !description || !customerEmail) {
      throw new Error('Missing required fields: amount, currency, description, customerEmail');
    }

    // Convert amount to minor units if needed
    const amountMinor = this.convertToMinorUnits(amount, currency);

    const payload = {
      amount: amountMinor,
      currency,
      description,
      customerEmail,
      customerName,
      metadata,
      success_url: successUrl || this.config.urls.success,
      cancel_url: cancelUrl || this.config.urls.cancel
    };

    // Generate idempotency key
    const idempotencyKey = this.httpClient.generateIdempotencyKey('POST', '/sandbox/sessions', payload);

    try {
      const response = await this.httpClient.post(
        `${this.config.baseUrl}/sandbox/sessions`,
        payload,
        {
          'x-sandbox-secret': this.config.apiKey
        },
        idempotencyKey
      );

      return response;
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Create a subscription for recurring payments
   * @param {Object} options - Subscription options
   * @param {string} options.planId - Plan ID
   * @param {string} options.customerEmail - Customer email
   * @param {string} [options.customerName] - Customer name
   * @param {number} [options.trialDays] - Trial period in days
   * @param {Object} [options.metadata] - Custom metadata
   * @param {string} [options.successUrl] - Success redirect URL
   * @param {string} [options.cancelUrl] - Cancel redirect URL
   * @param {boolean} [options.chargeNow] - Charge immediately
   * @returns {Promise<Object>} Subscription data
   */
  async createSubscription(options) {
    const {
      planId,
      customerEmail,
      customerName,
      trialDays,
      metadata = {},
      successUrl,
      cancelUrl,
      chargeNow = true
    } = options;

    // Validate required fields
    if (!planId || !customerEmail) {
      throw new Error('Missing required fields: planId, customerEmail');
    }

    const payload = {
      planId,
      customerEmail,
      customerName,
      trialDays,
      metadata,
      success_url: successUrl || this.config.urls.success,
      cancel_url: cancelUrl || this.config.urls.cancel,
      chargeNow
    };

    // Generate idempotency key
    const idempotencyKey = this.httpClient.generateIdempotencyKey('POST', '/sandbox/subscriptions', payload);

    try {
      const response = await this.httpClient.post(
        `${this.config.baseUrl}/sandbox/subscriptions`,
        payload,
        {
          'x-sandbox-secret': this.config.apiKey
        },
        idempotencyKey
      );

      return response;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Process payment for a session (Server Bridge)
   * @param {string} sessionId - Session ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(sessionId, paymentData) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    try {
      const response = await this.httpClient.post(
        `${this.config.baseUrl}/checkout/process/${sessionId}`,
        paymentData,
        {
          'x-sandbox-secret': this.config.apiKey
        }
      );

      return response;
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   * @param {Function} handler - Webhook handler function
   * @returns {Function} Express middleware function
   */
  handleWebhook(handler) {
    return async (req, res) => {
      try {
        // Verify webhook signature
        const signature = req.headers['x-webhook-signature'];
        if (!this.verifyWebhookSignature(req.body, signature)) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }

        const event = req.body;
        const result = await handler(event);
        
        res.json({ received: true, ...result });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
      }
    };
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    if (!signature || !this.config.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Convert amount to minor units
   * @param {number} amount - Amount in major units
   * @param {string} currency - Currency code
   * @returns {number} Amount in minor units
   */
  convertToMinorUnits(amount, currency) {
    // Most currencies use 2 decimal places
    const decimalPlaces = this.getCurrencyDecimalPlaces(currency);
    return Math.round(amount * Math.pow(10, decimalPlaces));
  }

  /**
   * Get decimal places for currency
   * @param {string} currency - Currency code
   * @returns {number} Decimal places
   */
  getCurrencyDecimalPlaces(currency) {
    // Some currencies don't use decimal places
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    return noDecimalCurrencies.includes(currency) ? 0 : 2;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  updateConfig(updates) {
    this.configLoader.update(updates);
    this.config = this.configLoader.getConfig();
    this.httpClient = new HttpClient(this.config);
  }

  /**
   * Reload configuration from source
   * @param {Object} options - Reload options
   */
  reloadConfig(options = {}) {
    this.config = this.configLoader.load({ ...options, forceReload: true });
    this.httpClient = new HttpClient(this.config);
  }
}

/**
 * Create SDK instance with configuration
 * @param {Object} config - Configuration options
 * @returns {TransactLabSDK} SDK instance
 */
function createSDK(config = {}) {
  return new TransactLabSDK(config);
}

module.exports = createSDK;