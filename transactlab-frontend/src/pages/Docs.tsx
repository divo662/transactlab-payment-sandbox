import React from "react";
import { Separator } from "@/components/ui/separator";

const Docs: React.FC = () => {
  return (
    <div className="space-y-10 animate-enter">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#0a164d]">TransactLab Documentation</h1>
        <p className="text-muted-foreground">A sandbox for building and testing payments—no real money moves.</p>
      </header>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-gray-700 leading-relaxed">
          TransactLab mirrors a modern payments platform: create checkout sessions, charge test cards, manage subscriptions, process refunds,
          and receive webhooks. Everything is fully functional in the sandbox, but all transactions are simulated.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>One‑time and recurring payments</li>
          <li>Customers, products, plans, and subscriptions</li>
          <li>Events and webhooks for real-time workflows</li>
          <li>Dashboard to inspect sessions, transactions, and logs</li>
        </ul>
      </section>

      <Separator />

      {/* Developer Guide for External Apps (Dover) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Developer Guide (External App Quickstart)</h2>
        <p className="text-gray-700 text-sm">
          This guide shows how to integrate TransactLab Sandbox from another project with the least friction. You can authenticate using either a user JWT or a sandbox secret key (Stripe‑style).
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">.env for your server</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`# Option A: Use sandbox secret (preferred Stripe-like)
TL_BASE=https://transactlab-backend.onrender.com/api/v1/sandbox
TL_SECRET=sk_test_secret_...

# Option B: Use user JWT (Bearer)
# TL_TOKEN=Bearer eyJhbGciOi...
`}
            </pre>
            <p className="text-xs text-gray-600">If you provide TL_SECRET, send it as <code>x-sandbox-secret</code> header. If you provide TL_TOKEN, send it as <code>Authorization: Bearer ...</code>.</p>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Server route (create session)</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`import express from 'express';
import fetch from 'node-fetch';
const app = express();
app.use(express.json());

const TL_BASE = process.env.TL_BASE || 'https://transactlab-backend.onrender.com/api/v1/sandbox';

app.post('/api/create-session', async (req, res) => {
  const headers: any = { 'Content-Type': 'application/json' };
  if (process.env.TL_SECRET) headers['x-sandbox-secret'] = process.env.TL_SECRET;
  if (process.env.TL_TOKEN) headers['Authorization'] = process.env.TL_TOKEN;

  const r = await fetch(TL_BASE + '/sessions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: req.body.amount,
      currency: req.body.currency || 'NGN',
      description: req.body.description || 'Test Order',
      customerEmail: req.body.customerEmail,
      metadata: req.body.metadata
    })
  });
  const json = await r.json();
  return res.status(r.status).json(json);
});

app.listen(3001);
`}
            </pre>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Client redirect</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`const res = await fetch('https://transactlab-payment-sandbox.vercel.app/api/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    amount: 500, 
    currency: 'NGN', 
    description: 'Pro', 
    customerEmail: 'dev@example.com',
    success_url: 'https://transactlab-payment-sandbox.vercel.app/?payment=success',
    cancel_url: 'https://transactlab-payment-sandbox.vercel.app/?payment=cancelled'
  })
  // Or use amount_minor: 50000
});
const json = await res.json();
if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed');
window.location.href = 'https://transactlab-payment-sandbox.vercel.app/checkout/' + json.data.sessionId;
`}
            </pre>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Webhook endpoint</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`app.post('/webhooks/transactlab', express.raw({ type: 'application/json' }), (req, res) => {
  const evt = JSON.parse(req.body);
  // Verify TL-Signature if configured
  if (evt.type === 'payment.completed') { /* mark order paid */ }
  res.json({ received: true });
});
`}
            </pre>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <p className="font-medium text-[#0a164d] mb-2">Supported events</p>
          <p className="text-xs text-gray-700">payment.completed, payment.failed, payment.cancelled, payment.refunded, customer.created, customer.updated, subscription.created, subscription.updated, subscription.cancelled, invoice.created, invoice.paid, webhook.test</p>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <p className="font-medium text-[#0a164d] mb-2">Troubleshooting</p>
          <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
            <li>404 on /api/create-session: your app doesn’t expose that route — add the proxy server code above or call TL directly from your backend.</li>
            <li>401 Unauthorized: provide either Authorization: Bearer &lt;JWT&gt; or x-sandbox-secret: &lt;secret&gt;.</li>
            <li>Enum validation on webhooks: use only the supported events listed above.</li>
          </ul>
        </div>
      </section>

      <Separator />

      {/* Setup in Your Product */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Set Up in Your Product</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to Sandbox → API Keys and create a secret key (server) and publishable key (client).</li>
          <li>Create a Checkout Session using your server with the secret key.</li>
          <li>Redirect your user to the session URL or open it in an iframe.</li>
          <li>Handle webhook events in your backend to update order status.</li>
        </ol>
        <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded p-3">
          <strong>Base URL</strong>: <code>https://transactlab-backend.onrender.com/api/v1/sandbox</code>
          <span className="ml-2">·</span>
          <strong className="ml-2">Auth</strong>: <code>Authorization: Bearer &lt;JWT&gt;</code>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Create session (server)</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`POST https://transactlab-backend.onrender.com/api/v1/sandbox/sessions
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "amount": 500,              // major units by default (e.g., NGN 500)
  // or provide explicit minor units:
  // "amount_minor": 50000,   // e.g., 500 * 100
  "currency": "NGN",
  "description": "Starter Plan",
  "customerEmail": "claire@example.com",
  "success_url": "https://yourapp.example.com/checkout/success",
  "cancel_url": "https://yourapp.example.com/checkout/cancel",
  "metadata": { "source": "external-demo" }
}`}
            </pre>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Redirect user (client)</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`// After creating the session on your server
