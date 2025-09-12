const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const tl = require('../../src/transactlab')();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// One-time payment endpoint
app.post('/api/payment/one-time', async (req, res) => {
  try {
    const { amount, currency, description, customerEmail, customerName, metadata } = req.body;
    
    // Validate required fields
    if (!amount || !currency || !description || !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: amount, currency, description, customerEmail' 
      });
    }

    const session = await tl.createSession({
      amount,
      currency,
      description,
      customerEmail,
      customerName,
      metadata: metadata || {}
    });

    res.json({ 
      success: true, 
      checkoutUrl: session?.data?.checkoutUrl,
      data: session?.data || session 
    });
  } catch (error) {
    console.error('One-time payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Subscription payment endpoint
app.post('/api/payment/subscription', async (req, res) => {
  try {
    const { planId, customerEmail, customerName, trialDays, metadata, chargeNow } = req.body;
    
    // Validate required fields
    if (!planId || !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: planId, customerEmail' 
      });
    }

    const subscription = await tl.createSubscription({
      planId,
      customerEmail,
      customerName,
      trialDays,
      metadata: metadata || {},
      chargeNow: chargeNow !== false
    });

    res.json({ 
      success: true, 
      checkoutUrl: subscription?.data?.checkoutUrl,
      data: subscription?.data || subscription 
    });
  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Payment processing endpoint (Server Bridge)
app.post('/api/payment/process/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const paymentData = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }

    const result = await tl.processPayment(sessionId, paymentData);
    res.json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Webhook handler
app.post('/webhooks/transactlab', tl.handleWebhook((event) => {
  console.log('Received webhook event:', event?.type);
  
  // Handle different event types
  switch (event?.type) {
    case 'session.completed':
      console.log('Payment completed:', event.data?.object?.id);
      // Update your database, send confirmation email, etc.
      break;
      
    case 'session.cancelled':
      console.log('Payment cancelled:', event.data?.object?.id);
      // Handle cancellation
      break;
      
    case 'subscription.created':
      console.log('Subscription created:', event.data?.object?.id);
      // Activate subscription in your system
      break;
      
    case 'subscription.cancelled':
      console.log('Subscription cancelled:', event.data?.object?.id);
      // Deactivate subscription in your system
      break;
      
    case 'invoice.paid':
      console.log('Invoice paid:', event.data?.object?.id);
      // Process recurring payment
      break;
      
    case 'payment.failed':
      console.log('Payment failed:', event.data?.object?.id);
      // Handle payment failure
      break;
      
    case 'fraud.review_required':
      console.log('Payment under review:', event.data?.object?.id);
      // Handle fraud review
      break;
      
    case 'fraud.blocked':
      console.log('Payment blocked by fraud:', event.data?.object?.id);
      // Handle fraud block
      break;
      
    default:
      console.log('Unknown event type:', event?.type);
  }
  
  return { received: true };
}));

// Example usage endpoints
app.get('/api/examples/one-time', (req, res) => {
  res.json({
    description: 'One-time payment example',
    endpoint: 'POST /api/payment/one-time',
    body: {
      amount: 300000,
      currency: 'NGN',
      description: 'Product Purchase',
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      metadata: {
        product_id: 'prod_123',
        source: 'website'
      }
    }
  });
});

app.get('/api/examples/subscription', (req, res) => {
  res.json({
    description: 'Subscription payment example',
    endpoint: 'POST /api/payment/subscription',
    body: {
      planId: 'plan_monthly_50k',
      customerEmail: 'subscriber@example.com',
      customerName: 'Jane Smith',
      trialDays: 14,
      metadata: {
        tier: 'premium',
        source: 'website'
      },
      chargeNow: true
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

const PORT = process.env.PORT || 5055;
app.listen(PORT, () => {
  console.log(`🚀 TransactLab Magic SDK Example Server running on http://localhost:${PORT}`);
  console.log(`📚 API Examples:`);
  console.log(`   GET  /api/examples/one-time     - One-time payment example`);
  console.log(`   GET  /api/examples/subscription - Subscription example`);
  console.log(`   POST /api/payment/one-time      - Create one-time payment`);
  console.log(`   POST /api/payment/subscription  - Create subscription`);
  console.log(`   POST /api/payment/process/:id   - Process payment`);
  console.log(`   POST /webhooks/transactlab      - Webhook handler`);
});
