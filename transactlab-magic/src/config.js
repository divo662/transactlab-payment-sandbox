const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Configuration loader for TransactLab Magic SDK
 * Handles vault decryption, environment overrides, and validation
 */
class ConfigLoader {
  constructor() {
    this.config = null;
    this.vaultPath = path.join(__dirname, '..', '.vault');
    this.envOverrides = this.loadEnvOverrides();
  }

  /**
   * Load configuration from vault or environment
   * @param {Object} options - Configuration options
   * @param {string} options.vaultPassword - Password for vault decryption
   * @param {boolean} options.forceReload - Force reload from source
   * @returns {Object} Configuration object
   */
  load(options = {}) {
    if (this.config && !options.forceReload) {
      return this.config;
    }

    try {
      // Try to load from vault first
      if (fs.existsSync(this.vaultPath)) {
        this.config = this.loadFromVault(options.vaultPassword);
      } else {
        // Fallback to environment variables
        this.config = this.loadFromEnv();
      }

      // Apply environment overrides
      this.applyEnvOverrides();

      // Validate configuration
      this.validate();

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Load configuration from encrypted vault
   * @param {string} password - Vault password
   * @returns {Object} Decrypted configuration
   */
  loadFromVault(password) {
    if (!password) {
      throw new Error('Vault password required for encrypted configuration');
    }

    try {
      const encryptedData = fs.readFileSync(this.vaultPath, 'utf8');
      const decryptedData = this.decrypt(encryptedData, password);
      return JSON.parse(decryptedData);
    } catch (error) {
      throw new Error(`Failed to decrypt vault: ${error.message}`);
    }
  }

  /**
   * Load configuration from environment variables
   * @returns {Object} Configuration from environment
   */
  loadFromEnv() {
    const required = [
      'TL_API_KEY',
      'TL_WEBHOOK_SECRET',
      'TL_SUCCESS_URL',
      'TL_CANCEL_URL',
      'TL_CALLBACK_URL',
      'TL_FRONTEND_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
      apiKey: process.env.TL_API_KEY,
      webhookSecret: process.env.TL_WEBHOOK_SECRET,
      urls: {
        success: process.env.TL_SUCCESS_URL,
        cancel: process.env.TL_CANCEL_URL,
        callback: process.env.TL_CALLBACK_URL,
        frontend: process.env.TL_FRONTEND_URL
      },
      environment: process.env.TL_ENVIRONMENT || 'sandbox',
      baseUrl: process.env.TL_BASE_URL || this.getDefaultBaseUrl(),
      retries: {
        maxAttempts: parseInt(process.env.TL_MAX_RETRIES) || 3,
        backoffMs: parseInt(process.env.TL_BACKOFF_MS) || 1000
      },
      timeout: parseInt(process.env.TL_TIMEOUT_MS) || 30000,
      idempotency: {
        enabled: process.env.TL_IDEMPOTENCY !== 'false',
        ttlSeconds: parseInt(process.env.TL_IDEMPOTENCY_TTL) || 3600
      }
    };
  }

  /**
   * Get default base URL based on environment
   * @returns {string} Base URL
   */
  getDefaultBaseUrl() {
    const env = process.env.TL_ENVIRONMENT || 'sandbox';
    return env === 'production' 
      ? 'https://api.transactlab.com/api/v1'
      : 'https://transactlab-backend.onrender.com/api/v1';
  }

  /**
   * Load environment variable overrides
   * @returns {Object} Environment overrides
   */
  loadEnvOverrides() {
    const overrides = {};
    
    // URL overrides
    if (process.env.TL_SUCCESS_URL) overrides['urls.success'] = process.env.TL_SUCCESS_URL;
    if (process.env.TL_CANCEL_URL) overrides['urls.cancel'] = process.env.TL_CANCEL_URL;
    if (process.env.TL_CALLBACK_URL) overrides['urls.callback'] = process.env.TL_CALLBACK_URL;
    if (process.env.TL_FRONTEND_URL) overrides['urls.frontend'] = process.env.TL_FRONTEND_URL;
    
    // API overrides
    if (process.env.TL_API_KEY) overrides.apiKey = process.env.TL_API_KEY;
    if (process.env.TL_WEBHOOK_SECRET) overrides.webhookSecret = process.env.TL_WEBHOOK_SECRET;
    if (process.env.TL_BASE_URL) overrides.baseUrl = process.env.TL_BASE_URL;
    
    // Retry overrides
    if (process.env.TL_MAX_RETRIES) overrides['retries.maxAttempts'] = parseInt(process.env.TL_MAX_RETRIES);
    if (process.env.TL_BACKOFF_MS) overrides['retries.backoffMs'] = parseInt(process.env.TL_BACKOFF_MS);
    
    // Timeout overrides
    if (process.env.TL_TIMEOUT_MS) overrides.timeout = parseInt(process.env.TL_TIMEOUT_MS);
    
    // Idempotency overrides
    if (process.env.TL_IDEMPOTENCY) overrides['idempotency.enabled'] = process.env.TL_IDEMPOTENCY !== 'false';
    if (process.env.TL_IDEMPOTENCY_TTL) overrides['idempotency.ttlSeconds'] = parseInt(process.env.TL_IDEMPOTENCY_TTL);

    return overrides;
  }

  /**
   * Apply environment variable overrides to configuration
   */
  applyEnvOverrides() {
    Object.keys(this.envOverrides).forEach(key => {
      this.setNestedProperty(this.config, key, this.envOverrides[key]);
    });
  }

  /**
   * Set nested property using dot notation
   * @param {Object} obj - Target object
   * @param {string} path - Property path (e.g., 'urls.success')
   * @param {*} value - Value to set
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate configuration
   * @throws {Error} If configuration is invalid
   */
  validate() {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }

    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret is required');
    }

    if (!this.config.urls.success) {
      throw new Error('Success URL is required');
    }

    if (!this.config.urls.cancel) {
      throw new Error('Cancel URL is required');
    }

    if (!this.config.urls.callback) {
      throw new Error('Callback URL is required');
    }

    if (!this.config.baseUrl) {
      throw new Error('Base URL is required');
    }

    // Validate URLs
    const urlFields = ['success', 'cancel', 'callback', 'frontend'];
    urlFields.forEach(field => {
      if (this.config.urls[field] && !this.isValidUrl(this.config.urls[field])) {
        throw new Error(`Invalid ${field} URL: ${this.config.urls[field]}`);
      }
    });

    // Validate numeric values
    if (this.config.retries.maxAttempts < 1 || this.config.retries.maxAttempts > 10) {
      throw new Error('Max retries must be between 1 and 10');
    }

    if (this.config.retries.backoffMs < 100 || this.config.retries.backoffMs > 10000) {
      throw new Error('Backoff delay must be between 100ms and 10s');
    }

    if (this.config.timeout < 1000 || this.config.timeout > 300000) {
      throw new Error('Timeout must be between 1s and 5m');
    }
  }

  /**
   * Check if string is a valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt data with password
   * @param {string} data - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {string} Encrypted data
   */
  encrypt(data, password) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('transactlab-magic', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  /**
   * Decrypt data with password
   * @param {string} encryptedData - Encrypted data
   * @param {string} password - Decryption password
   * @returns {string} Decrypted data
   */
  decrypt(encryptedData, password) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    
    const parsed = JSON.parse(encryptedData);
    const iv = Buffer.from(parsed.iv, 'hex');
    const authTag = Buffer.from(parsed.authTag, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('transactlab-magic', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Save configuration to vault
   * @param {Object} config - Configuration to save
   * @param {string} password - Vault password
   */
  saveToVault(config, password) {
    const encryptedData = this.encrypt(JSON.stringify(config), password);
    fs.writeFileSync(this.vaultPath, encryptedData);
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  update(updates) {
    this.config = { ...this.config, ...updates };
    this.validate();
  }
}

module.exports = ConfigLoader;