const sessionId = json.data.sessionId;
window.location.href = 
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  `}
            </pre>
          </div>
        </div>
      </section>

      <Separator />

      {/* End-to-End Integration (Copy/Paste) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">End‑to‑End Integration (Copy/Paste)</h2>
        <p className="text-gray-700 text-sm">Use this small proxy on your app’s backend to call TransactLab securely, then redirect your users to the TransactLab checkout.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Node/Express proxy (server)</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const TL_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';
const TL_TOKEN = process.env.TL_TOKEN; // 'Bearer <JWT>'

app.post('/api/create-session', async (req, res) => {
  try {
    const r = await fetch(
      TL_BASE + '/sessions',
      {
        method: 'POST',
        headers: { 'Authorization': TL_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: req.body.amount,
          currency: req.body.currency || 'NGN',
          description: req.body.description || 'Test Order',
          customerEmail: req.body.customerEmail
        })
      }
    );
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Upstream error', error: String(e) });
  }
});

app.listen(3001, () => console.log('Proxy listening on :3001'));
`}
            </pre>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="font-medium text-[#0a164d] mb-2">Client usage</p>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`const res = await fetch('https://transactlab-payment-sandbox.vercel.app/api/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 500,           // major units
    // amount_minor: 50000, // optional minor units
    currency: 'NGN',
    description: 'Starter Plan',
    customerEmail: 'claire@example.com',
    success_url: 'https://transactlab-payment-sandbox.vercel.app/?payment=success',
    cancel_url: 'https://transactlab-payment-sandbox.vercel.app/?payment=cancelled'
  })
});
const json = await res.json();
if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed');
window.location.href = 'https://transactlab-payment-sandbox.vercel.app/checkout/' + json.data.sessionId;
`}
            </pre>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <p className="font-medium text-[#0a164d] mb-2">Webhook handler (server)</p>
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`app.post('/webhooks/transactlab', express.raw({ type: 'application/json' }), (req, res) => {
  // Verify TL-Signature header if needed, then parse and process
  const evt = JSON.parse(req.body);
  if (evt.type === 'payment.completed') {
    // mark order paid
  }
  res.json({ received: true });
});`}
          </pre>
        </div>
      </section>

      <Separator />

      {/* API Routes Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">API Routes Overview</h2>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>POST /sessions · GET /sessions/:sessionId · GET /sessions</li>
          <li>POST /sessions/:sessionId/process-payment</li>
          <li>POST /customers · GET /customers · PUT /customers/:customerId · DELETE /customers/:customerId</li>
          <li>POST /webhooks · GET /webhooks · POST /webhooks/:webhookId/test</li>
          <li>POST /products · GET /products · POST /plans · GET /plans</li>
          <li>POST /subscriptions · GET /subscriptions</li>
        </ul>
      </section>

      <Separator />

      {/* Billing & Customer Fields */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Billing & Customer Fields</h2>
        <p className="text-gray-700 text-sm">Checkout accepts and forwards these fields to the backend:</p>
        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`{
  customer: { email, name, phone },
  billingAddress: { line1, line2, city, state, postalCode, country, phone }
}`}
        </pre>
      </section>

      <Separator />

      {/* Feature Guides */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Feature Guides</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">API Keys</h3>
          <p className="text-gray-700 text-sm">Generate keys in Sandbox → API Keys. Use publishable keys on the client and secret keys on the server only.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Checkout Sessions</h3>
          <p className="text-gray-700 text-sm">Start a payment flow with amount, currency, items, success/cancel URLs, and an optional customer.</p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>Status: created → pending → completed/failed/canceled</li>
            <li>Events: session.created, session.completed, session.canceled</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Subscriptions</h3>
          <p className="text-gray-700 text-sm">Create plans (e.g., monthly) and subscribe customers. Supports trials, renewals, and cancellations.</p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>Events: invoice.created, invoice.paid, customer.subscription.updated</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Products</h3>
          <p className="text-gray-700 text-sm">Define items to sell (one‑time or recurring). Attach prices and metadata for your catalog.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Customers</h3>
          <p className="text-gray-700 text-sm">Store emails, default payment method, and preferences to streamline repeat checkouts.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Transactions & Refunds</h3>
          <p className="text-gray-700 text-sm">All payments create transactions. You can issue full or partial refunds and simulate failures.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#0a164d]">Webhooks</h3>
          <p className="text-gray-700 text-sm">Configure an endpoint in Sandbox → Webhooks. Verify signatures and process events idempotently.</p>
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
{`POST https://yourapp.example.com/webhooks/transactlab
Headers: TL-Signature: t=..., s=...
Body: {
  "type": "session.completed",
  "data": { /* event payload */ }
}`}
          </pre>
        </div>
      </section>

      <Separator />

      {/* Testing Data */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Testing Data</h2>
        <p className="text-gray-700 text-sm">Use these cards to simulate outcomes in the sandbox:</p>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>Success: 4242 4242 4242 4242 • Any future expiry • Any CVC</li>
          <li>Insufficient funds: 4000 0000 0000 9995</li>
          <li>3‑D Secure required: 4000 0027 6000 3184</li>
        </ul>
      </section>

      <Separator />

      {/* Error Handling & Rate Limits */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Error Handling & Rate Limits</h2>
        <p className="text-gray-700 text-sm">All API errors include a clear message. Respect documented rate limits in responses (Retry-After). Implement exponential backoff for retries.</p>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium">Does the sandbox ever charge real cards?</p>
          <p>No. All charges are simulated and do not move funds.</p>
          <p className="font-medium">Can I migrate from sandbox to production?</p>
          <p>Yes. Replace sandbox keys with production keys and endpoints when available.</p>
          <p className="font-medium">How do I verify webhook signatures?</p>
          <p>Use the signing secret shown in Sandbox → Webhooks. Compute an HMAC over the payload and compare.</p>
        </div>
      </section>
    </div>
  );
};

export default Docs;


