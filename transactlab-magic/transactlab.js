// TransactLab Magic SDK (pure JS)
// Minimal helpers for one-time and subscription checkouts plus webhook verify
// Usage:
//   const tl = new TransactLab({ baseUrl, sandboxSecret, webhookSecret });
//   await tl.createOneTimeCheckout({ amount, currency, customerEmail });
//   await tl.createSubscription({ planId, customerEmail });
//   const event = tl.verifyWebhook(rawBodyBuffer, headers);

const crypto = require('crypto');

class TransactLab {
  constructor(options) {
    if (!options || !options.baseUrl) throw new Error('baseUrl is required');
    this.baseUrl = String(options.baseUrl).replace(/\/$/, '');
    this.sandboxSecret = options.sandboxSecret;
    this.webhookSecret = options.webhookSecret;
  }

  _headers(extra) {
    const headers = { 'content-type': 'application/json' };
    if (this.sandboxSecret) headers['x-sandbox-secret'] = this.sandboxSecret;
    return { ...headers, ...(extra || {}) };
  }

  async _postJson(path, body) {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body || {})
    });
    const text = await resp.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
    if (!resp.ok) {
      const err = new Error(`HTTP ${resp.status}`);
      err.status = resp.status; err.data = data; throw err;
    }
    return data?.data || data;
  }

  // Returns { sessionId, checkoutUrl, url }
  async createOneTimeCheckout({ amount, currency = 'NGN', customerEmail, customer, items, metadata, success_url, cancel_url, description }) {
    const payload = {
      amount,
      currency,
      description: description || 'Payment',
      customerEmail: customerEmail || (customer && customer.email),
      customer,
      items,
      metadata: metadata || {},
      success_url,
      cancel_url
    };
    const result = await this._postJson('/sessions', payload);
    const sessionId = result?.data?.sessionId || result?.sessionId || result?.id;
    const checkoutUrl = this._normalizeCheckoutUrl(sessionId);
    return { sessionId, checkoutUrl, url: checkoutUrl };
  }

  // Returns { sessionId, subscriptionId?, checkoutUrl }
  async createSubscription({ planId, customerEmail, metadata, success_url, cancel_url, chargeNow = true }) {
    const payload = {
      planId,
      customerEmail,
      metadata: metadata || {},
      success_url,
      cancel_url,
      chargeNow
    };
    const result = await this._postJson('/subscriptions', payload);
    const sessionId = result?.data?.sessionId || result?.sessionId || result?.id;
    const subscriptionId = result?.data?.subscriptionId || result?.subscriptionId;
    const checkoutUrl = this._normalizeCheckoutUrl(sessionId);
    return { sessionId, subscriptionId, checkoutUrl, url: checkoutUrl };
  }

  _normalizeCheckoutUrl(sessionId) {
    if (!sessionId) return undefined;
    // Expect frontend to read from env FRONTEND_URL; falling back to localhost
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${frontendBase}/checkout/${sessionId}`;
  }

  // Verify HMAC SHA-256 signatures; accepts multiple header names
  verifyWebhook(rawBodyBuffer, headers) {
    if (!this.webhookSecret) throw new Error('webhookSecret not configured');
    const hdr = headers || {};
    const sigHeader = hdr['TL-Signature'] || hdr['tl-signature'] || hdr['x-tl-signature'] || hdr['x-webhook-signature'] || hdr['signature'];
    if (!sigHeader) throw new Error('Missing signature header');

    let receivedSig = String(sigHeader);
    if (receivedSig.includes('t=') && receivedSig.includes('s=')) {
      const map = Object.fromEntries(receivedSig.split(',').map(p => p.trim().split('=')));
      receivedSig = map.s || '';
    }
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBodyBuffer).digest('hex');
    const ok = receivedSig && crypto.timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expected, 'hex'));
    if (!ok) throw new Error('Invalid signature');

    const json = JSON.parse(Buffer.from(rawBodyBuffer).toString('utf8'));
    return json;
  }
}

module.exports = { TransactLab };


