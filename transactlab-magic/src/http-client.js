const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * HTTP client for TransactLab Magic SDK
 * Handles retries, timeouts, and error handling
 */
class HttpClient {
  constructor(config) {
    this.config = config;
    this.idempotencyKeys = new Map();
  }

  /**
   * Make HTTP request with retries and error handling
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method
   * @param {string} options.url - Request URL
   * @param {Object} options.headers - Request headers
   * @param {Object} options.body - Request body
   * @param {string} options.idempotencyKey - Idempotency key for retries
   * @returns {Promise<Object>} Response data
   */
  async request(options) {
    const {
      method = 'GET',
      url,
      headers = {},
      body = null,
      idempotencyKey = null
    } = options;

    // Check idempotency
    if (idempotencyKey && this.config.idempotency.enabled) {
      const cached = this.getIdempotentResponse(idempotencyKey);
      if (cached) {
        return cached;
      }
    }

    let lastError;
    const maxAttempts = this.config.retries.maxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.makeRequest({
          method,
          url,
          headers,
          body,
          timeout: this.config.timeout
        });

        // Cache successful response for idempotency
        if (idempotencyKey && this.config.idempotency.enabled && response.success) {
          this.setIdempotentResponse(idempotencyKey, response);
        }

        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = this.config.retries.backoffMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Make single HTTP request
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  makeRequest(options) {
    return new Promise((resolve, reject) => {
      const { method, url, headers, body, timeout } = options;
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TransactLab-Magic-SDK/1.0.0',
          ...headers
        },
        timeout
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const responseData = data ? JSON.parse(data) : {};
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(responseData);
            } else {
              const error = new Error(`HTTP ${res.statusCode}: ${responseData.message || 'Request failed'}`);
              error.status = res.statusCode;
              error.response = responseData;
              reject(error);
            }
          } catch (parseError) {
            const error = new Error(`Invalid JSON response: ${parseError.message}`);
            error.status = res.statusCode;
            error.response = data;
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get cached response for idempotency
   * @param {string} key - Idempotency key
   * @returns {Object|null} Cached response or null
   */
  getIdempotentResponse(key) {
    const cached = this.idempotencyKeys.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    const now = Date.now();
    if (now > cached.expiresAt) {
      this.idempotencyKeys.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached response for idempotency
   * @param {string} key - Idempotency key
   * @param {Object} data - Response data to cache
   */
  setIdempotentResponse(key, data) {
    const expiresAt = Date.now() + (this.config.idempotency.ttlSeconds * 1000);
    this.idempotencyKeys.set(key, { data, expiresAt });

    // Clean up expired keys periodically
    if (this.idempotencyKeys.size > 100) {
      this.cleanupExpiredKeys();
    }
  }

  /**
   * Clean up expired idempotency keys
   */
  cleanupExpiredKeys() {
    const now = Date.now();
    for (const [key, value] of this.idempotencyKeys.entries()) {
      if (now > value.expiresAt) {
        this.idempotencyKeys.delete(key);
      }
    }
  }

  /**
   * Generate idempotency key
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @returns {string} Idempotency key
   */
  generateIdempotencyKey(method, url, body) {
    const crypto = require('crypto');
    const content = JSON.stringify({ method, url, body: body || {} });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make GET request
   * @param {string} url - Request URL
   * @param {Object} headers - Request headers
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object>} Response data
   */
  async get(url, headers = {}, idempotencyKey = null) {
    return this.request({
      method: 'GET',
      url,
      headers,
      idempotencyKey
    });
  }

  /**
   * Make POST request
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} headers - Request headers
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object>} Response data
   */
  async post(url, body, headers = {}, idempotencyKey = null) {
    return this.request({
      method: 'POST',
      url,
      body,
      headers,
      idempotencyKey
    });
  }

  /**
   * Make PUT request
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} headers - Request headers
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object>} Response data
   */
  async put(url, body, headers = {}, idempotencyKey = null) {
    return this.request({
      method: 'PUT',
      url,
      body,
      headers,
      idempotencyKey
    });
  }

  /**
   * Make DELETE request
   * @param {string} url - Request URL
   * @param {Object} headers - Request headers
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object>} Response data
   */
  async delete(url, headers = {}, idempotencyKey = null) {
    return this.request({
      method: 'DELETE',
      url,
      headers,
      idempotencyKey
    });
  }
}

module.exports = HttpClient;
