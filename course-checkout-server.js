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
  TL_BASE: process.env.TL_BASE || 'https://transactlab-backend.onrender.com/api/v1/sandbox',
  SUCCESS_URL: process.env.SUCCESS_URL || 'http://localhost:3000/?payment=success',
  CANCEL_URL: process.env.CANCEL_URL || 'http://localhost:3000/?payment=cancelled',
  TL_WEBHOOK_SECRET: process.env.TL_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Workspace checkout BASE (no trailing /checkout). We will append /checkout/{sessionId}
  TL_CHECKOUT_BASE: process.env.TL_CHECKOUT_BASE || 'https://transactlab-payment-sandbox.vercel.app',
};

// In‑memory stores with better error handling
const enrollments = new Map(); // key: email+offer
const webhookEvents = new Set();

// Enhanced auth header detection
function getAuthHeaders() {
  const headers = {};
  if (process.env.TL_SECRET) {
    headers['x-sandbox-secret'] = process.env.TL_SECRET;
  } else if (process.env.TL_SECRET_KEY) {
    headers['x-api-key'] = process.env.TL_SECRET_KEY;
  } else if (process.env.TL_TOKEN) {
    headers['authorization'] = process.env.TL_TOKEN.startsWith('Bearer ') 
      ? process.env.TL_TOKEN 
      : `Bearer ${process.env.TL_TOKEN}`;
  } else {
    console.warn('Warning: No authentication method found. Set TL_SECRET, TL_SECRET_KEY, or TL_TOKEN');
  }
  return headers;
}

function enrollmentKey(email = '', offer = '') {
  return `${String(email).toLowerCase()}__${String(offer)}`;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Enhanced URL normalization with better error handling
function normalizeCheckoutUrl(apiResponse) {
  const data = apiResponse?.data || apiResponse;
  let checkoutUrl = data?.checkoutUrl || data?.url || null;
  const sessionId = data?.sessionId || data?.id || data?.session_id;

  // CRITICAL: Always use YOUR workspace checkout base, never trust external domains
  if (sessionId) {
    // Build the checkout URL using YOUR workspace's checkout base (strip any trailing /checkout)
    let base = CONFIG.TL_CHECKOUT_BASE.replace(/\/$/, '');
    base = base.replace(/\/checkout$/, '');
    checkoutUrl = `${base}/checkout/${sessionId}`;
  } else if (checkoutUrl) {
    // If we have a checkout URL but no sessionId, extract sessionId from URL
    const sessionMatch = checkoutUrl.match(/\/checkout\/([^\/\?]+)/);
    if (sessionMatch) {
      const extractedSessionId = sessionMatch[1];
      let base = CONFIG.TL_CHECKOUT_BASE.replace(/\/$/, '');
      base = base.replace(/\/checkout$/, '');
      // Rebuild with YOUR workspace checkout base
      checkoutUrl = `${base}/checkout/${extractedSessionId}`;
    }
  }

  if (!checkoutUrl) {
    throw new Error('No checkout URL could be generated. API returned neither checkoutUrl nor sessionId.');
  }

  return {
    sessionId: sessionId || checkoutUrl.match(/\/checkout\/([^\/\?]+)/)?.[1],
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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
      'content-type': 'application/json', 
      ...getAuthHeaders() 
    };

    console.log('Creating session with payload:', {
      amount: payload.amount,
      currency: payload.currency,
      customerEmail: payload.customerEmail,
      description: payload.description
    });

    const requestBody = {
      amount: payload.amount,
      currency: payload.currency || 'NGN',
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

    const responseText = await resp.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      logError('create-session', parseError, { responseText, status: resp.status });
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response from payment provider',
        details: responseText.substring(0, 200)
      });
    }

    if (!resp.ok) {
      logError('create-session', new Error('API request failed'), { 
        status: resp.status, 
        response: data,
        requestBody 
      });
      return res.status(resp.status).json({
        success: false,
        error: data.error || data.message || 'Payment provider error',
        details: data
      });
    }

    // Normalize the checkout URL
    const normalized = normalizeCheckoutUrl(data);
    
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

    const resp = await fetch(`${CONFIG.TL_BASE}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await resp.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      logError('create-subscription', parseError, { responseText, status: resp.status });
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response from payment provider',
        details: responseText.substring(0, 200)
      });
    }

    if (!resp.ok) {
      logError('create-subscription', new Error('API request failed'), { 
        status: resp.status, 
        response: data,
        requestBody 
      });
      return res.status(resp.status).json({
        success: false,
        error: data.error || data.message || 'Payment provider error',
        details: data
      });
    }

    // Normalize the checkout URL
    const normalized = normalizeCheckoutUrl(data);
    const subscriptionId = data?.data?.subscriptionId || data?.subscriptionId || data?.id;

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

// Convenience: always return a workspace-normalized checkout URL
app.get('/api/checkout-url/:sessionId', (req, res) => {
  const id = req.params.sessionId;
  if (!id) return res.status(400).json({ success: false, error: 'sessionId required' });
  let base = CONFIG.TL_CHECKOUT_BASE.replace(/\/$/, '');
  base = base.replace(/\/checkout$/, '');
  const url = `${base}/checkout/${id}`;
  res.json({ success: true, url });
});

// Minimal hosted checkout page (optional) served by this server
app.get('/checkout/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const successUrl = CONFIG.SUCCESS_URL;
  const cancelUrl = CONFIG.CANCEL_URL;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Checkout</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:24px;max-width:720px;margin:0 auto}button{padding:10px 14px;border:0;border-radius:8px;background:#0a164d;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.6;cursor:not-allowed}.panel{border:1px solid #e6e9ef;border-radius:12px;padding:16px;margin-top:12px}</style>
</head><body>
<h1>Sandbox Checkout</h1>
<div id="msg">Loading session...</div>
<div class="panel" id="details" style="display:none"></div>
<div style="margin-top:12px">
  <button id="pay">Complete Test Payment</button>
  <button id="cancel" style="margin-left:8px;background:#666">Cancel</button>
</div>
<script>
const id = ${JSON.stringify(sessionId)};
const successUrl = ${JSON.stringify(successUrl)};
const cancelUrl = ${JSON.stringify(cancelUrl)};
const msg = document.getElementById('msg');
const details = document.getElementById('details');
const payBtn = document.getElementById('pay');
const cancelBtn = document.getElementById('cancel');

fetch('/internal/checkout/sessions/' + id)
  .then(r=>r.json())
  .then(s => {
    if (!s || s.success === false) throw new Error('Unable to load session');
    msg.textContent = 'Review and complete your sandbox payment';
    details.style.display='block';
    const d = s.data || s;
    details.innerHTML = '<div><b>Description:</b> ' + (d.description||'—') + '</div>'+
                        '<div><b>Amount:</b> ' + (d.amount||d.amount_minor||'—') + ' ' + (d.currency||'') + '</div>'+
                        '<div><b>Session:</b> ' + id + '</div>';
  })
  .catch(e => { msg.textContent = 'Failed to load session'; console.error(e); });

payBtn.onclick = () => {
  payBtn.disabled = true;
  fetch('/internal/checkout/sessions/' + id + '/process', { method:'POST' })
    .then(r=>r.json())
    .then(_ => { window.location.href = successUrl; })
    .catch(e => { payBtn.disabled=false; alert('Failed to process payment'); console.error(e); });
};

cancelBtn.onclick = () => { window.location.href = cancelUrl; };
</script>
</body></html>`);
});