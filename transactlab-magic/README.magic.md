## TransactLab Magic SDK

Quick start (under 1 minute):

1. Copy your dashboard "Generate SDK Config" JSON into `transactlab-magic/config.json`.
2. Run:
```bash
node transactlab-magic/magic-setup.js
npm i
node transactlab-magic/samples/express-server.js
```
3. Create a session:
```bash
curl -X POST http://localhost:3000/api/create-session \
  -H "content-type: application/json" \
  -d '{"amount":25000, "currency":"NGN", "customerEmail":"test@example.com"}'
```

Files:

- `transactlab-magic/transactlab.js` – Core helper class.
- `transactlab-magic/magic-setup.js` – Writes `.env` from dashboard config.
- `transactlab-magic/samples/express-server.js` – Minimal starter server.

Env expected:

- `TL_BASE`, `TL_SECRET`, `TL_WEBHOOK_SECRET`, `FRONTEND_URL`, `PORT`.


