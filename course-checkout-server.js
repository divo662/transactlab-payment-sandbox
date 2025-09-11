// Enhanced lightweight sandbox course checkout server
// Usage:
//   npm i express cors dotenv
//   node course-checkout-server.js
// .env (example):
//   PORT=3000
//   TL_BASE=https://transactlab-backend.onrender.com/api/v1/sandbox
//   TL_SECRET=sk_test_secret_...
//   SUCCESS_URL=http://localhost:3000/?payment=success
//   CANCEL_URL=http://localhost:3000/?payment=cancelled
//   TL_WEBHOOK_SECRET=your_webhook_signing_secret
//   FRONTEND_URL=http://localhost:3000

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const CONFIG = {
  TL_BASE: 'https://transactlab-backend.onrender.com/api/v1/sandbox',
  SUCCESS_URL: 'http://localhost:3000/?payment=success',
  CANCEL_URL: 'http://localhost:3000/?payment=cancelled',
  TL_WEBHOOK_SECRET: 'jZ3W82Qbh0Ydl2XboZo7vJxc1chSJRS9',
  FRONTEND_URL: 'https://transactlab-payment-sandbox.vercel.app',
};

// ---- Robust fetch helper with retries and JSON sniffing ----
async function fetchJsonWithRetry(url, options = {}, { retries = 3, retryDelayMs = 600, expectJson = true } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        // Ensure we always ask for JSON; providers may return HTML on 5xx
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        ...options
      });

      const contentType = resp.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const text = await resp.text();
      let data = null;
      if (isJson) {
        try { data = text ? JSON.parse(text) : {}; } catch (e) {
          // If provider sent invalid JSON but status is 2xx, surface raw text
          if (resp.ok) {
            return { ok: resp.ok, status: resp.status, data: null, rawText: text };
          }
          throw new Error(`Invalid JSON from provider (status ${resp.status})`);
        }
      }

      // On non-OK, retry only for 5xx
      if (!resp.ok && resp.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }

      return { ok: resp.ok, status: resp.status, data, rawText: isJson ? undefined : text };
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('Unknown fetch error');
}

// In‑memory stores with better error handling
const enrollments = new Map(); // key: email+offer
const webhookEvents = new Set();

// Hardcoded auth headers for testing
function getAuthHeaders() {
  const secret = 'sk_test_secret_mfdyeivx_6a8462bd27c4bc1ec7fb328646ec6649';
  console.log('🔑 Using sandbox secret:', secret.substring(0, 20) + '...');
  return {
    'x-sandbox-secret': secret,
    'Content-Type': 'application/json'
  };
}

function enrollmentKey(email = '', offer = '') {
  return `${String(email).toLowerCase()}__${String(offer)}`;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Enhanced URL normalization using internal proxy
function normalizeCheckoutUrl(apiResponse) {
  const data = apiResponse?.data || apiResponse;
  const sessionId = data?.sessionId || data?.id || data?.session_id;

  if (!sessionId) {
    throw new Error('No sessionId found in API response');
  }

  // Option A (Hosted Checkout): always prefer provider-hosted checkout URL
  const backendOrigin = (() => { try { return new URL(CONFIG.TL_BASE).origin; } catch { return 'https://transactlab-backend.onrender.com'; } })();
  const providerCheckoutUrl = data?.checkoutUrl || `${backendOrigin}/checkout/${sessionId}`;
  const checkoutUrl = providerCheckoutUrl;
  
  console.log('🔗 Generated checkout URL:', checkoutUrl);
  console.log('📋 Session ID:', sessionId);
  console.log('🏢 Backend Origin:', backendOrigin);

  return {
    sessionId: sessionId,
    checkoutUrl,
    originalResponse: data
  };
}

// Enhanced error logging
function logError(context, error, additionalData = {}) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    ...additionalData
  });
}

// CORS + static + JSON body with enhanced error handling
app.use(cors({
  origin: (origin, cb) => {
    const allow = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      CONFIG.FRONTEND_URL
    ].filter(Boolean);
    if (!origin) return cb(null, true);
    return cb(null, allow.some(o => String(origin).startsWith(String(o))));
  },
  credentials: true
}));

