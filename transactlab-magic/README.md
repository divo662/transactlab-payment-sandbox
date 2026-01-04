# TransactLab Magic SDK

The TransactLab Magic SDK is a powerful, easy-to-use library for integrating TransactLab payment processing into your applications. It provides a simple interface for creating sessions, managing subscriptions, and handling webhooks with automatic retries and error handling.

## Features

- 🚀 **Easy Integration**: Simple API for one-time payments and subscriptions
- 🔒 **Secure**: Built-in webhook signature verification and encrypted configuration
- 🔄 **Reliable**: Automatic retries with exponential backoff
- 🎯 **Idempotent**: Safe to retry requests without duplicate charges
- 📱 **Multi-Platform**: Works with any Node.js application
- 🛠️ **CLI Tools**: Command-line interface for setup and testing
- 📚 **Well Documented**: Comprehensive examples and API documentation

## Quick Start

### 1. Installation

```bash
# Install the SDK
npm install transactlab-magic

# Or clone and use locally
git clone <repository-url>
cd transactlab-magic
npm install
```

### 2. Initialize Configuration

```bash
# Interactive setup
npx tl init

# Or skip prompts and use environment variables
npx tl init --skip-prompts
```

### 3. Basic Usage

```javascript
const tl = require('transactlab-magic')();

// Create a one-time payment session
const session = await tl.createSession({
  amount: 300000,        // 300,000 NGN
  currency: 'NGN',
  description: 'Product Purchase',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  metadata: {
    product_id: 'prod_123',
    source: 'website'
  }
});

console.log('Checkout URL:', session.data.checkoutUrl);

// Create a subscription
const subscription = await tl.createSubscription({
  planId: 'plan_monthly_50k',
  customerEmail: 'subscriber@example.com',
  customerName: 'Jane Smith',
  trialDays: 14,
  metadata: {
    tier: 'premium',
    source: 'website'
  }
});

console.log('Subscription URL:', subscription.data.checkoutUrl);
```

### 4. Webhook Handling

```javascript
const express = require('express');
const app = express();

// Handle webhook events
app.post('/webhooks/transactlab', tl.handleWebhook((event) => {
  switch (event.type) {
    case 'session.completed':
      console.log('Payment completed:', event.data.object.id);
      // Update your database, send confirmation email, etc.
      break;
      
    case 'subscription.created':
      console.log('Subscription created:', event.data.object.id);
      // Activate subscription in your system
      break;
      
    case 'payment.failed':
      console.log('Payment failed:', event.data.object.id);
      // Handle payment failure
      break;
      
    default:
      console.log('Unknown event:', event.type);
  }
  
  return { received: true };
}));
```

## Configuration

The SDK can be configured in several ways:

### 1. Environment Variables

```bash
export TL_API_KEY="your_api_key_here"
export TL_WEBHOOK_SECRET="your_webhook_secret_here"
export TL_SUCCESS_URL="https://your-app.com/success"
export TL_CANCEL_URL="https://your-app.com/cancel"
export TL_CALLBACK_URL="https://your-app.com/webhooks/transactlab"
export TL_FRONTEND_URL="https://your-app.com"
export TL_ENVIRONMENT="sandbox"  # or "production"
```

### 2. Configuration File

```json
{
  "apiKey": "your_api_key_here",
  "webhookSecret": "your_webhook_secret_here",
  "urls": {
    "success": "https://your-app.com/success",
    "cancel": "https://your-app.com/cancel",
    "callback": "https://your-app.com/webhooks/transactlab",
    "frontend": "https://your-app.com"
  },
  "environment": "sandbox",
  "baseUrl": "https://transactlab-backend.onrender.com/api/v1"
}
```

### 3. Encrypted Vault

For enhanced security, you can encrypt your configuration:

```bash
npx tl init
# Choose "y" when prompted to encrypt configuration
```

## CLI Commands

### Initialize Configuration

