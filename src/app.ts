import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/helpers/logger';
import { SandboxSession, SandboxConfig, SandboxApiKey } from './models';
import SandboxFraudDecision from './models/SandboxFraudDecision';
import { FraudDetectionService } from './services/analytics/fraudDetectionService';
import WebhookService from './services/sandbox/WebhookService';
import SandboxFraudReview from './models/SandboxFraudReview';
import { Types } from 'mongoose';

// Import middleware
import { requestLogger } from './middleware/logging/requestLogger';
import { errorLogger } from './middleware/logging/errorLogger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth/authRoutes';
import passwordRoutes from './routes/auth/passwordRoutes';
import transactionRoutes from './routes/api/v1/transactionRoutes';
import refundRoutes from './routes/api/v1/refundRoutes';
import webhookRoutes from './routes/api/v1/webhookRoutes';
import subscriptionRoutes from './routes/api/v1/subscriptionRoutes';
import magicSdkRoutes from './routes/api/v1/magicSdkRoutes';
import analyticsRoutes from './routes/api/v1/analyticsRoutes';
import merchantRoutes from './routes/merchant/merchantRoutes';
import apiKeyRoutes from './routes/merchant/apiKeyRoutes';
import webhookConfigRoutes from './routes/merchant/webhookConfigRoutes';
import paymentHubRoutes from './routes/payment/paymentHubRoutes';
import sandboxRoutes from './routes/sandbox/sandboxRoutes';
import internalRoutes from './routes/sandbox/internalRoutes';
import analyticsDashboardRoutes from './routes/analytics/analyticsRoutes';
import reportRoutes from './routes/analytics/reportRoutes';
import adminRoutes from './routes/admin/adminRoutes';
import systemRoutes from './routes/admin/systemRoutes';
import checkoutTemplateRoutes from './routes/checkout/checkoutTemplateRoutes';

/**
 * Express Application Setup
 */
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ['https://transactlab-payment-sandbox.vercel.app', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API rate limiting (stricter)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/', apiLimiter);

// Webhook rate limiting (very strict)
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 webhook requests per windowMs
  message: {
    error: 'Too many webhook requests from this IP, please try again later.',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/webhooks/', webhookLimiter);

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
          environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

// API documentation endpoint
app.get('/api/docs', (_req, res) => {
  res.json({
    message: 'TransactLab API Documentation',
    version: 'v1',
    baseUrl: `${_req.protocol}://${_req.get('host')}/api/v1`,
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        logout: 'POST /auth/logout',
        refresh: 'POST /auth/refresh',
        profile: 'GET /auth/profile'
      },
      transactions: {
        initialize: 'POST /transactions/initialize',
        verify: 'GET /transactions/verify/:reference',
        list: 'GET /transactions',
        details: 'GET /transactions/:id'
      },
      refunds: {
        create: 'POST /refunds',
        list: 'GET /refunds',
        details: 'GET /refunds/:id'
      },
      webhooks: {
        events: 'GET /webhooks/events',
        delivery: 'POST /webhooks/delivery'
      },
      subscriptions: {
        create: 'POST /subscriptions',
        list: 'GET /subscriptions',
        details: 'GET /subscriptions/:id'
      }
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/password', passwordRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/magic-sdk', magicSdkRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Merchant dashboard routes
app.use('/api/v1/merchant', merchantRoutes);
app.use('/api/v1/merchant/api-keys', apiKeyRoutes);
app.use('/api/v1/merchant/webhooks', webhookConfigRoutes);

// Payment Hub routes
app.use('/api/v1/payment-hub', paymentHubRoutes);
// Checkout template routes
app.use('/api/v1/checkout', checkoutTemplateRoutes);

// Sandbox routes
app.use('/api/v1/sandbox', sandboxRoutes);
app.use('/api/v1', internalRoutes);

// Public checkout route (workspace-bound, no auth required for customers)
app.get('/checkout/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Find session without user authentication (public access)
    const session = await SandboxSession.findOne({ sessionId, status: { $ne: 'expired' } });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: 'Checkout session not found or expired'
      });
    }

    // Check if session is expired
    if (session.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Session expired',
        message: 'This checkout session has expired'
      });
    }

    // Return JSON only; frontend handles UI and bridge processing
    const checkoutUrl = `${req.protocol}://${req.get('host')}/checkout/${sessionId}`;
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        checkoutUrl,
        amount: session.getFormattedAmount(),
        currency: session.currency,
        description: session.description,
        customerEmail: session.customerEmail,
        customerName: session.customerName,
        successUrl: session.successUrl,
        cancelUrl: session.cancelUrl,
        status: session.status,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    logger.error('Error accessing checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to access checkout session'
    });
  }
});

