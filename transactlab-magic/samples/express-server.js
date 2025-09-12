// Minimal sample server using the Magic SDK
const express = require('express');
const { TransactLab } = require('../transactlab');
require('dotenv').config({ path: process.env.MAGIC_ENV_PATH || '.env' });

const app = express();
app.use(express.json({ verify: (req, _res, buf) => (req.rawBody = buf) }));

const tl = new TransactLab({
  baseUrl: process.env.TL_BASE,
  sandboxSecret: process.env.TL_SECRET,
  webhookSecret: process.env.TL_WEBHOOK_SECRET
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
    const { planId, customerEmail } = req.body || {};
    const r = await tl.createSubscription({ planId, customerEmail });
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
app.listen(port, () => console.log(`Magic sample on :${port}`));