```bash
# Interactive setup
npx tl init

# Skip prompts and use defaults
npx tl init --skip-prompts

# Specify environment
npx tl init --env production
```

### Test Connection

```bash
# Test API connection
npx tl test

# Test specific environment
npx tl test --env production
```

### Diagnose Issues

```bash
# Run diagnostic checks
npx tl diagnose
```

## API Reference

### createSession(options)

Creates a checkout session for one-time payments.

**Parameters:**
- `amount` (number): Amount in major currency units
- `currency` (string): Currency code (e.g., 'NGN', 'USD')
- `description` (string): Payment description
- `customerEmail` (string): Customer email address
- `customerName` (string, optional): Customer name
- `metadata` (object, optional): Custom metadata
- `successUrl` (string, optional): Success redirect URL
- `cancelUrl` (string, optional): Cancel redirect URL

**Returns:** Promise<Object> - Session data with checkout URL

### createSubscription(options)

Creates a subscription for recurring payments.

**Parameters:**
- `planId` (string): Plan ID for the subscription
- `customerEmail` (string): Customer email address
- `customerName` (string, optional): Customer name
- `trialDays` (number, optional): Trial period in days
- `metadata` (object, optional): Custom metadata
- `successUrl` (string, optional): Success redirect URL
- `cancelUrl` (string, optional): Cancel redirect URL
- `chargeNow` (boolean, optional): Charge immediately (default: true)

**Returns:** Promise<Object> - Subscription data with checkout URL

### processPayment(sessionId, paymentData)

Processes payment for a session (Server Bridge).

**Parameters:**
- `sessionId` (string): Session ID to process
- `paymentData` (object): Payment method and billing details

**Returns:** Promise<Object> - Payment result

### handleWebhook(handler)

Creates Express middleware for handling webhook events.

**Parameters:**
- `handler` (function): Webhook event handler function

**Returns:** Function - Express middleware function

## Webhook Events

The SDK handles various webhook events:

- `session.completed` - Payment completed successfully
- `session.cancelled` - Payment was cancelled
- `session.expired` - Session expired
- `subscription.created` - Subscription created
- `subscription.updated` - Subscription updated
- `subscription.cancelled` - Subscription cancelled
- `invoice.paid` - Recurring payment completed
- `invoice.payment_failed` - Recurring payment failed
- `payment.completed` - Payment processed
- `payment.failed` - Payment failed
- `fraud.review_required` - Payment under fraud review
- `fraud.blocked` - Payment blocked by fraud detection

## Error Handling

The SDK provides comprehensive error handling:

```javascript
try {
  const session = await tl.createSession({
    amount: 300000,
    currency: 'NGN',
    description: 'Product Purchase',
    customerEmail: 'customer@example.com'
  });
} catch (error) {
  console.error('Payment failed:', error.message);
  // Handle error appropriately
}
```

## Examples

### Express.js Server

See `examples/node/server.js` for a complete Express.js implementation with:
- One-time payment endpoint
- Subscription payment endpoint
- Payment processing (Server Bridge)
- Webhook handling
- Error handling
- Example usage endpoints

### Frontend Integration

```javascript
// Frontend code
async function createPayment() {
  try {
    const response = await fetch('/api/payment/one-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 300000,
        currency: 'NGN',
        description: 'Product Purchase',
        customerEmail: 'customer@example.com'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to checkout
      window.location.href = data.checkoutUrl;
    } else {
      console.error('Payment creation failed:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

## Security

- **Webhook Verification**: All webhooks are verified using HMAC signatures
- **Encrypted Configuration**: Optional password-protected configuration storage
- **Idempotency**: Safe to retry requests without duplicate charges
- **Environment Isolation**: Separate configurations for sandbox and production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [https://docs.transactlab.com](https://docs.transactlab.com)
- Support: [https://support.transactlab.com](https://support.transactlab.com)
- Issues: [GitHub Issues](https://github.com/transactlab/magic-sdk/issues)