app.use(express.json({ 
  verify: (req, _res, buf) => { req.rawBody = buf; },
  limit: '10mb'
}));

app.use(express.static(path.join(__dirname, 'public')));

// Enhanced healthcheck with configuration validation
app.get('/api/health', (req, res) => {
  const authHeaders = getAuthHeaders();
  const hasAuth = Object.keys(authHeaders).length > 0;
  
  res.json({ 
    ok: true, 
    TL_BASE: CONFIG.TL_BASE,
    hasAuthentication: hasAuth,
    authMethod: hasAuth ? Object.keys(authHeaders)[0] : 'none',
    enrollmentsCount: enrollments.size,
    timestamp: new Date().toISOString()
  });
});

// Enhanced session creation with better error handling and logging
app.post('/api/create-session', async (req, res) => {
  try {
    const payload = req.body || {};
    const headers = { 
      ...getAuthHeaders()
    };

    console.log('📝 Creating session with payload:', {
      amount: payload.amount,
      currency: payload.currency,
      customerEmail: payload.customerEmail,
      description: payload.description,
      fullPayload: payload
    });

    // Send amount in major units (API handles conversion internally)
    const amount = payload.amount;
    const currency = payload.currency || 'NGN';
    
    console.log('💰 Amount being sent:', {
      amount: amount,
      currency: currency
    });

    const requestBody = {
      amount: amount,
      currency: currency,
      description: payload.description || 'Course Registration',
      customer: payload.customer,
      customerEmail: payload.customerEmail || payload.customer?.email,
      items: payload.items,
      success_url: payload.success_url || CONFIG.SUCCESS_URL,
      cancel_url: payload.cancel_url || CONFIG.CANCEL_URL,
      metadata: payload.metadata || {},
    };

    console.log('🚀 Sending request to TransactLab:', {
      url: `${CONFIG.TL_BASE}/sessions`,
      headers: headers,
      body: requestBody
    });

    const result = await fetchJsonWithRetry(`${CONFIG.TL_BASE}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    }, { retries: 3, retryDelayMs: 700 });

    if (!result.ok) {
      logError('create-session', new Error('API request failed'), { 
        status: result.status, 
        response: result.data || result.rawText,
        requestBody 
      });
      return res.status(result.status).json({
        success: false,
        error: (result.data && (result.data.error || result.data.message)) || 'Payment provider error',
        details: result.data || (result.rawText ? String(result.rawText).slice(0, 500) : undefined)
      });
    }

    // Normalize the checkout URL
    const normalized = normalizeCheckoutUrl(result.data);
    
    // Store enrollment info
    const email = payload.customerEmail || payload.customer?.email;
    const offer = payload?.metadata?.offer || 'one_time';
    const key = enrollmentKey(email, offer);
    
    if (email && !enrollments.has(key)) {
      enrollments.set(key, {
        email,
        offer,
        program: payload?.metadata?.program,
        status: 'pending',
        sessionId: normalized.sessionId,
        subscriptionId: null,
        startAt: null,
        endAt: null,
        createdAt: new Date().toISOString()
      });
    }

    console.log('Session created successfully:', {
      sessionId: normalized.sessionId,
      checkoutUrl: normalized.checkoutUrl
    });

    // Return consistent response format
    res.json({ 
      success: true, 
      url: normalized.checkoutUrl,
      data: { 
        sessionId: normalized.sessionId,
        checkoutUrl: normalized.checkoutUrl,
        url: normalized.checkoutUrl
      }
    });

  } catch (error) {
    logError('create-session', error, { body: req.body });
    res.status(500).json({ 
      success: false, 
      message: 'create-session failed', 
      error: error.message 
    });
  }
});

// Create a session and redirect the browser to the frontend checkout URL
app.post('/api/create-session-redirect', async (req, res) => {
  try {
    const payload = req.body || {};
    const headers = { 
      ...getAuthHeaders()
    };

    const amount = payload.amount;
    const currency = payload.currency || 'NGN';

    const requestBody = {
      amount: amount,
      currency: currency,
      description: payload.description || 'Course Registration',
      customer: payload.customer,
      customerEmail: payload.customerEmail || payload.customer?.email,
      items: payload.items,
      success_url: payload.success_url || CONFIG.SUCCESS_URL,
      cancel_url: payload.cancel_url || CONFIG.CANCEL_URL,
      metadata: payload.metadata || {},
    };

    const resp = await fetch(`${CONFIG.TL_BASE}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const text = await resp.text();
    const data = text ? JSON.parse(text) : {};

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: 'Payment provider error', details: data });
    }

    const normalized = normalizeCheckoutUrl(data);
    return res.redirect(302, normalized.checkoutUrl);
  } catch (error) {
    logError('create-session-redirect', error, { body: req.body });
    return res.status(500).json({ success: false, message: 'create-session-redirect failed', error: error.message });
  }
});

