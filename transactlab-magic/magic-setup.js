// Injects env values into a local .env and validates API health
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
  const sandboxBase = `${baseUrl.replace(/\/$/, '')}/sandbox`;
  const lines = [
    `TL_BASE=${sandboxBase}`,
    `TL_SECRET=${(cfg && cfg.apiKey) || ''}`,
    `TL_WEBHOOK_SECRET=${(cfg && cfg.webhookSecret) || ''}`,
    `FRONTEND_URL=${(cfg && cfg.urls && cfg.urls.frontend) || 'http://localhost:3000'}`,
    `PORT=${process.env.PORT || 3000}`
  ];
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
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
});


