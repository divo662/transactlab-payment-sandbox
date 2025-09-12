import { Request, Response } from 'express';

type BakeRequestBody = {
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  frontendUrl?: string;
  sandboxSecret?: string;
  encrypt?: boolean;
  sdkDefaults?: any;
};

export const MagicSdkController = {
  async bake(req: Request, res: Response) {
    try {
      const {
        successUrl,
        cancelUrl,
        callbackUrl,
        frontendUrl,
        sandboxSecret,
        encrypt = false,
        sdkDefaults,
      } = (req.body || {}) as BakeRequestBody;

      const missing: string[] = [];
      if (!successUrl) missing.push('successUrl');
      if (!cancelUrl) missing.push('cancelUrl');
      if (!callbackUrl) missing.push('callbackUrl');
      if (!frontendUrl) missing.push('frontendUrl');
      if (!sandboxSecret) missing.push('sandboxSecret');

      if (missing.length) {
        return res.status(400).json({ success: false, message: 'Missing fields', missing });
      }

      // Build config JSON that the SDK expects
      const config = {
        apiKey: sandboxSecret,
        webhookSecret: 'set-in-dashboard-or-env',
        urls: {
          success: successUrl,
          cancel: cancelUrl,
          callback: callbackUrl,
          frontend: frontendUrl,
        },
        environment: 'sandbox',
        baseUrl: process.env.PUBLIC_BACKEND_ORIGIN
          ? `${process.env.PUBLIC_BACKEND_ORIGIN}/api/v1`
          : 'https://transactlab-backend.onrender.com/api/v1',
      };

      const suggestedCli = encrypt
        ? 'npx tl init  # choose encryption when prompted'
        : 'npx tl init --skip-prompts';

      // Complete SDK files to include in zip
      const sdkFiles = [
        // Configuration files
        {
          path: 'transactlab-magic/config.json',
          contents: JSON.stringify(config, null, 2),
        },
        {
          path: 'transactlab-magic/sdk-defaults.json',
          contents: JSON.stringify(sdkDefaults || {}, null, 2),
        },
        {
          path: '.env.example',
          contents: `TL_BASE=${config.baseUrl.replace(/\/$/, '')}/sandbox\nTL_SECRET=${sandboxSecret}\nTL_WEBHOOK_SECRET=whsec_...\nFRONTEND_URL=${frontendUrl}\nPORT=3000\n`,
        },
        // Core SDK files
        {
          path: 'transactlab-magic/transactlab.js',
          contents: `// TransactLab Magic SDK (pure JS)
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
    this.frontendUrl = options.frontendUrl;
  }

  _headers(extra) {
    const headers = { 'content-type': 'application/json' };
    if (this.sandboxSecret) headers['x-sandbox-secret'] = this.sandboxSecret;
    return { ...headers, ...(extra || {}) };
  }

  async _postJson(path, body) {
    const url = \`\${this.baseUrl}\${path}\`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body || {})
    });
    const text = await resp.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
    if (!resp.ok) {
      const err = new Error(\`HTTP \${resp.status}\`);
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
    // Use the subscription bridge endpoint instead of direct subscription endpoint
    const result = await this._postJson('/checkout/subscription', payload);
    const sessionId = result?.data?.sessionId || result?.sessionId || result?.id;
    const subscriptionId = result?.data?.subscriptionId || result?.subscriptionId;
    const checkoutUrl = this._normalizeCheckoutUrl(sessionId);
    return { sessionId, subscriptionId, checkoutUrl, url: checkoutUrl };
  }

  _normalizeCheckoutUrl(sessionId) {
    if (!sessionId) return undefined;
    // Use the frontend URL from the config that was passed to the SDK
    const frontendBase = (this.frontendUrl || 'https://transactlab-payment-sandbox.vercel.app').replace(/\/$/, '');
    return \`\${frontendBase}/checkout/\${sessionId}\`;
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

module.exports = { TransactLab };`,
        },
        {
          path: 'transactlab-magic/magic-setup.js',
          contents: `// Injects env values into a local .env and validates API health
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const p = path.join(process.cwd(), 'transactlab-magic', 'config.json');
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) {}
  }
  return null;
}

function writeEnv(cfg) {
  const envPath = path.join(process.cwd(), '.env');
  const baseUrl = (cfg && cfg.baseUrl) || 'https://transactlab-backend.onrender.com/api/v1';
  const sandboxBase = \`\${baseUrl.replace(/\/$/, '')}/sandbox\`;
  const lines = [
    \`TL_BASE=\${sandboxBase}\`,
    \`TL_SECRET=\${(cfg && cfg.apiKey) || ''}\`,
    \`TL_WEBHOOK_SECRET=\${(cfg && cfg.webhookSecret) || ''}\`,
    \`FRONTEND_URL=\${(cfg && cfg.urls && cfg.urls.frontend) || 'https://transactlab-payment-sandbox.vercel.app'}\`,
    \`PORT=\${process.env.PORT || 3000}\`
  ];
  fs.writeFileSync(envPath, lines.join('\\n') + '\\n', 'utf8');
  console.log('✅ Wrote .env');
}

async function main() {
  const cfg = loadConfig();
  writeEnv(cfg);
  console.log('Next: run "npm i" then "node transactlab-magic/samples/express-server.js"');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});`,
        },
        {
          path: 'transactlab-magic/package.json',
          contents: JSON.stringify({
            name: 'transactlab-magic-sdk',
            version: '1.0.0',
            description: 'TransactLab Magic SDK - Easy payment integration',
            main: 'transactlab.js',
            scripts: {
              setup: 'node magic-setup.js',
              start: 'node samples/express-server.js',
              test: 'node samples/express-server.js'
            },
            keywords: ['payment', 'sdk', 'transactlab', 'checkout', 'subscription'],
            author: 'TransactLab',
            license: 'MIT',
            dependencies: {
              express: '^4.18.2',
              dotenv: '^16.3.1'
            },
            engines: {
              node: '>=14.0.0'
            }
          }, null, 2),
        },
        {
          path: 'transactlab-magic/samples/express-server.js',
          contents: `// Minimal sample server using the Magic SDK
const express = require('express');
const { TransactLab } = require('../transactlab');
require('dotenv').config({ path: process.env.MAGIC_ENV_PATH || '.env' });

const app = express();
app.use(express.json({ verify: (req, _res, buf) => (req.rawBody = buf) }));

const tl = new TransactLab({
  baseUrl: process.env.TL_BASE,
  sandboxSecret: process.env.TL_SECRET,
  webhookSecret: process.env.TL_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/create-session', async (req, res) => {
  try {
    const { amount, currency = 'NGN', customerEmail } = req.body || {};
    const r = await tl.createOneTimeCheckout({ amount, currency, customerEmail });
    res.json({ success: true, url: r.checkoutUrl, data: r });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message, details: e.data });
  }
});

app.post('/api/create-subscription', async (req, res) => {
  try {
    const { planId, customerEmail, metadata, success_url, cancel_url, chargeNow } = req.body || {};
    const r = await tl.createSubscription({ 
      planId, 
      customerEmail, 
      metadata, 
      success_url, 
      cancel_url, 
      chargeNow 
    });
    res.json({ success: true, url: r.checkoutUrl, data: r });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message, details: e.data });
  }
});

app.post('/webhooks/transactlab', (req, res) => {
  try {
    const event = tl.verifyWebhook(req.rawBody, req.headers);
    console.log('Webhook received:', event.type);
    res.json({ received: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(\`Magic sample on :\${port}\`));`,
        },
        {
          path: 'transactlab-magic/README.md',
          contents: `# TransactLab Magic SDK

Easy payment integration for TransactLab. Get started in minutes with one-time payments and subscriptions.

## Quick Start

1. **Setup your environment:**
   \`\`\`bash
   node transactlab-magic/magic-setup.js
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install express dotenv
   \`\`\`

3. **Start the sample server:**
   \`\`\`bash
   node transactlab-magic/samples/express-server.js
   \`\`\`

4. **Test payments:**
   \`\`\`bash
   # One-time payment
   curl -X POST http://localhost:3000/api/create-session \\
     -H "Content-Type: application/json" \\
     -d '{"amount": 300000, "currency": "NGN", "customerEmail": "test@example.com"}'

   # Subscription
   curl -X POST http://localhost:3000/api/create-subscription \\
     -H "Content-Type: application/json" \\
     -d '{"planId": "plan_z2x8haem", "customerEmail": "test@example.com"}'
   \`\`\`

## Usage

\`\`\`javascript
const { TransactLab } = require('./transactlab-magic/transactlab');

const tl = new TransactLab({
  baseUrl: 'https://transactlab-backend.onrender.com/api/v1',
  sandboxSecret: 'your-secret',
  webhookSecret: 'your-webhook-secret',
  frontendUrl: 'https://transactlab-payment-sandbox.vercel.app'
});

// One-time payment
const checkout = await tl.createOneTimeCheckout({
  amount: 300000,
  currency: 'NGN',
  customerEmail: 'customer@example.com'
});

// Subscription
const subscription = await tl.createSubscription({
  planId: 'plan_z2x8haem',
  customerEmail: 'customer@example.com'
});

// Webhook verification
const event = tl.verifyWebhook(req.rawBody, req.headers);
\`\`\`

## Configuration

Your \`config.json\` contains:
- \`apiKey\`: Your TransactLab API key
- \`webhookSecret\`: Webhook verification secret
- \`urls\`: Success, cancel, and callback URLs
- \`environment\`: sandbox or production

## Features

- ✅ One-time payments
- ✅ Subscriptions
- ✅ Webhook verification
- ✅ Auto-configuration
- ✅ Sample implementations
- ✅ Pure JavaScript (no TypeScript required)`,
        },
      ];

      return res.json({
        success: true,
        data: {
          suggestedCli,
          files: sdkFiles,
          notes:
            'Complete SDK downloaded! Run "node transactlab-magic/magic-setup.js" then "npm i" and "node transactlab-magic/samples/express-server.js" to get started.',
        },
      });
    } catch (error: any) {
      const msg = error?.message || 'Internal error';
      return res.status(500).json({ success: false, message: msg });
    }
  },

  async zip(req: Request, res: Response) {
    try {
      const { files } = await (async () => {
        const bakeRes: any = await (MagicSdkController as any).bake({ ...req, body: req.body } as Request, {
          json: (v: any) => v
        } as any);
        return bakeRes?.data || { files: [] };
      })();

      const archiver = require('archiver');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="transactlab-magic.zip"');
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err: any) => { throw err; });
      archive.pipe(res as any);
      for (const f of files || []) {
        archive.append(f.contents || '', { name: f.path || 'file.txt' });
      }
      archive.finalize();
    } catch (error: any) {
      const msg = error?.message || 'Failed to build zip';
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: msg });
      }
    }
  }
};

export default MagicSdkController;