// Public session proxy (no secret): returns provider's public checkout JSON
app.get('/api/public-sessions/:id', async (req, res) => {
  try {
    const backendOrigin = (() => { try { return new URL(CONFIG.TL_BASE).origin; } catch { return 'https://transactlab-backend.onrender.com'; } })();
    const resp = await fetch(`${backendOrigin}/checkout/${req.params.id}`);
    const text = await resp.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
});

// Enhanced subscription creation with better error handling
app.post('/api/create-subscription', async (req, res) => {
  try {
    const payload = req.body || {};
    const headers = { 
      'content-type': 'application/json', 
      ...getAuthHeaders() 
    };

    console.log('Creating subscription with payload:', {
      planId: payload.planId,
      customerEmail: payload.customerEmail
    });

    if (!payload.planId) {
      return res.status(400).json({
        success: false,
        error: 'planId is required for subscription creation'
      });
    }

    const requestBody = {
      planId: payload.planId,
      customerEmail: payload.customerEmail,
      metadata: payload.metadata || {},
      success_url: payload.success_url || CONFIG.SUCCESS_URL,
      cancel_url: payload.cancel_url || CONFIG.CANCEL_URL,
    };

    const subResult = await fetchJsonWithRetry(`${CONFIG.TL_BASE}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    }, { retries: 3, retryDelayMs: 700 });

    if (!subResult.ok) {
      logError('create-subscription', new Error('API request failed'), { 
        status: subResult.status, 
        response: subResult.data || subResult.rawText,
        requestBody 
      });
      return res.status(subResult.status).json({
        success: false,
        error: (subResult.data && (subResult.data.error || subResult.data.message)) || 'Payment provider error',
        details: subResult.data || (subResult.rawText ? String(subResult.rawText).slice(0, 500) : undefined)
      });
    }

    // Normalize the checkout URL
    const normalized = normalizeCheckoutUrl(subResult.data);
    const subscriptionId = subResult.data?.data?.subscriptionId || subResult.data?.subscriptionId || subResult.data?.id;

    // Store enrollment info
    const email = payload.customerEmail;
    const offer = payload?.metadata?.offer || 'monthly_6m';
    const key = enrollmentKey(email, offer);
    
    if (email && !enrollments.has(key)) {
      enrollments.set(key, {
        email,
        offer,
        program: payload?.metadata?.program,
        status: 'pending',
        subscriptionId,
        sessionId: normalized.sessionId,
        startAt: null,
        endAt: null,
        createdAt: new Date().toISOString()
      });
    }

    console.log('Subscription created successfully:', {
      subscriptionId,
      sessionId: normalized.sessionId,
      checkoutUrl: normalized.checkoutUrl
    });

    // Return consistent response format
    res.json({ 
      success: true, 
      url: normalized.checkoutUrl,
      data: { 
        subscriptionId,
        sessionId: normalized.sessionId,
        checkoutUrl: normalized.checkoutUrl,
        url: normalized.checkoutUrl
      }
    });

  } catch (error) {
    logError('create-subscription', error, { body: req.body });
    res.status(500).json({ 
      success: false, 
      message: 'create-subscription failed', 
      error: error.message 
    });
  }
});

// Enhanced webhook handling with better signature verification and event processing
app.post('/webhooks/transactlab', express.raw({ type: '*/*' }), (req, res) => {
  try {
    const raw = req.body; // Buffer
    const secret = CONFIG.TL_WEBHOOK_SECRET;
    
    if (!secret) {
      logError('webhook', new Error('TL_WEBHOOK_SECRET not configured'));
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Enhanced signature verification with multiple header formats
    const sigHeader = req.header('TL-Signature') || 
                     req.header('x-tl-signature') || 
                     req.header('x-webhook-signature') || 
                     req.header('signature') || '';
    
    let receivedSig = sigHeader;
    
    // Handle Stripe-style signature format (t=timestamp,s=signature)
    if (sigHeader.includes('t=') && sigHeader.includes('s=')) {
      const sigParts = Object.fromEntries(
        sigHeader.split(',').map(part => part.trim().split('='))
      );
      receivedSig = sigParts.s || '';
    }

    // Generate expected signature
    const expected = crypto.createHmac('sha256', secret)
                          .update(raw)
                          .digest('hex');

    // Verify signature
    if (!receivedSig || !crypto.timingSafeEqual(
      Buffer.from(receivedSig, 'hex'), 
      Buffer.from(expected, 'hex')
    )) {
      logError('webhook', new Error('Invalid signature'), {
        receivedSig: receivedSig ? 'present' : 'missing',
        expectedLength: expected.length,
        receivedLength: receivedSig.length
      });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event = JSON.parse(raw.toString('utf8'));
    const eventId = event.id || crypto.createHash('sha256').update(raw).digest('hex');
    
    // Idempotency check
    if (webhookEvents.has(eventId)) {
      console.log(`Duplicate webhook event: ${eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }
    
    webhookEvents.add(eventId);
    console.log(`Processing webhook event: ${event.type} (${eventId})`);

    // Process different event types
    switch (event.type) {
      case 'session.completed': {
        const sessionId = event.data?.sessionId || event.data?.id;
        const email = event.data?.customerEmail || event.data?.customer?.email;
        const offer = event.data?.metadata?.offer || 'one_time';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        rec.status = 'active';
        rec.sessionId = sessionId;
        rec.startAt = new Date();
        rec.endAt = addMonths(new Date(), 6);
        rec.completedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Session completed for ${email}: ${sessionId}`);
        break;
      }
      
      case 'subscription.created': {
        const email = event.data?.customerEmail;
        const offer = event.data?.metadata?.offer || 'monthly_6m';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        rec.status = 'pending';
        rec.subscriptionId = event.data?.subscriptionId || event.data?.id;
        rec.updatedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Subscription created for ${email}: ${rec.subscriptionId}`);
        break;
      }
      
      case 'invoice.paid': {
        const email = event.data?.customerEmail;
        const offer = event.data?.metadata?.offer || 'monthly_6m';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        
        // If first payment, set start/end dates
        if (!rec.startAt) {
          rec.startAt = new Date();
          rec.endAt = addMonths(new Date(), 6);
        }
        
        rec.status = 'active';
        rec.lastInvoiceAt = new Date();
        rec.updatedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Invoice paid for ${email}: ${rec.subscriptionId || 'N/A'}`);
        break;
      }
      
      case 'subscription.cancelled': {
        const email = event.data?.customerEmail;
        const offer = event.data?.metadata?.offer || 'monthly_6m';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        rec.status = 'cancelled';
        rec.cancelledAt = new Date().toISOString();
        rec.updatedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Subscription cancelled for ${email}: ${rec.subscriptionId || 'N/A'}`);
        break;
      }
      
      case 'payment.failed':
      case 'invoice.payment_failed': {
        const email = event.data?.customerEmail;
        const offer = event.data?.metadata?.offer || 'monthly_6m';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        rec.status = 'past_due';
        rec.lastFailureAt = new Date().toISOString();
        rec.updatedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Payment failed for ${email}: ${rec.subscriptionId || rec.sessionId || 'N/A'}`);
        break;
      }
      
      case 'refund.processed': {
        const email = event.data?.customerEmail;
        const offer = event.data?.metadata?.offer || 'one_time';
        const key = enrollmentKey(email, offer);
        
        const rec = enrollments.get(key) || { email, offer };
        rec.status = 'refunded';
        rec.refundedAt = new Date().toISOString();
        rec.updatedAt = new Date().toISOString();
        enrollments.set(key, rec);
        
        console.log(`Refund processed for ${email}: ${rec.sessionId || 'N/A'}`);
        break;
      }
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }

    return res.status(200).json({ received: true, eventType: event.type });
    
  } catch (error) {
    logError('webhook', error, {
      headers: req.headers,
      bodyLength: req.body ? req.body.length : 0
    });
    return res.status(400).json({ error: error.message });
  }
});

// Enhanced debug endpoints
app.get('/api/enrollments', (req, res) => {
  const enrollmentList = Array.from(enrollments.values());
  res.json({
    count: enrollmentList.length,
    enrollments: enrollmentList
  });
});

// Get specific enrollment
app.get('/api/enrollments/:email', (req, res) => {
  const email = req.params.email.toLowerCase();
  const userEnrollments = Array.from(enrollments.values())
    .filter(e => e.email.toLowerCase() === email);
  
  res.json({
    email,
    count: userEnrollments.length,
    enrollments: userEnrollments
  });
});

// Clear enrollments (for testing)
app.delete('/api/enrollments', (req, res) => {
  const count = enrollments.size;
  enrollments.clear();
  webhookEvents.clear();
  
  res.json({
    message: `Cleared ${count} enrollments and webhook events`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logError('express', error, {
    method: req.method,
    url: req.url,
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🎓 Enrollments: http://localhost:${port}/api/enrollments`);
  
  // Validate configuration
  const authHeaders = getAuthHeaders();
  if (Object.keys(authHeaders).length === 0) {
    console.warn('⚠️  Warning: No authentication configured. Set TL_SECRET, TL_SECRET_KEY, or TL_TOKEN');
  } else {
    console.log(`✅ Authentication: ${Object.keys(authHeaders)[0]}`);
  }
  
  if (!CONFIG.TL_WEBHOOK_SECRET) {
    console.warn('⚠️  Warning: TL_WEBHOOK_SECRET not set. Webhooks will not work.');
  } else {
    console.log('✅ Webhook secret configured');
  }
});

// ===== Workspace-bound hosted checkout helpers =====

// Proxy: fetch session using server auth so browser never needs a token
app.get('/internal/checkout/sessions/:id', async (req, res) => {
  try {
    const headers = { 'content-type': 'application/json', ...getAuthHeaders() };
    const resp = await fetch(`${CONFIG.TL_BASE}/sessions/${req.params.id}`, { headers });
    const text = await resp.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
});

// Proxy: process payment (sandbox completes and fires webhooks)
app.post('/internal/checkout/sessions/:id/process', async (req, res) => {
  try {
    const headers = { 'content-type': 'application/json', ...getAuthHeaders() };
    const resp = await fetch(`${CONFIG.TL_BASE}/sessions/${req.params.id}/process-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const text = await resp.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
});

// --- Neutral proxy aliases (recommended for third-party developers) ---
// GET: fetch session via your server (no browser secrets)
app.get('/proxy/checkout/sessions/:id', async (req, res) => {
  try {
    const headers = { 'content-type': 'application/json', ...getAuthHeaders() };
    const resp = await fetch(`${CONFIG.TL_BASE}/sessions/${req.params.id}`, { headers });
    const text = await resp.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
});

// POST: process payment via your server (adds sandbox secret server-side)
app.post('/proxy/checkout/sessions/:id/process', async (req, res) => {
  try {
    const headers = { 'content-type': 'application/json', ...getAuthHeaders() };
    const resp = await fetch(`${CONFIG.TL_BASE}/sessions/${req.params.id}/process-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const text = await resp.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
});

// Convenience: always return a workspace-normalized checkout URL
app.get('/api/checkout-url/:sessionId', (req, res) => {
  const id = req.params.sessionId;
  if (!id) return res.status(400).json({ success: false, error: 'sessionId required' });
  const url = `${CONFIG.FRONTEND_URL}/checkout/${id}`;
  res.json({ success: true, url });
});

// Redirect to TransactLab's workspace-bound hosted checkout
app.get('/checkout/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const checkoutUrl = `${CONFIG.FRONTEND_URL}/checkout/${sessionId}`;
  
  console.log('🔄 Redirecting from localhost checkout to:', checkoutUrl);
  console.log('📋 Session ID:', sessionId);
  
  res.redirect(302, checkoutUrl);
});