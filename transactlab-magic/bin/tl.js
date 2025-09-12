#!/usr/bin/env node

/**
 * TransactLab Magic SDK CLI
 * 
 * This is the command-line interface for the TransactLab Magic SDK.
 * It provides commands for initialization, testing, and configuration management.
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ConfigLoader = require('../src/config');

// CLI version
const version = require('../package.json').version;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to prompt for password (hidden input)
function promptPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', (char) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeAllListeners('data');
          console.log('');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

program
  .name('tl')
  .description('TransactLab Magic SDK CLI')
  .version(version);

// Initialize command
program
  .command('init')
  .description('Initialize TransactLab Magic SDK in your project')
  .option('-p, --path <path>', 'Project path to initialize', process.cwd())
  .option('-e, --env <environment>', 'Environment (sandbox|production)', 'sandbox')
  .option('--skip-prompts', 'Skip interactive prompts and use defaults')
  .action(async (options) => {
    try {
      console.log('🚀 Initializing TransactLab Magic SDK...');
      console.log(`📁 Project path: ${options.path}`);
      console.log(`🌍 Environment: ${options.env}`);
      
      const configPath = path.join(options.path, 'transactlab-magic');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
      }
      
      let config = {};
      
      if (!options.skipPrompts) {
        console.log('\n📝 Let\'s configure your TransactLab integration:');
        
        // Get API key
        const apiKey = await prompt('🔑 Enter your TransactLab API key: ');
        if (!apiKey) {
          console.error('❌ API key is required');
          process.exit(1);
        }
        
        // Get webhook secret
        const webhookSecret = await prompt('🔐 Enter your webhook secret: ');
        if (!webhookSecret) {
          console.error('❌ Webhook secret is required');
          process.exit(1);
        }
        
        // Get URLs
        const successUrl = await prompt('✅ Success URL (where users go after payment): ');
        const cancelUrl = await prompt('❌ Cancel URL (where users go if they cancel): ');
        const callbackUrl = await prompt('🔔 Callback URL (for webhooks): ');
        const frontendUrl = await prompt('🌐 Frontend URL (your app\'s base URL): ');
        
        config = {
          apiKey,
          webhookSecret,
          urls: {
            success: successUrl,
            cancel: cancelUrl,
            callback: callbackUrl,
            frontend: frontendUrl
          },
          environment: options.env,
          baseUrl: options.env === 'production' 
            ? 'https://api.transactlab.com/api/v1'
            : 'https://transactlab-backend.onrender.com/api/v1'
        };
      } else {
        // Use environment variables or defaults
        config = {
          apiKey: process.env.TL_API_KEY || 'your_api_key_here',
          webhookSecret: process.env.TL_WEBHOOK_SECRET || 'your_webhook_secret_here',
          urls: {
            success: process.env.TL_SUCCESS_URL || 'https://your-app.com/success',
            cancel: process.env.TL_CANCEL_URL || 'https://your-app.com/cancel',
            callback: process.env.TL_CALLBACK_URL || 'https://your-app.com/webhooks/transactlab',
            frontend: process.env.TL_FRONTEND_URL || 'https://your-app.com'
          },
          environment: options.env,
          baseUrl: options.env === 'production' 
            ? 'https://api.transactlab.com/api/v1'
            : 'https://transactlab-backend.onrender.com/api/v1'
        };
      }
      
      // Ask if user wants to encrypt the config
      const encryptConfig = options.skipPrompts ? false : 
        (await prompt('🔒 Encrypt configuration with password? (y/N): ')).toLowerCase() === 'y';
      
      if (encryptConfig) {
        const password = await promptPassword('🔐 Enter password for encryption: ');
        const configLoader = new ConfigLoader();
        configLoader.saveToVault(config, password);
        console.log('✅ Configuration encrypted and saved to .vault');
      } else {
        // Save as plain JSON
        const configFile = path.join(configPath, 'config.json');
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        console.log('✅ Configuration saved to config.json');
      }
      
      // Create example files
      const exampleServer = `const express = require('express');
const cors = require('cors');
const tl = require('./src/transactlab')();

const app = express();
app.use(cors());
app.use(express.json());

// One-time payment
app.post('/api/payment', async (req, res) => {
  try {
    const session = await tl.createSession({
      amount: 300000,
      currency: 'NGN',
      description: 'Product Purchase',
      customerEmail: req.body.email
    });
    res.json({ checkoutUrl: session.data.checkoutUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post('/webhooks/transactlab', tl.handleWebhook((event) => {
  console.log('Received event:', event.type);
  // Handle the event
  return { received: true };
}));

app.listen(3000, () => console.log('Server running on port 3000'));`;

      fs.writeFileSync(path.join(configPath, 'example-server.js'), exampleServer);
      
      console.log('\n✅ Initialization complete!');
      console.log('📝 Next steps:');
      console.log('   1. Review your configuration');
      console.log('   2. Run "tl test" to verify connection');
      console.log('   3. Check example-server.js for usage examples');
      console.log('   4. Start building with the SDK!');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

// Bake command (fetch config from dashboard)
program
  .command('bake')
  .description('Fetch and bake configuration from TransactLab dashboard')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--api-base <url>', 'Backend API base URL', process.env.TL_BACKEND_API || 'https://transactlab-backend.onrender.com/api/v1')
  .option('--encrypt', 'Encrypt vault instead of plain config.json', false)
  .requiredOption('--success <url>', 'Success URL')
  .requiredOption('--cancel <url>', 'Cancel URL')
  .requiredOption('--callback <url>', 'Callback URL (webhooks)')
  .requiredOption('--frontend <url>', 'Frontend base URL')
  .requiredOption('--secret <key>', 'Sandbox secret (x-sandbox-secret)')
  .action(async (options) => {
    try {
      console.log('🍰 Baking configuration from TransactLab dashboard...');
      const fetch = (await import('node-fetch')).default;
      const endpoint = `${options.api_base}/magic-sdk/bake`;
      const body = {
        successUrl: options.success,
        cancelUrl: options.cancel,
        callbackUrl: options.callback,
        frontendUrl: options.frontend,
        sandboxSecret: options.secret,
        encrypt: !!options.encrypt,
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || `HTTP ${resp.status}`);
      }

      const outDir = path.join(options.path, 'transactlab-magic');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const data = json.data || {};
      const files = Array.isArray(data.files) ? data.files : [];
      for (const f of files) {
        const target = path.isAbsolute(f.path) ? f.path : path.join(options.path, f.path);
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, f.contents ?? '', 'utf8');
        console.log(`📄 wrote ${path.relative(options.path, target)}`);
      }

      if (data.suggestedCli) {
        console.log(`\nℹ️  Suggested next step: ${data.suggestedCli}`);
      }
      console.log('✅ Bake complete');
      
    } catch (error) {
      console.error('❌ Bake failed:', error.message);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test connection to TransactLab API')
  .option('-e, --env <environment>', 'Environment to test', 'sandbox')
  .action(async (options) => {
    try {
      console.log('🧪 Testing TransactLab API connection...');
      console.log(`🌍 Environment: ${options.env}`);
      
      // Load configuration
      const configLoader = new ConfigLoader();
      const config = configLoader.load();
      
      // Test API connection
      const HttpClient = require('../src/http-client');
      const httpClient = new HttpClient(config);
      
      // Try to make a test request
      try {
        await httpClient.get(`${config.baseUrl}/health`);
        console.log('✅ API connection successful!');
      } catch (error) {
        console.log('⚠️  API health check failed, but that\'s okay for testing');
      }
      
      // Test session creation
      const tl = require('../src/transactlab')();
      try {
        const session = await tl.createSession({
          amount: 1000,
          currency: 'NGN',
          description: 'Test Payment',
          customerEmail: 'test@example.com'
        });
        console.log('✅ Session creation test passed!');
        console.log(`   Session ID: ${session.data?.sessionId || 'N/A'}`);
      } catch (error) {
        console.log('❌ Session creation test failed:', error.message);
      }
      
      console.log('🎉 Testing complete!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  });

// Diagnose command
program
  .command('diagnose')
  .description('Diagnose common issues with your setup')
  .action(async () => {
    try {
      console.log('🔍 Diagnosing your TransactLab setup...');
      
      const issues = [];
      const warnings = [];
      
      // Check if config exists
      const configPath = path.join(process.cwd(), 'transactlab-magic');
      if (!fs.existsSync(configPath)) {
        issues.push('TransactLab Magic directory not found. Run "tl init" first.');
      } else {
        // Check for config files
        const configFile = path.join(configPath, 'config.json');
        const vaultFile = path.join(configPath, '.vault');
        
        if (!fs.existsSync(configFile) && !fs.existsSync(vaultFile)) {
          issues.push('No configuration found. Run "tl init" to configure.');
        } else {
          // Try to load config
          try {
            const configLoader = new ConfigLoader();
            const config = configLoader.load();
            
            // Check required fields
            if (!config.apiKey || config.apiKey === 'your_api_key_here') {
              issues.push('API key not configured or using default value');
            }
            
            if (!config.webhookSecret || config.webhookSecret === 'your_webhook_secret_here') {
              issues.push('Webhook secret not configured or using default value');
            }
            
            if (!config.urls.success || config.urls.success === 'https://your-app.com/success') {
              warnings.push('Success URL is using default value');
            }
            
            if (!config.urls.cancel || config.urls.cancel === 'https://your-app.com/cancel') {
              warnings.push('Cancel URL is using default value');
            }
            
            if (!config.urls.callback || config.urls.callback === 'https://your-app.com/webhooks/transactlab') {
              warnings.push('Callback URL is using default value');
            }
            
          } catch (error) {
            issues.push(`Configuration error: ${error.message}`);
          }
        }
      }
      
      // Check environment variables
      const requiredEnvVars = ['TL_API_KEY', 'TL_WEBHOOK_SECRET'];
      const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
      
      if (missingEnvVars.length > 0) {
        warnings.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      }
      
      // Report results
      if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ All checks passed!');
        console.log('🎉 Your setup looks good!');
      } else {
        if (issues.length > 0) {
          console.log('\n❌ Issues found:');
          issues.forEach(issue => console.log(`   • ${issue}`));
        }
        
        if (warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        console.log('\n💡 Run "tl init" to fix configuration issues');
      }
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error.message);
      process.exit(1);
    }
  });

// Rotate keys command
program
  .command('rotate-keys')
  .description('Rotate an API key or extend expiry')
  .requiredOption('--api-base <url>', 'Backend API base URL')
  .requiredOption('--id <id>', 'API key ID')
  .option('--extend <iso>', 'New ISO expiry (e.g., 2025-12-31T23:59:59.000Z)')
  .option('--name <name>', 'Update key name')
  .option('--description <desc>', 'Update description')
  .action(async (opts) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const url = `${opts.apiBase}/merchant/api-keys/${opts.id}`;
      const body = {};
      if (opts.extend) body.expiresAt = opts.extend;
      if (opts.name) body.name = opts.name;
      if (opts.description) body.description = opts.description;
      const resp = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TL_DASH_TOKEN||''}` }, body: JSON.stringify(body) });
      const json = await resp.json();
      if (!resp.ok || !json?.success) throw new Error(json?.message || `HTTP ${resp.status}`);
      console.log('✅ Key updated');
      console.log(JSON.stringify(json.data || json, null, 2));
    } catch (e) {
      console.error('❌ rotate-keys failed:', e.message);
      process.exit(1);
    }
  });

// Replay webhook command
program
  .command('webhooks:replay')
  .description('Replay a failed webhook by ID')
  .requiredOption('--api-base <url>', 'Backend API base URL')
  .requiredOption('--id <id>', 'Webhook delivery ID')
  .action(async (opts) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const url = `${opts.apiBase}/webhooks/${opts.id}/retry`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TL_SANDBOX_SECRET || '' } });
      const json = await resp.json();
      if (!resp.ok || !json?.success) throw new Error(json?.message || `HTTP ${resp.status}`);
      console.log('✅ Webhook replayed');
      console.log(JSON.stringify(json.data || json, null, 2));
    } catch (e) {
      console.error('❌ webhooks:replay failed:', e.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();