// Frontend bridge: process payment securely from React (no secrets in browser)
app.post('/api/v1/checkout/process/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Resolve workspace owner from session to scope the secret
    const session = await SandboxSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Pre-processing fraud/risk check (sandbox)
    try {
      const riskAnalysis = await FraudDetectionService.analyzeTransaction({
        transactionId: session.sessionId,
        amount: session.amount, // minor units
        currency: session.currency,
        description: session.description,
        customerEmail: session.customerEmail,
        merchantId: (() => { try { return new Types.ObjectId((session as any).userId); } catch { return new Types.ObjectId(); } })(),
        createdAt: new Date(),
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
        isNewCustomer: false
      });

      // Persist decision for observability
      try {
        await SandboxFraudDecision.create({
          sessionId: session.sessionId,
          userId: (session as any).userId,
          amountMinor: session.amount,
          currency: session.currency,
          action: riskAnalysis.action,
          riskScore: riskAnalysis.riskScore.score,
          riskLevel: riskAnalysis.riskScore.level,
          factors: riskAnalysis.riskScore.factors,
          recommendations: riskAnalysis.riskScore.recommendations
        });
      } catch (persistErr) {
        logger.warn('Failed to persist fraud decision', persistErr);
      }

      // Emit fraud webhooks by action and create review item if needed
      try {
        const webhookService = new WebhookService();
        const eventBase = 'fraud';
        const payload = {
          sessionId: session.sessionId,
          userId: (session as any).userId?.toString?.() || (session as any).userId,
          action: riskAnalysis.action,
          risk: riskAnalysis.riskScore,
          timestamp: new Date().toISOString()
        };
        if (riskAnalysis.action === 'review') {
          try {
            await SandboxFraudReview.create({
              sessionId: session.sessionId,
              userId: (session as any).userId?.toString?.() || (session as any).userId,
              riskScore: riskAnalysis.riskScore.score,
              riskLevel: riskAnalysis.riskScore.level,
              factors: riskAnalysis.riskScore.factors,
              status: 'pending'
            });
          } catch (revErr) {
            logger.warn('Failed to create fraud review item', revErr);
          }
        }
        if (riskAnalysis.action === 'block') {
          await webhookService.sendWebhooks((session as any).userId, `${eventBase}.blocked`, payload);
        } else if (riskAnalysis.action === 'review') {
          await webhookService.sendWebhooks((session as any).userId, `${eventBase}.review_required`, payload);
        } else if (riskAnalysis.action === 'flag') {
          await webhookService.sendWebhooks((session as any).userId, `${eventBase}.flagged`, payload);
        } else {
          await webhookService.sendWebhooks((session as any).userId, `${eventBase}.cleared`, payload);
        }
      } catch (whErr) {
        logger.warn('Failed to emit fraud webhook', whErr);
      }

      if (riskAnalysis.action === 'block') {
        return res.status(403).json({ success: false, error: 'blocked_by_fraud', risk: riskAnalysis });
      }
      if (riskAnalysis.action === 'review') {
        return res.status(202).json({ success: false, error: 'review_required', risk: riskAnalysis });
      }
      // For 'flag' or 'allow', continue; attach risk for observability
      (req as any).riskAnalysis = riskAnalysis;
    } catch (e) {
      logger.warn('Fraud analysis failed, proceeding in sandbox:', e);
    }

    // Try to resolve sandbox secret from DB (SandboxConfig or SandboxApiKey)
    let sandboxSecret: string | undefined;
    const cfg = await SandboxConfig.findOne({ userId: session.userId });
    if (cfg?.testSecretKey) sandboxSecret = cfg.testSecretKey as any;
    if (!sandboxSecret) {
      const key = await SandboxApiKey.findOne({ userId: session.userId, isActive: true });
      if (key?.secretKey) sandboxSecret = (key as any).secretKey;
    }
    if (!sandboxSecret) {
      return res.status(500).json({ success: false, message: 'Sandbox secret not configured' });
    }

    // Call provider process endpoint directly with secret
    const providerBase = `${req.protocol}://${req.get('host')}/api/v1/sandbox`;
    const resp = await fetch(`${providerBase}/sessions/${sessionId}/process-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sandbox-secret': sandboxSecret },
      body: JSON.stringify({})
    });
    const text = await resp.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* keep raw */ }
    return res.status(resp.status).json(json || {});
  } catch (error) {
    logger.error('Bridge process error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Analytics dashboard routes
app.use('/api/analytics', analyticsDashboardRoutes);
app.use('/api/reports', reportRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/system', systemRoutes);

// Serve static files
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Webhook testing page
app.get('/webhooks/test', (_req, res) => {
  res.sendFile('public/webhooks/test.html', { root: '.' });
});

// API documentation page
app.get('/docs', (_req, res) => {
  res.sendFile('public/docs/api.html', { root: '.' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TransactLab API',
    description: 'Complete payment gateway simulation for testing and development',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/docs`,
    health: `${req.protocol}://${req.get('host')}/health`,
    apiDocs: `${req.protocol}://${req.get('host')}/api/docs`
  });
});

// Handle password reset links from email (redirect to frontend)
app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  const frontendUrl = process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app';
  const redirectUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
  
  res.redirect(redirectUrl);
});

// Handle email verification links from email (redirect to frontend)
app.get('/verify-email', (req, res) => {
  const token = req.query.token;
  const frontendUrl = process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app';
  const redirectUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
  
  res.redirect(redirectUrl);
});

// 404 handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app; 