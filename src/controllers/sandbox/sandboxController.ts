import { Request, Response } from 'express';
import { refreshRatesIfNeeded, convertAmount } from '../../services/fxRates';
import crypto from 'crypto';
import { User, SandboxApiKey, SandboxSession, SandboxWebhook, SandboxTransaction, SandboxSubscription, SandboxCustomer, SandboxConfig, SandboxProduct, SandboxPlan, SandboxRefund } from '../../models';
import { ISandboxApiKey, ISandboxSession, ISandboxWebhook, ISandboxTransaction, ISandboxSubscription, ISandboxCustomer, ISandboxConfig, ISandboxProduct, ISandboxPlan, ISandboxRefund } from '../../models';
import SandboxInvoice, { ISandboxInvoice } from '../../models/SandboxInvoice';
import SandboxPaymentMethod, { ISandboxPaymentMethod } from '../../models/SandboxPaymentMethod';
import { logger } from '../../utils/helpers/logger';
import EmailService from '../../services/notification/emailService';
import SandboxTeam from '../../models/SandboxTeam';
import { CloudinaryService } from '../../services/cloudinaryService';
import { LocalUploadService } from '../../services/localUploadService';
import { CacheService } from '../../services/cache/cacheService';
import { CacheInvalidationService } from '../../services/cache/cacheInvalidationService';

// Helper function to send sandbox webhooks
async function sendSandboxWebhook(transactionId: string, status: string, userId: string) {
  try {
    logger.info(`Webhook would be sent for transaction ${transactionId} with status ${status} to user ${userId}`);
    
    await SandboxTransaction.findOneAndUpdate(
      { transactionId },
      { 
        webhookDelivered: true,
        webhookAttempts: 1,
        lastWebhookAttempt: new Date()
      }
    );
  } catch (error) {
    logger.error(`Error sending sandbox webhook for transaction ${transactionId}:`, error);
  }
}

export class SandboxController {
  // Simple in-process scheduler flag
  private static schedulerStarted = false;

  // Build absolute checkout URL from a relative path using env or request host
  private static buildAbsoluteCheckoutUrl(req: Request, relativePath: string): string {
    try {
      const base = process.env.TL_CHECKOUT_BASE || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const normalizedBase = base.replace(/\/$/, '');
      const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      return `${normalizedBase}${path}`;
    } catch {
      return relativePath;
    }
  }

  /**
   * Resolve checkout URL by session ID (workspace-safe)
   */
  static async getCheckoutUrl(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          cause: 'INVALID_TOKEN: missing'
        });
      }

      const { sessionId } = req.params as { sessionId: string };
      
      // First check if session exists at all
      const sessionExists = await SandboxSession.findOne({ sessionId });
      if (!sessionExists) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Session not found'
        });
      }

      // Check if session belongs to requesting user
      const session = await (SandboxSession.findOne({ sessionId, userId: userId.toString() }) as Promise<ISandboxSession | null>);
      if (!session) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Session belongs to different workspace',
          cause: 'WORKSPACE_MISMATCH',
          createdWorkspaceId: sessionExists.userId,
          checkoutWorkspaceId: userId.toString()
        });
      }

      const url = SandboxController.buildAbsoluteCheckoutUrl(req, session.getCheckoutUrl());
      return res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl: url
        }
      });
    } catch (error) {
      logger.error('Error resolving checkout URL:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to resolve checkout URL'
      });
    }
  }

  static ensureRenewalScheduler() {
    if (SandboxController.schedulerStarted) return;
    SandboxController.schedulerStarted = true;
    // Run every 60s in dev to simulate renewals/reminders
    setInterval(async () => {
      try {
        await SandboxController.processSubscriptionReminders();
        await SandboxController.processSubscriptionRenewals();
      } catch (e) {
        logger.error('Sandbox scheduler error:', e);
      }
    }, 60 * 1000);
    logger.info('Sandbox renewal scheduler started');
  }
  /**
   * Get sandbox data for a specific user
   */
  static async getSandboxData(req: Request, res: Response) {
    try {
      // Ensure scheduler is running while the app is used
      SandboxController.ensureRenewalScheduler();
      // Use scoped user ID from applyWorkspaceScope middleware
      const userId = req.user?._id;
      logger.info('getSandboxData scope', { effectiveUserId: userId?.toString?.() });
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
      }

       let sandboxConfig = await SandboxConfig.findOne({ userId: userId.toString() });
       
       if (!sandboxConfig) {
         const timestamp = Date.now();
         const userHash = userId.toString().slice(-8);
         
         sandboxConfig = new SandboxConfig({
           userId: userId.toString(),
           testApiKey: `tk_test_${userHash}_${timestamp}`,
           testSecretKey: `tk_test_secret_${userHash}_${timestamp}`,
           testWebhookUrl: `https://webhook.site/${userHash}-${timestamp}`,
           webhookEndpoint: '',
           webhookSecret: `whsec_${userHash}_${timestamp}`,
           sandboxMode: true
         });
         
         await sandboxConfig.save();
         logger.info(`Created new sandbox configuration for user: ${userId}`);
       }
       
       const transactions = await SandboxTransaction.find({ userId: userId.toString() })
         .sort({ createdAt: -1 })
         .limit(5);
       
       const customers = await SandboxCustomer.find({ userId: userId.toString() })
         .sort({ totalSpent: -1 })
         .limit(5);
       
       if (customers.length === 0) {
         const userHash = userId.toString().slice(-8);
         const defaultCustomer1 = new SandboxCustomer({
           customerId: `cust_sandbox_${userHash}_001`,
           userId: userId.toString(),
           merchantId: userId.toString(),
           email: `customer_${userHash}@sandbox.com`,
           name: 'John Doe',
           totalTransactions: 0,
           totalSpent: 0,
           currency: 'NGN',
           transactionsByCurrency: [
             { currency: 'NGN', count: 0, total: 0 },
             { currency: 'USD', count: 0, total: 0 },
             { currency: 'EUR', count: 0, total: 0 }
           ],
           isSandbox: true
         });
         
         const defaultCustomer2 = new SandboxCustomer({
           customerId: `cust_sandbox_${userHash}_002`,
           userId: userId.toString(),
           merchantId: userId.toString(),
           email: `test_${userHash}@sandbox.com`,
           name: 'Jane Smith',
           totalTransactions: 0,
           totalSpent: 0,
           currency: 'NGN',
           transactionsByCurrency: [
             { currency: 'NGN', count: 0, total: 0 },
             { currency: 'USD', count: 0, total: 0 },
             { currency: 'EUR', count: 0, total: 0 }
           ],
           isSandbox: true
         });
         
         await defaultCustomer1.save();
         await defaultCustomer2.save();
         
         customers.push(defaultCustomer1, defaultCustomer2);
       }
       
       const sandboxData = {
         testApiKey: sandboxConfig.testApiKey,
         testSecretKey: sandboxConfig.testSecretKey,
         testWebhookUrl: sandboxConfig.testWebhookUrl,
         webhookEndpoint: sandboxConfig.webhookEndpoint,
         webhookSecret: sandboxConfig.webhookSecret,
         sampleTransactions: transactions.map(tx => ({
           id: tx.transactionId,
           amount: tx.amount,
           currency: tx.currency,
           status: tx.status,
           customerEmail: tx.customerEmail,
           paymentMethod: tx.paymentMethod,
           createdAt: tx.createdAt.toISOString(),
           description: tx.description,
           merchantId: tx.merchantId,
           isSandbox: true
         })),
         sampleCustomers: customers.map(cust => ({
           id: cust.customerId,
           email: cust.email,
           name: cust.name,
           totalTransactions: cust.totalTransactions,
           totalSpent: cust.totalSpent,
           currency: cust.currency,
           transactionsByCurrency: cust.transactionsByCurrency || [],
           merchantId: cust.merchantId,
           isSandbox: true
         })),
         userInfo: {
           userId: user._id,
           email: user.email,
           firstName: user.firstName || 'User',
           lastName: user.lastName || 'Name',
           role: user.role
         }
       };

      logger.info(`Sandbox data generated for user: ${userId}`);

      res.json({
        success: true,
        data: sandboxData,
        message: 'Sandbox data retrieved successfully'
      });

    } catch (error) {
      logger.error('Error getting sandbox data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sandbox data'
      });
    }
  }

  /**
   * Create customer (upsert) and a pre-filled session in one call
   * Body: { email, name?, amount, currency, description }
   */
  static async createCustomerWithSession(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      logger.info('createCustomerWithSession scope', { effectiveUserId: userId?.toString?.() });
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { email, name, amount, currency, description } = req.body;
      if (!email || !amount || !currency || !description) {
        return res.status(400).json({ success: false, message: 'email, amount, currency, description are required' });
      }

            // Upsert sandbox customer with sane defaults and name from email if absent
      const customerName = (name && name.trim()) || email.split('@')[0];
      
      // Check if customer already exists
      const existingCustomer = await SandboxCustomer.findOne({ userId: userId.toString(), email });
      
      if (existingCustomer) {
        // Update existing customer's name if provided
        if (name && name.trim()) {
          await SandboxCustomer.findOneAndUpdate(
            { userId: userId.toString(), email },
            { $set: { name: customerName } }
          );
        }
              } else {
        // Create new customer
        await SandboxCustomer.create({
          customerId: `cust_${Math.random().toString(36).slice(2, 10)}`,
        userId: userId.toString(),
        merchantId: userId.toString(),
          email,
          name: customerName,
          currency,
          isSandbox: true,
          totalTransactions: 0,
          totalSpent: 0,
          transactionsByCurrency: [
            { currency: currency, count: 0, total: 0 }
          ]
        });
      }

      // Create session tied to this customer email
      const session = (new SandboxSession({
                    userId: userId.toString(),
        apiKeyId: 'default',
        amount,
        currency,
        description,
        customerEmail: email,
        customerName: customerName,
        metadata: { source: 'sandbox-quick-session' }
      }) as unknown) as ISandboxSession;

      await session.save();

      return res.status(201).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl: session.getCheckoutUrl(),
          customerEmail: email,
          amount: session.amount,
          currency: session.currency,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      logger.error('Error creating customer with session:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body
      });
      return res.status(500).json({ 
          success: false,
        message: 'Failed to create customer and session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get sandbox statistics for a user
   */
  static async getSandboxStats(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Period params
      const now = new Date();
      const days = Number(req.query.days || 30);
      const freq = String(req.query.freq || 'daily'); // daily | weekly | monthly
      
      // Calculate proper date range
      const to = new Date(now);
      to.setHours(23, 59, 59, 999); // End of today
      const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0); // Start of the day
      
      const prevTo = new Date(from.getTime() - 1); // End of previous period
      const prevFrom = new Date(prevTo.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      prevFrom.setHours(0, 0, 0, 0); // Start of previous period

      console.log('SandboxController: Date range filtering:', {
        days,
        from: from.toISOString(),
        to: to.toISOString(),
        prevFrom: prevFrom.toISOString(),
        prevTo: prevTo.toISOString()
      });

      // Pull user's preferred currency
      const user = await User.findById(userId).select('preferences.currency');
      const targetCurrency = user?.preferences?.currency || 'NGN';
      await refreshRatesIfNeeded();

      // Aggregate sessions as transactions source
      const sessions = await SandboxSession.aggregate([
        { $match: { userId: userId.toString(), createdAt: { $gte: from, $lte: to } } },
        { $project: { 
            amount: { $divide: ['$amount', 100] }, // Convert from minor units (cents) to major units
            currency: 1, status: 1, createdAt: 1,
            isSubscription: {
              $or: [
                { $gt: [{ $ifNull: ['$metadata.planId', null] }, null] },
                { $gt: [{ $ifNull: ['$metadata.subscriptionId', null] }, null] },
                { $eq: [{ $ifNull: ['$metadata.type', '' ] }, 'subscription'] },
                { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: /subscription/i } }
              ]
            },
            refundAmount: 1 
        } }
      ]);

      const prevSessions = await SandboxSession.aggregate([
        { $match: { userId: userId.toString(), createdAt: { $gte: prevFrom, $lt: from } } },
        { $project: { 
            amount: { $divide: ['$amount', 100] }, // Convert from minor units (cents) to major units
            currency: 1, status: 1, createdAt: 1,
            isSubscription: {
              $or: [
                { $gt: [{ $ifNull: ['$metadata.planId', null] }, null] },
                { $gt: [{ $ifNull: ['$metadata.subscriptionId', null] }, null] },
                { $eq: [{ $ifNull: ['$metadata.type', '' ] }, 'subscription'] },
                { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: /subscription/i } }
              ]
            },
            refundAmount: 1 
        } }
      ]);

      const sum = (arr: any[], pick: (x: any) => number) => arr.reduce((a, b) => a + (pick(b) || 0), 0);
      const cvt = (amt: number, cur: string) => convertAmount(amt || 0, cur || 'NGN', targetCurrency);

      const isPaid = (s: any) => ['completed', 'successful', 'paid'].includes((s.status || '').toLowerCase());

      const paidAll = sessions.filter(isPaid);
      const prevPaidAll = prevSessions.filter(isPaid);

      // Product filter: all | subscriptions | one-time
      const product = String(req.query.product || 'all');
      const applyProduct = (arr: any[]) => {
        if (product === 'subscriptions') return arr.filter(s => s.isSubscription);
        if (product === 'one-time') return arr.filter(s => !s.isSubscription);
        return arr;
      };

      const paid = applyProduct(paidAll);
      const prevPaid = applyProduct(prevPaidAll);

      const allRevenue = sum(paid, s => cvt(s.amount, s.currency));
      const prevAllRevenue = sum(prevPaid, s => cvt(s.amount, s.currency));

      const countNetOrders = (arr: any[]) => arr.filter(s => (s.refundAmount || 0) <= 0).length;
      let newOrders = countNetOrders(paid);
      let prevNewOrders = countNetOrders(prevPaid);

      const newOrderRevenue = allRevenue;
      const prevNewOrderRevenue = prevAllRevenue;

      // Defer aligning orders with subscription count until after we compute subscription counts

      const avgOrderRevenue = newOrders ? (allRevenue / newOrders) : 0;
      const prevAvgOrderRevenue = prevNewOrders ? (prevAllRevenue / prevNewOrders) : 0;

      const subs = paid.filter(s => s.isSubscription);
      const prevSubs = prevPaid.filter(s => s.isSubscription);
      // Revenue derived from paid subscription sessions
      let subscriptionRenewalsRevenue = sum(subs, s => cvt(s.amount, s.currency));
      let prevSubscriptionRenewalsRevenue = sum(prevSubs, s => cvt(s.amount, s.currency));

      // Also count new subscriptions from the subscriptions collection (if present)
      try {
        const subsDocs = await SandboxSubscription.aggregate([
          { $match: { userId: userId.toString(), createdAt: { $gte: from } } },
          { $project: { amount: 1, currency: 1 } }
        ]);
        const prevSubsDocs = await SandboxSubscription.aggregate([
          { $match: { userId: userId.toString(), createdAt: { $gte: prevFrom, $lt: from } } },
          { $project: { amount: 1, currency: 1 } }
        ]);
        // If amounts exist on docs, fold into renewals revenue proxy
        if (Array.isArray(subsDocs)) {
          subscriptionRenewalsRevenue += sum(subsDocs, d => cvt(d.amount, (d as any).currency || 'NGN'));
        }
        if (Array.isArray(prevSubsDocs)) {
          prevSubscriptionRenewalsRevenue += sum(prevSubsDocs, d => cvt(d.amount, (d as any).currency || 'NGN'));
        }
      } catch (_) {}

      // New subscriptions count: from subscriptions collection if available, else from paid sessions with planId
      let newSubscriptions = subs.length;
      let prevNewSubscriptions = prevSubs.length;
      try {
        const newSubsCount = await SandboxSubscription.countDocuments({ userId: userId.toString(), createdAt: { $gte: from } });
        const prevNewSubsCount = await SandboxSubscription.countDocuments({ userId: userId.toString(), createdAt: { $gte: prevFrom, $lt: from } });
        if (newSubsCount !== undefined) newSubscriptions = newSubsCount;
        if (prevNewSubsCount !== undefined) prevNewSubscriptions = prevNewSubsCount;
      } catch (_) {}

      // If user filtered to subscriptions, align order count with new subscriptions started in the period
      if (product === 'subscriptions') {
        newOrders = newSubscriptions;
        prevNewOrders = prevNewSubscriptions;
      }

      const mrr = subscriptionRenewalsRevenue; // simple proxy in sandbox
      const prevMrr = prevSubscriptionRenewalsRevenue;

      let refundsCount = paid.filter(s => (s.refundAmount || 0) > 0).length;
      let prevRefundsCount = prevPaid.filter(s => (s.refundAmount || 0) > 0).length;
      // Prefer refund collection if present
      try {
        const periodRefunds = await SandboxRefund.countDocuments({ userId: userId.toString(), createdAt: { $gte: from } });
        const prevPeriodRefunds = await SandboxRefund.countDocuments({ userId: userId.toString(), createdAt: { $gte: prevFrom, $lt: from } });
        refundsCount = periodRefunds ?? refundsCount;
        prevRefundsCount = prevPeriodRefunds ?? prevRefundsCount;
      } catch (_) {}

      const abandonedCartRevenue = 0; // not tracked in sandbox yet
      const prevAbandonedCartRevenue = 0;

      // Build time-series
      const bucketKey = (d: Date) => {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        if (freq === 'monthly') return `${yyyy}-${mm}`;
        if (freq === 'weekly') {
          const day = d.getUTCDay();
          const diff = (day + 6) % 7; // Monday-based
          const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
          const sm = String(start.getUTCMonth() + 1).padStart(2, '0');
          const sd = String(start.getUTCDate()).padStart(2, '0');
          return `${start.getUTCFullYear()}-${sm}-${sd}`;
        }
        return `${yyyy}-${mm}-${dd}`;
      };

      const seriesMap: Record<string, { date: string; revenue: number; orders: number; subs: number; refunds: number }>= {};
      const breakdownMap: Record<string, { currency: string; amount: number; orders: number; trialToPaid: number }> = {};
      for (const s of paid) {
        const key = bucketKey(new Date((s as any).createdAt || now));
        if (!seriesMap[key]) seriesMap[key] = { date: key, revenue: 0, orders: 0, subs: 0, refunds: 0 };
        seriesMap[key].revenue += cvt(s.amount, s.currency);
        seriesMap[key].orders += 1;
        if (s.isSubscription) seriesMap[key].subs += 1;
        if ((s.refundAmount || 0) > 0) seriesMap[key].refunds += 1;
        const cur = (s.currency || 'NGN').toUpperCase();
        if (!breakdownMap[cur]) breakdownMap[cur] = { currency: cur, amount: 0, orders: 0, trialToPaid: 0 };
        breakdownMap[cur].amount += s.amount;
        breakdownMap[cur].orders += 1;
        // Mark trial-to-paid when description suggests first charge after trial
        try {
          const desc = String((s as any).description || '');
          if (/first\s*charge\s*after\s*trial/i.test(desc) || /trial\s*ended/i.test(desc)) {
            breakdownMap[cur].trialToPaid += 1;
          }
        } catch (_){ }
      }
      const series = Object.values(seriesMap).sort((a,b)=> a.date.localeCompare(b.date));
      const breakdown = Object.values(breakdownMap).map(b => ({ ...b, converted: cvt(b.amount, b.currency) }));

      const stats = {
        currency: targetCurrency,
        freq,
        days,
        series,
        breakdown,
        allRevenue,
        prevAllRevenue,
        newOrders,
        prevNewOrders,
        newOrderRevenue,
        prevNewOrderRevenue,
        avgOrderRevenue,
        prevAvgOrderRevenue,
        subscriptionRenewalsRevenue,
        prevSubscriptionRenewalsRevenue,
        newSubscriptions,
        prevNewSubscriptions,
        mrr,
        prevMrr,
        refundsCount,
        prevRefundsCount,
        abandonedCartRevenue,
        prevAbandonedCartRevenue,
      };

      logger.info(`Sandbox stats retrieved for user: ${userId}`);

      res.json({
        success: true,
        data: stats,
        message: 'Sandbox statistics retrieved successfully'
      });

    } catch (error) {
      logger.error('Error getting sandbox stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sandbox statistics'
      });
    }
  }

  /**
   * Get or create user's permanent API key (Stripe-style)
   */
  static async getApiKey(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Get or create the user's permanent API key
      const apiKey = await SandboxApiKey.getOrCreateUserKey(userId.toString());

      res.json({
        success: true,
        data: {
          apiKey: apiKey.apiKey,
          secretKey: apiKey.secretKey,
          isActive: apiKey.isActive,
          usageCount: apiKey.usageCount,
          lastUsed: apiKey.lastUsed,
          environment: apiKey.environment,
          webhookUrl: apiKey.webhookUrl,
          createdAt: apiKey.createdAt
        }
      });
    } catch (error) {
      logger.error('Error getting API key:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get API key'
      });
    }
  }

  /**
   * Update API key settings (webhook URL, rate limits)
   */
  static async updateApiKey(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { webhookUrl, webhookSecret, rateLimit } = req.body;

      const apiKey = await SandboxApiKey.getOrCreateUserKey(userId.toString());

      // Update webhook settings
      if (webhookUrl !== undefined) {
        apiKey.webhookUrl = webhookUrl;
      }
      if (webhookSecret !== undefined) {
        apiKey.webhookSecret = webhookSecret;
      }

      // Update rate limits
      if (rateLimit) {
        if (rateLimit.requestsPerMinute) {
          apiKey.rateLimit.requestsPerMinute = rateLimit.requestsPerMinute;
        }
        if (rateLimit.requestsPerHour) {
          apiKey.rateLimit.requestsPerHour = rateLimit.requestsPerHour;
        }
        if (rateLimit.requestsPerDay) {
          apiKey.rateLimit.requestsPerDay = rateLimit.requestsPerDay;
        }
      }

      await apiKey.save();

      res.json({
        success: true,
        data: {
          apiKey: apiKey.apiKey,
          isActive: apiKey.isActive,
          webhookUrl: apiKey.webhookUrl,
          rateLimit: apiKey.rateLimit,
          updatedAt: apiKey.updatedAt
        },
        message: 'API key settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating API key:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update API key'
      });
    }
  }

  /**
   * Regenerate API key and secret key
   */
  static async regenerateApiKey(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const apiKey = await SandboxApiKey.getOrCreateUserKey(userId.toString());
      const newKeys = apiKey.regenerateKeys();
      await apiKey.save();

      res.json({
        success: true,
        data: {
          apiKey: newKeys.apiKey,
          secretKey: newKeys.secretKey,
          isActive: apiKey.isActive,
          regeneratedAt: apiKey.updatedAt
        },
        message: 'API keys regenerated successfully'
      });
    } catch (error) {
      logger.error('Error regenerating API key:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to regenerate API key'
      });
    }
  }

  /**
   * Toggle API key active status
   */
  static async toggleApiKeyStatus(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const apiKey = await SandboxApiKey.getOrCreateUserKey(userId.toString());
      apiKey.isActive = !apiKey.isActive;
      await apiKey.save();

      res.json({
        success: true,
        data: {
          apiKey: apiKey.apiKey,
          isActive: apiKey.isActive,
          updatedAt: apiKey.updatedAt
        },
        message: `API key ${apiKey.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Error toggling API key status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to toggle API key status'
      });
    }
  }

  /**
   * Create a new checkout session
   */
  static async createSession(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          cause: 'INVALID_TOKEN: missing'
        });
      }

      const { amount, currency, description, customerEmail, customerName, metadata, success_url, cancel_url, successUrl, cancelUrl } = req.body;
      
      // Debug logging
      console.log('🔍 [createSession] Request body received:', {
        amount,
        currency,
        description,
        customerEmail,
        hasAmount: !!amount,
        amountType: typeof amount
      });
      
      // Validation with field hints
      const errors: string[] = [];
      if (amount === undefined || amount === null) {
        errors.push('missing amount');
      }
      if (amount !== undefined && amount !== null && typeof amount !== 'number') {
        errors.push('invalid amount (must be number)');
      }
      if (currency && typeof currency !== 'string') {
        errors.push('invalid currency (must be string)');
      }
      if (description && typeof description !== 'string') {
        errors.push('invalid description (must be string)');
      }
      if (customerEmail && typeof customerEmail !== 'string') {
        errors.push('invalid customerEmail (must be string)');
      }
      if (customerName && typeof customerName !== 'string') {
        errors.push('invalid customerName (must be string)');
      }
      if (successUrl && typeof successUrl !== 'string') {
        errors.push('invalid successUrl (must be string)');
      }
      if (cancelUrl && typeof cancelUrl !== 'string') {
        errors.push('invalid cancelUrl (must be string)');
      }
      if (success_url && typeof success_url !== 'string') {
        errors.push('invalid success_url (must be string)');
      }
      if (cancel_url && typeof cancel_url !== 'string') {
        errors.push('invalid cancel_url (must be string)');
      }
      
      if (errors.length > 0) {
        console.log('❌ [createSession] Validation failed:', { errors, receivedBody: req.body, amount });
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Validation failed',
          fieldHints: errors
        });
      }
      
      // Convert major units amount to minor units (e.g., NGN kobo, USD cents)
      const computedAmountMinor = (typeof amount === 'number' && amount > 0)
        ? Math.round(amount * 100)
        : 1000;
        
      const session = (new SandboxSession({
          userId: userId.toString(),
        apiKeyId: 'default',
        amount: computedAmountMinor,
        currency: currency || 'USD',
        description: description || 'Sandbox payment',
        customerEmail,
        customerName: (customerName && customerName.trim()) || (customerEmail ? customerEmail.split('@')[0] : undefined),
        productImage: null, // Will be populated if this is a subscription session
        productName: null,  // Will be populated if this is a subscription session
        successUrl: successUrl || success_url,
        cancelUrl: cancelUrl || cancel_url,
        metadata: metadata || { source: 'sandbox-checkout' }
      }) as unknown) as ISandboxSession;

      await session.save();

      // Ensure a sandbox customer exists for this email
      if (customerEmail) {
        await SandboxCustomer.findOneAndUpdate(
          { userId: userId.toString(), email: customerEmail },
          {
            $setOnInsert: {
              customerId: `cust_${Math.random().toString(36).slice(2, 10)}`,
              name: customerName || customerEmail.split('@')[0],
              currency: currency || 'USD',
            isSandbox: true
            }
          },
          { upsert: true, new: true }
        );
      }

      const relative = session.getCheckoutUrl();
      const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, relative);

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl,
          successUrl: session.successUrl || success_url || successUrl || null,
          cancelUrl: session.cancelUrl || cancel_url || cancelUrl || null
        }
      });
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create session'
      });
    }
  }

  /**
   * Get session details
   */
  static async getSession(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          cause: 'INVALID_TOKEN: missing'
        });
      }

      const { sessionId } = req.params;

      // First check if session exists at all
      const sessionExists = await SandboxSession.findOne({ sessionId });
      if (!sessionExists) {
         return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Session not found'
        });
      }

      // Check if session belongs to requesting user
      const session = (await SandboxSession.findOne({ sessionId, userId: userId.toString() }) as unknown) as ISandboxSession | null;
      if (!session) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Session belongs to different workspace',
          cause: 'WORKSPACE_MISMATCH',
          createdWorkspaceId: sessionExists.userId,
          checkoutWorkspaceId: userId.toString()
        });
      }

      const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, session.getCheckoutUrl());
      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl,
          successUrl: session.successUrl || null,
          cancelUrl: session.cancelUrl || null
        }
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get session'
      });
    }
  }

  /**
   * Get recent sessions for a user
   */
  static async getRecentSessions(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { limit = 10, status } = req.query;
      const query: any = { userId: userId.toString() };
      if (status) query.status = status;

      const sessions = await SandboxSession.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string));

       res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error getting recent sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sessions'
      });
    }
  }

  /**
   * Quick Payment Link: create a sharable checkout URL backed by a sandbox session
   * Body: { amount, currency, description, customerEmail?, successUrl?, cancelUrl? }
   * Returns: { checkoutUrl, sessionId }
   */
  static async createQuickPaymentLink(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }

      const { amount, currency, description, customerEmail, successUrl, cancelUrl, success_url, cancel_url, paymentType = 'one_time', interval, trialDays, chargeNow = true } = req.body || {};
      if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'amount (number, major units) is required' });
      }
      if (!currency || typeof currency !== 'string') {
        return res.status(400).json({ success: false, message: 'currency (string) is required' });
      }
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ success: false, message: 'description (string) is required' });
      }

      // One-time or recurring quick link
      if (String(paymentType).toLowerCase() === 'recurring') {
        // Validate interval
        const allowedIntervals = ['day', 'week', 'month', 'quarter', 'year'];
        if (!interval || !allowedIntervals.includes(String(interval).toLowerCase())) {
          return res.status(400).json({ success: false, message: `interval is required and must be one of: ${allowedIntervals.join(', ')}` });
        }

        // Create a minimal product and plan for this workspace
        const SandboxProduct = (await import('../../models/SandboxProduct')).default as any;
        const SandboxPlan = (await import('../../models/SandboxPlan')).default as any;
        const prod = await SandboxProduct.create({ userId: userId.toString(), name: 'Quick Subscription', description: 'Auto-generated for quick recurring link', active: true });
        const plan = await SandboxPlan.create({ userId: userId.toString(), productId: prod._id, amount: Math.round(amount * 100), currency: currency.toUpperCase(), interval: String(interval).toLowerCase(), trialDays: trialDays || 0, active: true });

        // Create a subscription record; optionally create a pending session for first charge
        const SandboxSubscription = (await import('../../models/SandboxSubscription')).default as any;
        const now = new Date();
        const sub = await SandboxSubscription.create({
          userId: userId.toString(),
          customerEmail: customerEmail || undefined,
          productId: prod._id,
          planId: plan._id,
          status: chargeNow ? 'active' : 'trialing',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: (() => {
            const { year, month, date } = { year: now.getFullYear(), month: now.getMonth(), date: now.getDate() } as any;
            const d = new Date(now);
            switch (String(interval).toLowerCase()) {
              case 'day': d.setDate(d.getDate() + 1); break;
              case 'week': d.setDate(d.getDate() + 7); break;
              case 'month': d.setMonth(d.getMonth() + 1); break;
              case 'quarter': d.setMonth(d.getMonth() + 3); break;
              case 'year': d.setFullYear(d.getFullYear() + 1); break;
              default: d.setMonth(d.getMonth() + 1);
            }
            return d;
          })(),
          metadata: {}
        });

        if (chargeNow) {
          // Create a pending session for first charge
          const session = (new SandboxSession({
            userId: userId.toString(),
            apiKeyId: 'default',
            amount: plan.amount,
            currency: plan.currency,
            description: description || `Subscription first payment (${plan.interval})`,
            customerEmail: customerEmail || undefined,
            metadata: { subscriptionId: sub.subscriptionId, productId: prod._id, planId: plan._id },
            status: 'pending',
            webhookDelivered: false,
            webhookAttempts: 0,
            sessionId: `sess_${Math.random().toString(36).slice(2, 10)}`,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
          }) as unknown) as ISandboxSession;
          await session.save();
          const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, session.getCheckoutUrl());
          return res.status(201).json({ success: true, data: { sessionId: session.sessionId, checkoutUrl, mode: 'recurring' } });
        }

        // Trialing without immediate charge: return subscription info
        return res.status(201).json({ success: true, data: { subscriptionId: sub.subscriptionId, mode: 'recurring' } });
      }

      // Default: one-time quick link
      const amountMinor = Math.round(amount * 100);
      const session = (new SandboxSession({
        userId: userId.toString(),
        apiKeyId: 'default',
        amount: amountMinor,
        currency,
        description,
        customerEmail: customerEmail || undefined,
        successUrl: successUrl || success_url,
        cancelUrl: cancelUrl || cancel_url,
        metadata: { source: 'quick-payment-link' },
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }) as unknown) as ISandboxSession;

      await session.save();

      const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, session.getCheckoutUrl());
      return res.status(201).json({ success: true, data: { sessionId: session.sessionId, checkoutUrl, mode: 'one_time' } });
    } catch (error) {
      logger.error('Error creating quick payment link:', error);
      return res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to create quick payment link' });
    }
  }

  /**
   * Create or reuse a dedicated template preview checkout session for the current workspace
   * Returns a pending, non-expired sessionId and its checkoutUrl
   */
  static async getOrCreateTemplatePreviewSession(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }

      const now = Date.now();
      const existing = await SandboxSession.findOne({
        userId: userId.toString(),
        status: 'pending',
        'metadata.templatePreview': true,
        expiresAt: { $gt: new Date(now) }
      }) as ISandboxSession | null;

      if (existing) {
        const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, existing.getCheckoutUrl());
        return res.json({ success: true, data: { sessionId: existing.sessionId, checkoutUrl } });
      }

      const session = (new SandboxSession({
        userId: userId.toString(),
        apiKeyId: 'default',
        amount: 250000, // NGN 2,500.00 (example)
        currency: 'NGN',
        description: 'Template Preview Payment',
        customerEmail: 'preview@example.com',
        metadata: { templatePreview: true },
        status: 'pending',
        expiresAt: new Date(now + 60 * 60 * 1000)
      }) as unknown) as ISandboxSession;

      await session.save();

      const checkoutUrl = SandboxController.buildAbsoluteCheckoutUrl(req, session.getCheckoutUrl());
      return res.status(201).json({ success: true, data: { sessionId: session.sessionId, checkoutUrl } });
    } catch (error) {
      logger.error('Error creating template preview session:', error);
      return res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to create preview session' });
    }
  }

  /**
   * Process payment for a session
   */
  static async processPayment(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          cause: 'INVALID_TOKEN: missing'
        });
      }

      const { sessionId } = req.params;
      const { paymentMethod, cardDetails } = req.body;

      // Validation with field hints
      const errors: string[] = [];
      if (paymentMethod && typeof paymentMethod !== 'string') {
        errors.push('invalid paymentMethod (must be string)');
      }
      if (cardDetails && typeof cardDetails !== 'object') {
        errors.push('invalid cardDetails (must be object)');
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Validation failed',
          fieldHints: errors
        });
      }

      // First check if session exists at all
      const sessionExists = await SandboxSession.findOne({ sessionId });
      if (!sessionExists) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Session not found'
        });
      }

      // Check if session belongs to requesting user
      const session = (await SandboxSession.findOne({ sessionId, userId: userId.toString() }) as unknown) as ISandboxSession | null;
      if (!session) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Session belongs to different workspace',
          cause: 'WORKSPACE_MISMATCH',
          createdWorkspaceId: sessionExists.userId,
          checkoutWorkspaceId: userId.toString()
        });
      }

      // --- Fraud pre-check (sandbox only) ---
      try {
        const { FraudDetectionService } = await import('../../services/analytics/fraudDetectionService');
        const { Types } = await import('mongoose');
        const analysis = await FraudDetectionService.analyzeTransaction({
          transactionId: session.sessionId,
          amount: session.amount,
          currency: session.currency,
          description: session.description,
          customerEmail: session.customerEmail,
          merchantId: (() => { try { return new Types.ObjectId((session as any).userId); } catch { return new Types.ObjectId(); } })(),
          createdAt: new Date(),
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
          isNewCustomer: false
        });
        if (analysis.action === 'block') {
          return res.status(403).json({ success: false, error: 'blocked_by_fraud', risk: analysis.riskScore });
        }
        if (analysis.action === 'review') {
          try {
            const SandboxFraudReview = (await import('../../models/SandboxFraudReview')).default;
            await SandboxFraudReview.create({
              sessionId: session.sessionId,
              userId: session.userId?.toString?.() || (session as any).userId,
              riskScore: analysis.riskScore.score,
              riskLevel: analysis.riskScore.level,
              factors: analysis.riskScore.factors,
              status: 'pending'
            });
          } catch (e) {
            logger.warn('sandbox review create failed', e);
          }
          return res.status(202).json({ success: false, error: 'review_required', risk: analysis.riskScore });
        }
      } catch (e) {
        logger.warn('fraud pre-check failed, proceeding', e);
      }
      // --- end fraud pre-check ---

      // Allow processing for any pending, non-expired session
      const isExpired = session.expiresAt ? new Date(session.expiresAt).getTime() < Date.now() : false;
      if (session.status !== 'pending' || isExpired) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: isExpired ? 'Session expired' : 'Session cannot be processed'
        });
      }

      // Simulate payment processing
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        session.status = 'completed';
        session.completedAt = new Date();
        // Persist the method used into metadata.customFields for UI reporting
        const methodUsed = (paymentMethod as string) || 'card';
        const existingCustom = (session.metadata as any)?.customFields || {};
        (session as any).metadata = {
          ...(session.metadata || {}),
          customFields: {
            ...existingCustom,
            paymentMethodUsed: methodUsed
          }
        };
        await session.save();

        // Note: We no longer persist separate SandboxTransaction records
        // Sessions are the single source of truth for sandbox transactions

        // Update sandbox customer aggregates with proper currency segmentation
        if (session.customerEmail) {
          const customer = await SandboxCustomer.findOne({ 
            userId: userId.toString(),
            email: session.customerEmail 
          });
          
          if (customer) {
            // Update existing customer - always use transactionsByCurrency for proper segmentation
            const existingCurrencyIndex = customer.transactionsByCurrency.findIndex(
              (tx: any) => tx.currency === session.currency
            );
            
            if (existingCurrencyIndex >= 0) {
              // Update existing currency entry by rebuilding the array
              const updatedTransactionsByCurrency = [...customer.transactionsByCurrency];
              updatedTransactionsByCurrency[existingCurrencyIndex] = {
                ...updatedTransactionsByCurrency[existingCurrencyIndex],
                count: updatedTransactionsByCurrency[existingCurrencyIndex].count + 1,
                total: updatedTransactionsByCurrency[existingCurrencyIndex].total + session.amount
              };
              
              await SandboxCustomer.findOneAndUpdate(
                { userId: userId.toString(), email: session.customerEmail },
                {
                  $inc: { totalTransactions: 1 },
                  $set: { transactionsByCurrency: updatedTransactionsByCurrency }
                }
              );
        } else {
              // Add new currency entry
              await SandboxCustomer.findOneAndUpdate(
                { userId: userId.toString(), email: session.customerEmail },
                {
                  $inc: { totalTransactions: 1 },
                  $push: {
                    transactionsByCurrency: {
                      currency: session.currency,
            count: 1,
                      total: session.amount
                    }
                  }
                }
              );
            }
          } else {
            // Create new customer with this transaction's currency
            await SandboxCustomer.create({
              customerId: `cust_${Math.random().toString(36).slice(2, 10)}`,
              userId: userId.toString(),
              merchantId: userId.toString(),
              email: session.customerEmail,
              name: session.customerEmail.split('@')[0],
              currency: session.currency, // Keep primary currency for display
              totalTransactions: 1,
              totalSpent: 0, // Don't use totalSpent for mixed currencies
              transactionsByCurrency: [{
                currency: session.currency,
                count: 1,
                total: session.amount
              }],
              isSandbox: true
            });
          }
        }

        // Send emails (best-effort)
        try {
          const amountMajor = (session.amount || 0) / 100;
          const customerEmail = session.customerEmail || 'noreply@transactlab.com';
          await EmailService.sendPaymentReceipt(customerEmail, {
            customerName: session.customerName || (session.customerEmail ? session.customerEmail.split('@')[0] : 'Customer'),
            amount: amountMajor,
            currency: session.currency,
            reference: session.sessionId,
            date: new Date().toLocaleString(),
            paymentMethod: paymentMethod || 'card'
          });

          // Owner alert
          const owner = await User.findById(userId.toString());
          if (owner?.email) {
            await EmailService.sendOwnerTransactionAlert(owner.email, {
              customerEmail: session.customerEmail || 'unknown',
              amount: amountMajor,
              currency: session.currency,
              reference: session.sessionId,
              date: new Date().toLocaleString(),
              paymentMethod: paymentMethod || 'card'
            });
          }

          // Optional branded success to customer as well
          await EmailService.sendPaymentSuccessEmail(customerEmail, {
            customerName: session.customerName || (session.customerEmail ? session.customerEmail.split('@')[0] : 'Customer'),
            amount: amountMajor,
            currency: session.currency,
            reference: session.sessionId,
            date: new Date().toLocaleString(),
            paymentMethod: paymentMethod || 'card',
            businessName: 'TransactLab Sandbox'
          });
        } catch (e) {
          logger.warn('Sandbox: failed to send payment success email', e);
        }

      res.json({
        success: true,
        data: {
            status: 'completed',
            transactionId: session.sessionId, // Use sessionId as transactionId
            amount: session.getFormattedAmount(),
            completedAt: session.completedAt
          }
        });
      } else {
        session.status = 'failed';
        session.failedAt = new Date();
        session.failureReason = 'Payment simulation failed';
        await session.save();

        res.status(400).json({
          success: false,
          error: 'Payment failed',
          message: 'Payment simulation failed',
          data: {
            status: 'failed',
            failureReason: session.failureReason
          }
        });
      }
    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process payment'
      });
    }
  }

     /**
   * Create a new webhook
    */
  static async createWebhook(req: Request, res: Response) {
     try {
       const userId = req.user?._id;
       if (!userId) {
         return res.status(401).json({
           success: false,
           error: 'Unauthorized',
           message: 'User not authenticated'
         });
       }

      const {
        name,
        url,
        events = ['payment.completed', 'payment.failed'],
        secret,
        retryPolicy,
        timeout,
        isActive,
        description
      } = req.body;

      // Normalize/whitelist events to model enum
      const allowedEvents = [
        'payment.completed',
        'payment.failed',
        'payment.cancelled',
        'payment.refunded',
        'customer.created',
        'customer.updated',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'invoice.created',
        'invoice.paid',
        'webhook.test'
      ];
      const normalizedEvents = Array.isArray(events)
        ? events.filter((e: string) => allowedEvents.includes(e))
        : ['payment.completed', 'payment.failed'];

      const webhook = (new SandboxWebhook({
        userId: userId.toString(),
        name: name || 'Default Webhook',
        url,
        events: normalizedEvents.length ? normalizedEvents : ['payment.completed', 'payment.failed'],
        secret: typeof secret === 'string' && secret.trim().length > 0 ? secret : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        retryConfig: retryPolicy ? {
          maxRetries: retryPolicy === 'none' ? 0 : 3,
          retryDelay: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 5000,
          backoffMultiplier: retryPolicy === 'exponential' ? 2 : 1
        } : undefined,
        metadata: description ? { description, environment: 'sandbox' } : { environment: 'sandbox' }
      }) as unknown) as ISandboxWebhook;

      await webhook.save();

      res.status(201).json({
        success: true,
        data: {
          id: webhook._id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          isActive: webhook.isActive,
          secret: webhook.secret,
          deliveryCount: 0,
          lastDelivery: null,
          lastDeliveryStatus: 'pending'
        }
      });
    } catch (error) {
      logger.error('Error creating webhook:', error);
      res.status(500).json({
           success: false,
        error: 'Internal server error',
        message: 'Failed to create webhook'
      });
    }
  }

  /**
   * Get user's webhooks
   */
  static async getWebhooks(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const webhooks = await SandboxWebhook.find({ userId: userId.toString() }).sort({ createdAt: -1 });

      const shaped = webhooks.map((w: any) => {
        const successTs = w.deliveryStats?.lastSuccessfulDelivery ? new Date(w.deliveryStats.lastSuccessfulDelivery).getTime() : 0;
        const failedTs = w.deliveryStats?.lastFailedDelivery ? new Date(w.deliveryStats.lastFailedDelivery).getTime() : 0;
        const deliveryCount = (w.deliveryStats?.successfulDeliveries || 0) + (w.deliveryStats?.failedDeliveries || 0);
        let lastDeliveryStatus: 'success' | 'failed' | 'pending' = 'pending';
        if (deliveryCount > 0) {
          lastDeliveryStatus = successTs >= failedTs ? 'success' : 'failed';
        }
        const lastDelivery = successTs >= failedTs ? w.deliveryStats?.lastSuccessfulDelivery : w.deliveryStats?.lastFailedDelivery;

        return {
          id: w._id,
          name: w.name,
          url: w.url,
          events: w.events,
          isActive: w.isActive,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          deliveryCount,
          lastDelivery,
          lastDeliveryStatus
        };
      });

      res.json({
        success: true,
        data: shaped
      });
     } catch (error) {
      logger.error('Error getting webhooks:', error);
       res.status(500).json({
         success: false,
         error: 'Internal server error',
        message: 'Failed to get webhooks'
       });
     }
   }

   /**
   * Test a webhook by sending a test event
    */
  static async testWebhook(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { webhookId } = req.params;

      const webhook = (await SandboxWebhook.findById(webhookId) as unknown) as ISandboxWebhook | null;
      if (!webhook || webhook.userId !== userId.toString()) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Webhook not found'
        });
      }

      // Simulate sending a test webhook
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from TransactLab Sandbox',
          webhookId: webhook._id,
        userId: userId.toString()
        }
      };

      // Update webhook delivery stats
      webhook.recordSuccessfulDelivery();
      await webhook.save();

      res.json({
        success: true,
        message: 'Test webhook sent successfully',
        data: {
          webhookId: webhook._id,
          url: webhook.url,
          event: 'webhook.test',
          timestamp: testPayload.timestamp
        }
      });
    } catch (error) {
      logger.error('Error testing webhook:', error);
      res.status(500).json({
          success: false,
        error: 'Internal server error',
        message: 'Failed to test webhook'
      });
    }
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const totalTransactions = await SandboxSession.countDocuments({
        userId: userId.toString(),
        status: { $in: ['completed', 'failed'] }
      });

      // Get completed sessions as transactions (primary source)
      const sessionPayments = await SandboxSession.find({
        userId: userId.toString(),
        status: { $in: ['completed', 'failed'] } // Only show completed/failed, not pending
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const transactions = sessionPayments.map((s: any) => ({
        transactionId: s.sessionId, // use sessionId as the transaction identifier in sandbox
        sessionId: s.sessionId,
        amount: s.amount,
        currency: s.currency,
        description: s.description,
        customerEmail: s.customerEmail,
        status: s.status === 'completed' ? 'successful' : s.status,
        createdAt: s.completedAt || s.createdAt,
        paymentMethod: 'Credit/Debit Card'
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(totalTransactions / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.json({
        success: true,
        data: transactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalTransactions,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      logger.error('Error getting recent transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get recent transactions'
      });
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { name, email, phone, address, description } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Name and email are required'
        });
      }

      // Check if customer already exists
      const existingCustomer = await SandboxCustomer.findOne({ 
        email: email.toLowerCase(),
        userId: userId.toString()
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'Customer Exists',
          message: 'A customer with this email already exists'
        });
      }

      // Generate customer ID
      const customerId = `cus_${Math.random().toString(36).slice(2, 10)}`;

      // Create customer data
      const customerData = {
        customerId,
        userId: userId.toString(),
        merchantId: userId.toString(), // Using userId as merchantId for sandbox
        email: email.toLowerCase(),
        name,
        phone: phone || undefined,
        address: address ? {
          line1: address.line1 || undefined,
          line2: address.line2 || undefined,
          city: address.city || undefined,
          state: address.state || undefined,
          postalCode: address.postalCode || undefined,
          country: address.country || 'NG'
        } : undefined,
        description: description || undefined,
        totalTransactions: 0,
        totalSpent: 0,
        currency: 'NGN',
        transactionsByCurrency: [{ currency: 'NGN', count: 0, total: 0 }],
        isSandbox: true
      };

      const customer = new SandboxCustomer(customerData);
      await customer.save();

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });

    } catch (error) {
      logger.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create customer'
      });
    }
  }

  /**
   * Get sandbox customers for a user
   */
  static async getCustomers(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      console.log('[getCustomers] Debug:', {
        userId,
        path: req.path,
        headers: {
          'x-owner-id': req.headers['x-owner-id'],
          'X-Owner-Id': req.headers['X-Owner-Id'],
          'x-team-id': req.headers['x-team-id'],
          'X-Team-Id': req.headers['X-Team-Id']
        },
        userObject: req.user
      });
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { force_migration, page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const totalCustomers = await SandboxCustomer.countDocuments({ userId: userId.toString() });

      const customers = await SandboxCustomer.find({ userId: userId.toString() })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Clean up any customers with mixed currency data in totalSpent
      for (const customer of customers) {
        if (customer.totalSpent > 0 && customer.transactionsByCurrency && customer.transactionsByCurrency.length > 0) {
          // Check if totalSpent doesn't match any single currency total
          const currencyTotals = customer.transactionsByCurrency.reduce((sum: number, tx: any) => sum + tx.total, 0);
          if (customer.totalSpent !== currencyTotals) {
            // Reset totalSpent to 0 to avoid confusion
            await SandboxCustomer.findByIdAndUpdate(customer._id, { $set: { totalSpent: 0 } });
            customer.totalSpent = 0;
          }
        }
        
        // Fix customers with data inconsistencies
        const hasTransactionsButEmptyCurrency = customer.totalTransactions > 0 && (!customer.transactionsByCurrency || customer.transactionsByCurrency.length === 0);
        const hasZeroTotalsButTransactions = customer.transactionsByCurrency && customer.transactionsByCurrency.some((tx: any) => tx.total === 0 && tx.count > 0);
        const hasTotalSpentButEmptyCurrency = customer.totalSpent > 0 && (!customer.transactionsByCurrency || customer.transactionsByCurrency.length === 0);
        const hasIncorrectTransactionCount = customer.transactionsByCurrency && customer.transactionsByCurrency.length > 0 && 
          customer.totalTransactions !== customer.transactionsByCurrency.reduce((sum: number, tx: any) => sum + tx.count, 0);
        
        const needsMigration = hasTransactionsButEmptyCurrency || hasZeroTotalsButTransactions || hasTotalSpentButEmptyCurrency || hasIncorrectTransactionCount;
        
        console.log(`Customer ${customer.email} migration check:`, {
          totalTransactions: customer.totalTransactions,
          totalSpent: customer.totalSpent,
          transactionsByCurrency: customer.transactionsByCurrency,
          hasTransactionsButEmptyCurrency,
          hasZeroTotalsButTransactions,
          hasTotalSpentButEmptyCurrency,
          hasIncorrectTransactionCount,
          needsMigration
        });
        
        if (needsMigration) {
          console.log(`Migrating customer ${customer.email} - totalTransactions: ${customer.totalTransactions}, totalSpent: ${customer.totalSpent}`);
          
          // Get all completed sessions for this customer
          const sessions = await SandboxSession.find({
        userId: userId.toString(),
            customerEmail: customer.email,
            status: 'completed'
          });
          
          // Get all successful transactions for this customer
          const transactions = await SandboxTransaction.find({
            userId: userId.toString(),
            customerEmail: customer.email,
            status: 'successful'
          });
          
          console.log(`Found ${sessions.length} completed sessions and ${transactions.length} transactions for ${customer.email}`);
          
          // Recalculate currency totals - avoid double counting by using unique transaction identifiers
          const recalculatedTotals: { [key: string]: { count: number; total: number } } = {};
          const processedTransactions = new Set<string>(); // Track processed transactions to avoid duplicates
          
          // Add session data (use sessionId as unique identifier)
          sessions.forEach((session: any) => {
            console.log(`Session: ${session.currency} ${session.amount} (ID: ${session.sessionId})`);
            if (!processedTransactions.has(session.sessionId)) {
              if (!recalculatedTotals[session.currency]) {
                recalculatedTotals[session.currency] = { count: 0, total: 0 };
              }
              recalculatedTotals[session.currency].count += 1;
              recalculatedTotals[session.currency].total += session.amount;
              processedTransactions.add(session.sessionId);
            }
          });
          
          // Add transaction data (use transactionId as unique identifier, but check for sessionId overlap)
          transactions.forEach((transaction: any) => {
            console.log(`Transaction: ${transaction.currency} ${transaction.amount} (ID: ${transaction.transactionId})`);
            
            // Check if this transaction corresponds to a session we already processed
            const sessionId = transaction.metadata?.originalTransactionId || transaction.metadata?.sessionId;
            const isDuplicate = sessionId && processedTransactions.has(sessionId);
            
            if (!isDuplicate && !processedTransactions.has(transaction.transactionId)) {
              if (!recalculatedTotals[transaction.currency]) {
                recalculatedTotals[transaction.currency] = { count: 0, total: 0 };
              }
              recalculatedTotals[transaction.currency].count += 1;
              recalculatedTotals[transaction.currency].total += transaction.amount;
              processedTransactions.add(transaction.transactionId);
            } else if (isDuplicate) {
              console.log(`Skipping duplicate transaction ${transaction.transactionId} (already processed as session ${sessionId})`);
            }
          });
          
          console.log('Recalculated totals:', recalculatedTotals);
          
          // Calculate total transaction count
          const totalTransactionCount = Object.values(recalculatedTotals).reduce((sum, data) => sum + data.count, 0);
          
          // Update the customer with correct totals
          const updatedTransactionsByCurrency = Object.entries(recalculatedTotals).map(([currency, data]) => ({
            currency,
            count: data.count,
            total: data.total
          }));
          
          // Update customer with correct data
          await SandboxCustomer.findByIdAndUpdate(customer._id, {
            $set: { 
              transactionsByCurrency: updatedTransactionsByCurrency,
              totalTransactions: totalTransactionCount,
              totalSpent: 0 // Reset since we're using currency segmentation
            }
          });
          
          // Update the customer object for the response
          customer.transactionsByCurrency = updatedTransactionsByCurrency;
          customer.totalTransactions = totalTransactionCount;
          customer.totalSpent = 0;
        }
      }

      // Calculate pagination info
      const totalPages = Math.ceil(totalCustomers / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return res.json({ 
        success: true,
        data: customers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCustomers,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      logger.error('Error getting customers:', error);
      return res.status(500).json({ success: false, message: 'Failed to get customers' });
    }
  }

  /**
   * Update a sandbox customer (name, email, phone, address, description)
   */
  static async updateCustomer(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { customerId } = req.params;
      const { 
        name, 
        email, 
        phone, 
        address,
        description 
      } = req.body as { 
        name?: string;
        email?: string;
        phone?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
        description?: string;
      };

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer id is required' });
      }

      // Build update object with only provided fields
      const updateData: any = {};
      
      if (name !== undefined && name.trim()) updateData.name = name.trim();
      if (email !== undefined && email.trim()) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid email format' 
          });
        }
        updateData.email = email.toLowerCase().trim();
      }
      if (phone !== undefined) updateData.phone = phone.trim() || null;
      if (description !== undefined) updateData.description = description.trim() || null;
      
      // Handle address update
      if (address !== undefined) {
        updateData.address = {
          line1: address.line1?.trim() || null,
          line2: address.line2?.trim() || null,
          city: address.city?.trim() || null,
          state: address.state?.trim() || null,
          postalCode: address.postalCode?.trim() || null,
          country: address.country?.trim() || 'NG' // Default to Nigeria if not provided
        };
      }

      const customer = await SandboxCustomer.findOneAndUpdate(
        { _id: customerId, userId: userId.toString() },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      return res.json({ success: true, data: customer });
    } catch (error) {
      logger.error('Error updating customer:', error);
      return res.status(500).json({ success: false, message: 'Failed to update customer' });
    }
  }

  /**
   * Delete a sandbox customer
   */
  static async deleteCustomer(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { customerId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer id is required' });
      }

      const customer = await SandboxCustomer.findOneAndDelete({ _id: customerId, userId: userId.toString() }).lean();
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      return res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
      logger.error('Error deleting customer:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete customer' });
    }
  }

  /**
   * Export customer data (customer + sessions + invoices + transactions)
   */
  static async exportCustomer(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { customerId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer id is required' });
      }

      const customer = await SandboxCustomer.findOne({ _id: customerId, userId: userId.toString() }).lean();
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const [sessions, invoices, transactions] = await Promise.all([
        SandboxSession.find({ userId: userId.toString(), customerEmail: customer.email }).lean(),
        (SandboxInvoice as any).find({ userId: userId.toString(), customerEmail: customer.email }).lean(),
        SandboxTransaction.find({ userId: userId.toString(), customerEmail: customer.email }).lean(),
      ]);

      const payload = { customer, sessions, invoices, transactions, exportedAt: new Date().toISOString() };
      return res.json({ success: true, data: payload });
    } catch (error) {
      logger.error('Error exporting customer:', error);
      return res.status(500).json({ success: false, message: 'Failed to export customer' });
    }
  }

  // Products
  static async createProduct(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { name, description, image } = req.body as any;
      if (!name) return res.status(400).json({ success: false, message: 'Name required' });
      
      let imageUrl = undefined;
      
      // Handle image upload with Cloudinary first, then fallback to local upload
      if (image) {
        let uploadSuccess = false;
        
        // Try Cloudinary first
        try {
          const tempProductId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const cloudinaryResult = await CloudinaryService.uploadProductImage(image, tempProductId);
          
          if (cloudinaryResult.success && cloudinaryResult.url) {
            imageUrl = cloudinaryResult.url;
            uploadSuccess = true;
            console.log('Image uploaded to Cloudinary successfully');
          } else {
            console.warn('Cloudinary upload failed:', cloudinaryResult.error);
          }
        } catch (error) {
          console.error('Cloudinary upload error:', error);
        }
        
        // Fallback to local upload if Cloudinary fails
        if (!uploadSuccess) {
          try {
            const localResult = await LocalUploadService.uploadImage(image, 'products');
            
            if (localResult.success && localResult.url) {
              imageUrl = localResult.url;
              uploadSuccess = true;
              console.log('Image uploaded to local storage successfully');
            } else {
              console.warn('Local upload failed:', localResult.error);
            }
          } catch (error) {
            console.error('Local upload error:', error);
          }
        }
        
        if (!uploadSuccess) {
          console.error('Both Cloudinary and local upload failed, continuing without image');
        }
      }
      
      const product = await SandboxProduct.create({ 
        userId: userId.toString(), 
        name, 
        description,
        image: imageUrl
      });
      
      // If we used a temporary ID, update the folder structure with the real product ID
      if (imageUrl && product.productId) {
        try {
          const tempPublicId = CloudinaryService.extractPublicId(imageUrl);
          if (tempPublicId) {
            // Extract the temp product ID from the public ID
            const tempProductId = tempPublicId.split('/').pop()?.split('_')[1];
            if (tempProductId) {
              // Note: Cloudinary doesn't support moving files, so we'll keep the temp structure
              // In production, you might want to re-upload with the correct folder structure
            }
          }
        } catch (error) {
          console.warn('Failed to update Cloudinary folder structure:', error);
        }
      }
      
      // Invalidate product-related caches
      await CacheInvalidationService.invalidateProductData(userId.toString());
      
      return res.json({ success: true, data: product });
    } catch (error) {
      logger.error('Error creating product:', error);
      return res.status(500).json({ success: false, message: 'Failed to create product' });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      const userIdStr = userId.toString();
      
      // Try to get from cache first
      const cachedProducts = await CacheService.get('products', userIdStr);
      if (cachedProducts) {
        logger.debug(`Cache HIT: Products for user ${userIdStr}`);
        return res.json({ success: true, data: cachedProducts });
      }

      // Cache miss - fetch from database
      logger.debug(`Cache MISS: Products for user ${userIdStr}`);
      const products = await SandboxProduct.find({ userId: userIdStr }).sort({ createdAt: -1 }).lean();
      
      // Cache the results for 10 minutes
      await CacheService.set('products', userIdStr, products, { ttl: 600 });
      
      return res.json({ success: true, data: products });
    } catch (error) {
      logger.error('Error getting products:', error);
      return res.status(500).json({ success: false, message: 'Failed to get products' });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { productId } = req.params as any;
      const { name, description, image, active } = req.body as any;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      // Get current product to handle image deletion
      const currentProduct = await SandboxProduct.findOne({ _id: productId, userId: userId.toString() }).lean();
      if (!currentProduct) return res.status(404).json({ success: false, message: 'Product not found' });
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (active !== undefined) updateData.active = active;
      
      // Handle image update
      if (image !== undefined) {
        if (image === null || image === '') {
          // Delete existing image from Cloudinary if it exists
          if (currentProduct.image) {
            try {
              const publicId = CloudinaryService.extractPublicId(currentProduct.image);
              if (publicId) {
                await CloudinaryService.deleteImage(publicId);
              }
            } catch (error) {
              console.warn('Failed to delete old image from Cloudinary:', error);
            }
          }
          updateData.image = null;
        } else if (image && image !== currentProduct.image) {
          // Upload new image with Cloudinary first, then fallback to local upload
          let uploadSuccess = false;
          let newImageUrl = null;
          
          // Try Cloudinary first
          try {
            const cloudinaryResult = await CloudinaryService.uploadProductImage(image, currentProduct.productId);
            
            if (cloudinaryResult.success && cloudinaryResult.url) {
              newImageUrl = cloudinaryResult.url;
              uploadSuccess = true;
              console.log('New image uploaded to Cloudinary successfully');
            } else {
              console.warn('Cloudinary upload failed:', cloudinaryResult.error);
            }
          } catch (error) {
            console.error('Cloudinary upload error:', error);
          }
          
          // Fallback to local upload if Cloudinary fails
          if (!uploadSuccess) {
            try {
              const localResult = await LocalUploadService.uploadImage(image, 'products');
              
              if (localResult.success && localResult.url) {
                newImageUrl = localResult.url;
                uploadSuccess = true;
                console.log('New image uploaded to local storage successfully');
              } else {
                console.warn('Local upload failed:', localResult.error);
              }
            } catch (error) {
              console.error('Local upload error:', error);
            }
          }
          
          if (uploadSuccess && newImageUrl) {
            // Delete old image if it exists
            if (currentProduct.image) {
              try {
                // Try to delete from Cloudinary first
                if (currentProduct.image.includes('cloudinary.com')) {
                  const oldPublicId = CloudinaryService.extractPublicId(currentProduct.image);
                  if (oldPublicId) {
                    await CloudinaryService.deleteImage(oldPublicId);
                  }
                }
                // Try to delete from local storage
                else if (currentProduct.image.includes('/uploads/')) {
                  const oldFileName = LocalUploadService.extractFileName(currentProduct.image);
                  if (oldFileName) {
                    await LocalUploadService.deleteFile(oldFileName);
                  }
                }
              } catch (error) {
                console.warn('Failed to delete old image:', error);
              }
            }
            updateData.image = newImageUrl;
          } else {
            console.error('Both Cloudinary and local upload failed, keeping old image');
            // Keep the old image if upload fails
          }
        }
      }
      
      const product = await SandboxProduct.findOneAndUpdate(
        { _id: productId, userId: userId.toString() },
        { $set: updateData },
        { new: true }
      ).lean();
      
      // Invalidate product-related caches
      await CacheInvalidationService.invalidateProductData(userId.toString(), productId);
      
      return res.json({ success: true, data: product });
    } catch (error) {
      logger.error('Error updating product:', error);
      return res.status(500).json({ success: false, message: 'Failed to update product' });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { productId } = req.params as any;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Check if product exists and belongs to user
      const product = await SandboxProduct.findOne({ _id: productId, userId: userId.toString() });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      // Check if product has active plans
      const activePlans = await SandboxPlan.find({ productId, active: { $ne: false } });
      if (activePlans.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot delete product with active plans. Please archive or delete all plans first.' 
        });
      }

      // Delete image from storage if it exists
      if (product.image) {
        try {
          // Try to delete from Cloudinary first
          if (product.image.includes('cloudinary.com')) {
            const publicId = CloudinaryService.extractPublicId(product.image);
            if (publicId) {
              await CloudinaryService.deleteImage(publicId);
              console.log('Image deleted from Cloudinary');
            }
          }
          // Try to delete from local storage
          else if (product.image.includes('/uploads/')) {
            const fileName = LocalUploadService.extractFileName(product.image);
            if (fileName) {
              await LocalUploadService.deleteFile(fileName);
              console.log('Image deleted from local storage');
            }
          }
        } catch (error) {
          console.warn('Failed to delete image from storage:', error);
        }
      }

      // Delete the product
      await SandboxProduct.findByIdAndDelete(productId);
      return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      logger.error('Error deleting product:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
  }

  // Plans
  static async createPlan(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { productId, amount, currency, interval, trialDays } = req.body as any;
      if (!productId || amount === undefined || !currency || !interval) return res.status(400).json({ success: false, message: 'Missing required fields' });
      
      logger.info('Creating plan', {
        userId: userId.toString(),
        productId,
        amount,
        currency,
        interval,
        trialDays
      });
      
      const plan = await SandboxPlan.create({ userId: userId.toString(), productId, amount, currency, interval, trialDays });
      
      logger.info('Plan created successfully', {
        planId: plan._id,
        planPlanId: plan.planId,
        productId: plan.productId
      });
      
      return res.json({ success: true, data: plan });
    } catch (error) {
      logger.error('Error creating plan:', error);
      return res.status(500).json({ success: false, message: 'Failed to create plan' });
    }
  }

  static async getPlans(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { productId } = req.query as any;
      const query: any = { userId: userId.toString() };
      if (productId) query.productId = productId;
      const plans = await SandboxPlan.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: plans });
    } catch (error) {
      logger.error('Error getting plans:', error);
      return res.status(500).json({ success: false, message: 'Failed to get plans' });
    }
  }

  /**
   * Debug endpoint to check plan-product relationships
   * GET /api/v1/sandbox/debug/plan-product-relationships
   */
  static async debugPlanProductRelationships(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Get all plans for the user
      const plans = await SandboxPlan.find({ userId: userId.toString() }).lean();
      
      // Get all products for the user
      const products = await SandboxProduct.find({ userId: userId.toString() }).lean();
      
      // Check relationships
      const relationships = plans.map(plan => {
        const product = products.find(p => p.productId === plan.productId);
        return {
          plan: {
            _id: plan._id,
            planId: plan.planId,
            productId: plan.productId,
            amount: plan.amount,
            interval: plan.interval
          },
          product: product ? {
            _id: product._id,
            productId: product.productId,
            name: product.name,
            hasImage: !!product.image
          } : null,
          relationshipValid: !!product
        };
      });

      return res.json({
        success: true,
        data: {
          plansCount: plans.length,
          productsCount: products.length,
          relationships,
          summary: {
            totalPlans: plans.length,
            totalProducts: products.length,
            validRelationships: relationships.filter(r => r.relationshipValid).length,
            invalidRelationships: relationships.filter(r => !r.relationshipValid).length
          }
        }
      });
    } catch (error) {
      logger.error('Error debugging plan-product relationships:', error);
      return res.status(500).json({ success: false, message: 'Failed to debug relationships' });
    }
  }

  static async updatePlan(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { planId } = req.params as any;
      const { amount, currency, interval, trialDays, active } = req.body as any;
      const update: any = {};
      if (amount !== undefined) update.amount = amount;
      if (currency) update.currency = currency;
      if (interval) update.interval = interval;
      if (trialDays !== undefined) update.trialDays = trialDays;
      if (active !== undefined) update.active = active;
      const plan = await SandboxPlan.findOneAndUpdate({ _id: planId, userId: userId.toString() }, { $set: update }, { new: true }).lean();
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
      return res.json({ success: true, data: plan });
    } catch (error) {
      logger.error('Error updating plan:', error);
      return res.status(500).json({ success: false, message: 'Failed to update plan' });
    }
  }

  static async deletePlan(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { planId } = req.params as any;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Check if plan exists and belongs to user
      const plan = await SandboxPlan.findOne({ _id: planId, userId: userId.toString() });
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      // Check if plan has active subscriptions
      const activeSubscriptions = await SandboxSubscription.find({ planId, status: { $nin: ['canceled', 'paused'] } });
      if (activeSubscriptions.length > 0) {
        return res.status(400).json({ 
        success: false,
          message: 'Cannot delete plan with active subscriptions. Please cancel or pause all subscriptions first.' 
        });
      }

      // Delete the plan
      await SandboxPlan.findByIdAndDelete(planId);
      return res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
      logger.error('Error deleting plan:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete plan' });
    }
  }

  // Subscriptions lifecycle
  static addInterval(date: Date, interval: string): Date {
    const d = new Date(date);
    switch (interval) {
      case 'day': d.setDate(d.getDate() + 1); break;
      case 'week': d.setDate(d.getDate() + 7); break;
      case 'month': d.setMonth(d.getMonth() + 1); break;
      case 'quarter': d.setMonth(d.getMonth() + 3); break;
      case 'year': d.setFullYear(d.getFullYear() + 1); break;
      default: d.setMonth(d.getMonth() + 1);
    }
    return d;
  }

  static async createSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { customerEmail, planId, chargeNow = true } = req.body as any;
      if (!customerEmail || !planId) return res.status(400).json({ success: false, message: 'Missing fields' });

      const plan = await SandboxPlan.findOne({ planId: planId, userId: userId.toString(), active: true }).lean();
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      const now = new Date();
      let status: any = 'active';
      let currentPeriodStart = now;
      let currentPeriodEnd = SandboxController.addInterval(now, plan.interval);
      if (!chargeNow && plan.trialDays && plan.trialDays > 0) {
        status = 'trialing';
        currentPeriodStart = now;
        currentPeriodEnd = new Date(now.getTime() + plan.trialDays * 24 * 3600 * 1000);
      }

      const subscription = await SandboxSubscription.create({
        userId: userId.toString(),
        customerEmail,
        productId: plan.productId,
        planId: plan._id,
        status,
        startDate: now,
        currentPeriodStart,
        currentPeriodEnd,
        metadata: {}
      });

      let session: any = null;
      if (chargeNow) {
        // Fetch product details to include image in checkout session
        logger.info('Fetching product for subscription checkout', {
          userId: userId.toString(),
          planProductId: plan.productId,
          planId: plan._id
        });
        
        // Try to find the product with multiple strategies
        let product = await SandboxProduct.findOne({ productId: plan.productId, userId: userId.toString() }).lean();
        
        // If not found, try alternative lookup strategies
        if (!product) {
          logger.warn('Product not found with exact productId match, trying alternative lookups', {
            planProductId: plan.productId,
            userId: userId.toString()
          });
          
          // Try to find by MongoDB _id if plan.productId is actually a MongoDB ObjectId
          try {
            product = await SandboxProduct.findById(plan.productId).lean();
            if (product) {
              logger.info('Found product using MongoDB _id lookup', {
                productId: product.productId,
                productName: product.name
              });
            }
          } catch (idError) {
            // Not a valid ObjectId, continue
          }
          
          // If still not found, try to find any product for this user (fallback)
          if (!product) {
            const userProducts = await SandboxProduct.find({ userId: userId.toString(), active: true }).lean();
            if (userProducts.length > 0) {
              product = userProducts[0]; // Use the first active product as fallback
              logger.warn('Using fallback product for checkout session', {
                fallbackProductId: product.productId,
                fallbackProductName: product.name,
                originalPlanProductId: plan.productId
              });
            }
          }
        }
        
        logger.info('Product lookup result', {
          found: !!product,
          productId: product?._id,
          productName: product?.name,
          productImage: product?.image ? 'present' : 'missing',
          planProductId: plan.productId
        });
        
        session = await SandboxSession.create({
          userId: userId.toString(),
          apiKeyId: 'default',
          amount: plan.amount,
          currency: plan.currency,
          description: `Subscription first payment (${plan.interval})`,
          customerEmail,
          productImage: product?.image || null,
          productName: product?.name || null,
          metadata: { 
            source: 'sandbox-subscription',
            subscriptionId: subscription.subscriptionId, 
            productId: plan.productId, 
            planId: plan._id 
          },
          paymentConfig: { allowedPaymentMethods: ['card'], requireCustomerEmail: false, requireCustomerName: false, autoCapture: true },
          status: 'pending',
          webhookDelivered: false,
          webhookAttempts: 0,
          sessionId: `sess_${Math.random().toString(36).slice(2, 10)}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        } as any);
        
        logger.info('Checkout session created', {
          sessionId: session.sessionId,
          productName: session.productName,
          productImage: session.productImage ? 'present' : 'missing'
        });
      }

      return res.json({ success: true, data: { subscription, sessionId: session?.sessionId } });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      return res.status(500).json({ success: false, message: 'Failed to create subscription' });
    }
  }

  static async listSubscriptions(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { customerEmail } = req.query as any;
      const query: any = { userId: userId.toString() };
      if (customerEmail) query.customerEmail = customerEmail;
      
      // Get subscriptions
      const subs = await SandboxSubscription.find(query).sort({ createdAt: -1 }).lean();
      
      // Get unique plan and product IDs
      const planIds = [...new Set(subs.map(sub => sub.planId))];
      const productIds = [...new Set(subs.map(sub => sub.productId))];
      
      // Fetch plan and product details
      const [plans, products] = await Promise.all([
        SandboxPlan.find({ $or: [{ planId: { $in: planIds } }, { _id: { $in: planIds } }], userId: userId.toString() }).lean(),
        SandboxProduct.find({ _id: { $in: productIds }, userId: userId.toString() }).lean()
      ]);
      
      // Create lookup maps - check both planId and _id
      const planMap = new Map();
      plans.forEach(plan => {
        planMap.set(plan.planId, plan);
        planMap.set(plan._id.toString(), plan);
      });
      const productMap = new Map(products.map(product => [product._id.toString(), product]));
      
      // Transform the data to include plan details
      const transformedSubs = subs.map((sub: any) => {
        const plan = planMap.get(sub.planId);
        const product = productMap.get(sub.productId);
        
        return {
          ...sub,
          planAmount: plan?.amount || 0,
          planCurrency: plan?.currency || 'NGN',
          planInterval: plan?.interval || 'month',
          planName: product?.name || 'Subscription Plan',
          planDescription: product?.description || '',
          productImage: product?.image || null,
          currency: plan?.currency || 'NGN'
        };
      });
      
      return res.json({ success: true, data: transformedSubs });
    } catch (error) {
      logger.error('Error listing subscriptions:', error);
      return res.status(500).json({ success: false, message: 'Failed to list subscriptions' });
    }
  }

  static async getSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      const { subscriptionId } = req.params;
      const sub = await SandboxSubscription.findOne({ 
        subscriptionId, 
        userId: userId.toString() 
      }).lean();
      
      if (!sub) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }
      
      // Get plan and product details
      const [plan, product] = await Promise.all([
        SandboxPlan.findOne({ $or: [{ planId: sub.planId }, { _id: sub.planId }], userId: userId.toString() }).lean(),
        SandboxProduct.findOne({ _id: sub.productId, userId: userId.toString() }).lean()
      ]);
      
      // Transform the data to include plan details
      const transformedSub = {
        ...sub,
        planAmount: plan?.amount || 0,
        planCurrency: plan?.currency || 'NGN',
        planInterval: plan?.interval || 'month',
        planName: product?.name || 'Subscription Plan',
        planDescription: product?.description || '',
        productImage: product?.image || null,
        currency: plan?.currency || 'NGN'
      };
      
      return res.json({ success: true, data: transformedSub });
    } catch (error) {
      logger.error('Error getting subscription:', error);
      return res.status(500).json({ success: false, message: 'Failed to get subscription' });
    }
  }

  static async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { subscriptionId } = req.params as any;
      const { atPeriodEnd = true } = req.body as any;
      const update: any = atPeriodEnd ? { cancelAtPeriodEnd: true } : { status: 'canceled', canceledAt: new Date() };
      const sub = await SandboxSubscription.findOneAndUpdate({ _id: subscriptionId, userId: userId.toString() }, { $set: update }, { new: true }).lean();
      if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
      return res.json({ success: true, data: sub });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      return res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
    }
  }

  static async pauseSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { subscriptionId } = req.params as any;
      const sub = await SandboxSubscription.findOneAndUpdate({ _id: subscriptionId, userId: userId.toString() }, { $set: { status: 'paused' } }, { new: true }).lean();
      if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
      return res.json({ success: true, data: sub });
    } catch (error) {
      logger.error('Error pausing subscription:', error);
      return res.status(500).json({ success: false, message: 'Failed to pause subscription' });
    }
  }

  static async resumeSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { subscriptionId } = req.params as any;
      const sub = await SandboxSubscription.findOneAndUpdate({ _id: subscriptionId, userId: userId.toString() }, { $set: { status: 'active' } }, { new: true }).lean();
      if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
      return res.json({ success: true, data: sub });
    } catch (error) {
      logger.error('Error resuming subscription:', error);
      return res.status(500).json({ success: false, message: 'Failed to resume subscription' });
    }
  }

  // -----------------
  // Reminders/Renewals
  // -----------------

  static async processSubscriptionReminders() {
    const now = new Date();
    const threeDaysMs = 3 * 24 * 3600 * 1000;
    // Find subs renewing in <= 3 days and > now, active and not paused/canceled
    const subs = await SandboxSubscription.find({
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $gt: now, $lte: new Date(now.getTime() + threeDaysMs) }
    }).lean();

    for (const s of subs) {
      const meta = (s as any).metadata || {};
      const periodKey = `reminder_${new Date(s.currentPeriodEnd).toISOString()}`;
      if (meta[periodKey]) continue; // already reminded for this period end

      // Simulate webhook/event
      logger.info(`subscription.upcoming_renewal → ${s.subscriptionId} for ${s.customerEmail} at ${s.currentPeriodEnd.toISOString()}`);
      // Mark reminder stored
      await SandboxSubscription.findByIdAndUpdate((s as any)._id, { $set: { [`metadata.${periodKey}`]: true } });
    }
  }

  static async processSubscriptionRenewals() {
    const now = new Date();
    const dueSubs = await SandboxSubscription.find({
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $lte: now }
    }).lean();

    for (const s of dueSubs) {
      // Fetch plan for pricing
      const plan = await SandboxPlan.findOne({ _id: s.planId, userId: (s as any).userId }).lean();
      if (!plan) continue;

      // Handle cancel at period end
      if ((s as any).cancelAtPeriodEnd) {
        await SandboxSubscription.findByIdAndUpdate((s as any)._id, { $set: { status: 'canceled', canceledAt: now } });
        logger.info(`subscription.canceled → ${s.subscriptionId}`);
        continue;
      }

      // If coming from trialing to active, do a first charge now
      const isTrialToActive = s.status === 'trialing';

      // Create a completed session to simulate auto-renewal payment
      const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}`;
      const session = await SandboxSession.create({
        userId: (s as any).userId,
        apiKeyId: 'default',
        amount: plan.amount,
        currency: plan.currency,
        description: isTrialToActive ? 'Subscription first charge after trial' : 'Subscription renewal charge',
        customerEmail: s.customerEmail,
        metadata: { subscriptionId: s.subscriptionId, productId: s.productId, planId: s.planId },
        paymentConfig: { allowedPaymentMethods: ['card'], requireCustomerEmail: false, requireCustomerName: false, autoCapture: true },
        status: 'completed',
        webhookDelivered: false,
        webhookAttempts: 0,
        sessionId,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
        completedAt: now
      } as any);

      // Emit webhook-like log for payment
      logger.info(`payment.completed → subscription ${s.subscriptionId} session ${sessionId}`);

      // Advance period
      const nextStart = s.currentPeriodEnd;
      const nextEnd = SandboxController.addInterval(nextStart, plan.interval as any);
      const updates: any = {
        currentPeriodStart: nextStart,
        currentPeriodEnd: nextEnd,
        status: 'active'
      };
      await SandboxSubscription.findByIdAndUpdate((s as any)._id, { $set: updates });
    }
  }

  // Manual trigger endpoints
  static async runRenewals(req: Request, res: Response) {
    try {
      await SandboxController.processSubscriptionReminders();
      await SandboxController.processSubscriptionRenewals();
      return res.json({ success: true });
    } catch (e) {
      logger.error('runRenewals error:', e);
      return res.status(500).json({ success: false, message: 'Failed to run renewals' });
    }
  }

  /**
   * Debug endpoint to check customer sessions
   */
  static async debugCustomerSessions(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { email } = req.query;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      const sessions = await SandboxSession.find({
        userId: userId.toString(),
        customerEmail: email as string
      }).sort({ createdAt: -1 });

      const transactions = await SandboxTransaction.find({
        userId: userId.toString(),
        customerEmail: email as string
      }).sort({ createdAt: -1 });

      const customer = await SandboxCustomer.findOne({
        userId: userId.toString(),
        email: email as string
      });

      // Check for potential duplicates
      const duplicateCheck = transactions.map((t: any) => {
        const sessionId = t.metadata?.originalTransactionId || t.metadata?.sessionId;
        const hasMatchingSession = sessions.some((s: any) => s.sessionId === sessionId);
        return {
          transactionId: t.transactionId,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          customerEmail: t.customerEmail,
          createdAt: t.createdAt,
          processedAt: t.processedAt,
          metadata: t.metadata,
          hasMatchingSession,
          matchingSessionId: sessionId
        };
      });

      return res.json({
        success: true,
        data: {
          customer,
          sessions: sessions.map((s: any) => ({
            sessionId: s.sessionId,
            amount: s.amount,
            currency: s.currency,
            status: s.status,
            customerEmail: s.customerEmail,
            createdAt: s.createdAt,
            completedAt: s.completedAt
          })),
          transactions: duplicateCheck,
          summary: {
            totalSessions: sessions.length,
            totalTransactions: transactions.length,
            potentialDuplicates: duplicateCheck.filter(t => t.hasMatchingSession).length
          }
        }
      });
    } catch (error) {
      logger.error('Error debugging customer sessions:', error);
      return res.status(500).json({ success: false, message: 'Failed to debug customer sessions' });
    }
  }

  // Legacy methods for backward compatibility

  /**
   * Create a test transaction (legacy method)
   */
  static async createTestTransaction(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        message: 'Test transaction creation is deprecated. Use the new session-based approach.',
        data: {
          transactionId: 'txn_test_legacy',
          status: 'completed',
          message: 'This endpoint is deprecated. Please use /sessions endpoint instead.'
        }
      });
    } catch (error) {
      logger.error('Error creating test transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create test transaction'
      });
    }
  }

  /**
   * Create a test subscription (legacy method)
   */
  static async createTestSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        message: 'Test subscription creation is deprecated. Use the new session-based approach.',
        data: {
          subscriptionId: 'sub_test_legacy',
          status: 'active',
          message: 'This endpoint is deprecated. Please use /sessions endpoint instead.'
        }
      });
    } catch (error) {
      logger.error('Error creating test subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create test subscription'
      });
    }
  }

  /**
   * Get refunds for a customer
   */
  static async getRefunds(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { customerEmail, limit = 50, offset = 0 } = req.query;

      let query: any = { userId };
      
      if (customerEmail) {
        query.customerEmail = customerEmail;
      }

      const refunds = await SandboxRefund.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));

      const total = await SandboxRefund.countDocuments(query);

      res.json({
        success: true,
        data: refunds,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + parseInt(limit as string)
        }
      });
    } catch (error) {
      logger.error('Error fetching refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch refunds'
      });
    }
  }

  /**
   * Process refund
   */
  static async processRefund(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { transactionId, amount, reason, customerEmail } = req.body;

      if (!transactionId || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID and customer email are required'
        });
      }

      // Find the session (in sandbox, sessions are the source of truth for transactions)
      const session = await SandboxSession.findOne({
        sessionId: transactionId,
        customerEmail,
        userId: userId.toString()
      }) as ISandboxSession | null;

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check if session is completed (successful)
      if (session.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only successful transactions can be refunded'
        });
      }

      // Calculate refund amount (default to full amount if not specified)
      const refundAmount = amount || session.amount;

      // Create refund record
      const refund = new SandboxRefund({
        refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        transactionId: transactionId, // Use the sessionId as transactionId
        customerEmail,
        amount: refundAmount,
        currency: session.currency,
        reason: reason || 'requested_by_customer',
        status: 'succeeded',
        createdAt: new Date()
      });

      await refund.save();

      // Update session status to show it's been refunded
      await SandboxSession.updateOne(
        { sessionId: transactionId, userId: userId.toString() },
        { 
          status: 'refunded',
          refundedAt: new Date(),
          refundAmount: refundAmount
        }
      );

      // Update customer totals
      await SandboxCustomer.updateOne(
        { email: customerEmail, userId },
        { 
          $inc: { 
            totalSpent: -refundAmount,
            totalTransactions: -1
          }
        }
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: refund
      });
    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process refund'
      });
    }
  }

  /**
   * Complete pending transaction (legacy method)
   */
  static async completePendingTransaction(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        message: 'Manual transaction completion is deprecated. Use the new session-based approach.',
        data: {
          status: 'completed',
          message: 'This endpoint is deprecated. Please use the new payment processing endpoints.'
        }
      });
    } catch (error) {
      logger.error('Error completing pending transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to complete pending transaction'
      });
    }
  }

  /**
   * Update sandbox configuration (legacy method)
   */
  static async updateSandboxConfig(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        message: 'Sandbox configuration update is deprecated. Use the new API key and webhook endpoints.',
        data: {
          status: 'updated',
          message: 'This endpoint is deprecated. Please use the new API key and webhook management endpoints.'
        }
      });
    } catch (error) {
      logger.error('Error updating sandbox config:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update sandbox configuration'
      });
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      logger.info('Creating invoice with userId:', userId);
      logger.info('Request body:', req.body);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }
      
      const { amount, currency, description, customerEmail, customerName, dueDate } = req.body;

      if (!amount || !currency || !description || !customerEmail || !dueDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Amount, currency, description, customer email, and due date are required'
        });
      }

      const invoice = new (SandboxInvoice as any)({
        userId,
        customerEmail: customerEmail.toLowerCase(),
        customerName,
        amount: parseInt(amount),
        currency: currency.toUpperCase(),
        description,
        dueDate: new Date(dueDate),
        status: 'draft'
      });

      await invoice.save();

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create invoice'
      });
    }
  }

  /**
   * Get invoices for a user
   */
  static async getInvoices(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { customerEmail, status } = req.query;

      let query: any = { userId };
      
      if (customerEmail) {
        query.customerEmail = (customerEmail as string).toLowerCase();
      }
      
      if (status) {
        query.status = status;
      }

      const invoices = await (SandboxInvoice as any).find(query).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch invoices'
      });
    }
  }

  /**
   * Create a new payment method
   */
  static async createPaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { customerEmail, customerName, type, cardDetails, bankDetails, walletDetails, isDefault } = req.body;

      if (!customerEmail || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Customer email and payment method type are required'
        });
      }

      // Validate card details if type is card
      if (type === 'card' && cardDetails) {
        const { cardNumber, expMonth, expYear, cvv, cardholderName } = cardDetails;
        
        if (!cardNumber || !expMonth || !expYear || !cvv || !cardholderName) {
          return res.status(400).json({
            success: false,
            error: 'Missing card details',
            message: 'Card number, expiry month, expiry year, CVV, and cardholder name are required'
          });
        }

        // Extract card brand from number (simplified)
        const brand = cardNumber.startsWith('4') ? 'visa' : 
                     cardNumber.startsWith('5') ? 'mastercard' : 
                     cardNumber.startsWith('3') ? 'amex' : 'unknown';

        cardDetails.brand = brand;
        cardDetails.last4 = cardNumber.slice(-4);
      }

      const paymentMethod = new (SandboxPaymentMethod as any)({
        userId,
        customerEmail: customerEmail.toLowerCase(),
        customerName,
        type,
        cardDetails: type === 'card' ? cardDetails : undefined,
        bankDetails: type === 'bank_account' ? bankDetails : undefined,
        walletDetails: type === 'wallet' ? walletDetails : undefined,
        isDefault: isDefault || false
      });

      await paymentMethod.save();

      res.status(201).json({
        success: true,
        data: paymentMethod,
        message: 'Payment method added successfully'
      });
    } catch (error) {
      logger.error('Error creating payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to add payment method'
      });
    }
  }

  /**
   * Get payment methods for a customer
   */
  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { customerEmail } = req.query;

      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing customer email',
          message: 'Customer email is required'
        });
      }

      const paymentMethods = await (SandboxPaymentMethod as any).find({ customerEmail: customerEmail as string });

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch payment methods'
      });
    }
  }

  /**
   * Send invoice to customer
   */
  static async sendInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { invoiceId } = req.params;

      const invoice = await (SandboxInvoice as any).findOne({ 
        _id: invoiceId, 
        userId 
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found',
          message: 'Invoice not found or you do not have permission to access it'
        });
      }

      // Update invoice status to 'sent'
      invoice.status = 'sent';
      await invoice.save();

      // In a real system, you would:
      // 1. Generate PDF invoice
      // 2. Send email to customer with PDF attachment
      // 3. Log the email delivery

      logger.info(`Invoice ${invoiceId} sent to ${invoice.customerEmail}`);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice sent successfully'
      });
    } catch (error) {
      logger.error('Error sending invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to send invoice'
      });
    }
  }

  /**
   * Mark invoice as paid
   */
  static async markInvoicePaid(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { invoiceId } = req.params;
      const { sessionId, paidAmount } = req.body;

      const invoice = await (SandboxInvoice as any).findOne({ 
        _id: invoiceId, 
        userId 
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found',
          message: 'Invoice not found or you do not have permission to access it'
        });
      }

      // Mark invoice as paid
      await invoice.markAsPaid(sessionId, paidAmount);

      // Create a transaction record for the invoice payment
      const transaction = new (SandboxTransaction as any)({
        userId,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: sessionId || `inv_${invoiceId}`,
        customerEmail: invoice.customerEmail,
        customerName: invoice.customerName,
        amount: paidAmount || invoice.amount,
        currency: invoice.currency,
        status: 'successful',
        paymentMethod: 'invoice_payment',
        description: `Invoice payment: ${invoice.description}`,
        metadata: {
          source: 'invoice_payment',
          invoiceId: invoiceId,
          testTimestamp: Date.now()
        }
      });

      await transaction.save();

      // Update customer totals
      await SandboxController.updateCustomerTotals(invoice.customerEmail, invoice.amount, invoice.currency);

      logger.info(`Invoice ${invoiceId} marked as paid and transaction created`);

      res.json({
        success: true,
        data: {
          invoice,
          transaction
        },
        message: 'Invoice marked as paid successfully and transaction created'
      });
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to mark invoice as paid'
      });
    }
  }

  /**
   * Update customer totals when a transaction is made
   */
  private static async updateCustomerTotals(customerEmail: string, amount: number, currency: string) {
    try {
      const customer = await (SandboxCustomer as any).findOne({ 
        email: customerEmail.toLowerCase() 
      });

      if (customer) {
        // Find existing currency entry or create new one
        const existingCurrencyIndex = customer.transactionsByCurrency.findIndex(
          (t: any) => t.currency === currency
        );

        if (existingCurrencyIndex >= 0) {
          // Update existing currency
          customer.transactionsByCurrency[existingCurrencyIndex].count += 1;
          customer.transactionsByCurrency[existingCurrencyIndex].total += amount;
        } else {
          // Add new currency
          customer.transactionsByCurrency.push({
            currency,
            count: 1,
            total: amount
          });
        }

        // Update overall totals
        customer.totalTransactions += 1;
        customer.totalSpent += amount;
        customer.currency = currency; // Set primary currency

        await customer.save();
        logger.info(`Updated customer totals for ${customerEmail}: +${amount} ${currency}`);
      }
    } catch (error) {
      logger.error('Error updating customer totals:', error);
    }
  }

  /**
   * Get invoice details
   */
  static async getInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { invoiceId } = req.params;

      const invoice = await (SandboxInvoice as any).findOne({ 
        _id: invoiceId, 
        userId 
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found',
          message: 'Invoice not found or you do not have permission to access it'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch invoice'
      });
    }
  }

  // ===== Team endpoints =====
  static async inviteTeamMember(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      const { email, teamName } = req.body as any;
      if (!userId || !email) return res.status(400).json({ success: false, message: 'Missing owner or email' });
      let team = await SandboxTeam.findOne({ ownerId: userId });
      if (!team) team = await SandboxTeam.create({ name: teamName || 'My Team', ownerId: userId, members: [] });
      const lower = String(email).toLowerCase();
      const existing: any = team.members.find((m: any) => m.email === lower);
      const token = crypto.randomBytes(16).toString('hex');
      if (existing) {
        if (existing.status === 'active') return res.json({ success: true, message: 'Already a member', data: team });
        existing.invitedAt = new Date(); existing.inviteToken = token; existing.status = 'invited';
      } else {
        (team.members as any).push({ email: lower, status: 'invited', invitedAt: new Date(), inviteToken: token });
      }
      await team.save();
      const acceptUrl = `https://transactlab-payment-sandbox.vercel.app/team/accept?token=${token}`;
      try { await EmailService.sendTeamInvite(lower, acceptUrl); } catch {}
      res.json({ success: true, data: { teamId: team._id, token }, message: 'Invite sent' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to invite member' });
    }
  }

  static async acceptTeamInvite(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      const { token } = req.body as any;
      if (!userId || !token) return res.status(400).json({ success: false, message: 'Missing token or auth' });
      const team = await SandboxTeam.findOne({ 'members.inviteToken': token });
      if (!team) return res.status(404).json({ success: false, message: 'Invite not found' });
      const member: any = (team.members as any).find((m: any) => m.inviteToken === token);
      if (!member) return res.status(404).json({ success: false, message: 'Invite not found' });
      member.status = 'active'; member.joinedAt = new Date(); member.userId = userId; member.inviteToken = undefined;
      await team.save();
      res.json({ success: true, data: team, message: 'Joined team' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to accept invite' });
    }
  }

  static async getMyTeams(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      const teams = await SandboxTeam.find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] });
      res.json({ success: true, data: teams });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch teams' });
    }
  }

  static async getTeamMembers(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      const team = await SandboxTeam.findOne({ ownerId: userId });
      if (!team) return res.json({ success: true, data: [] });
      res.json({ success: true, data: team.members });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch team members' });
    }
  }

  static async cancelTeamInvite(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      const { email } = req.query as any;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
      const team = await SandboxTeam.findOne({ ownerId: userId });
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
      const before = team.members.length;
      team.members = (team.members as any).filter((m: any) => !(m.email === String(email).toLowerCase() && m.status === 'invited')) as any;
      const after = team.members.length;
      await team.save();
      res.json({ success: true, data: team.members, message: before !== after ? 'Invite cancelled' : 'No pending invite for this email' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to cancel invite' });
    }
  }

  // Team: rename (owner only)
  static async renameTeam(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user?._id?.toString();
      const { name } = req.body as any;
      if (!name) return res.status(400).json({ success: false, message: 'Name required' });
      const team = await SandboxTeam.findOneAndUpdate({ ownerId }, { $set: { name }, $push: { logs: { type: 'rename', at: new Date(), meta: { name } } } }, { new: true });
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
      res.json({ success: true, data: team });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to rename team' });
    }
  }

  // Team: remove member (owner only)
  static async removeTeamMember(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user?._id?.toString();
      const { email } = req.query as any;
      if (!email) return res.status(400).json({ success: false, message: 'Email required' });
      const team = await SandboxTeam.findOne({ ownerId });
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
      const before = team.members.length;
      team.members = (team.members as any).filter((m: any) => m.email !== String(email).toLowerCase());
      await team.save();
      if (before === team.members.length) return res.json({ success: true, message: 'No matching member', data: team.members });
      await SandboxTeam.findOneAndUpdate({ ownerId }, { $push: { logs: { type: 'remove', at: new Date(), actorEmail: email } } });
      res.json({ success: true, data: team.members });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
  }

  // Team: record switch event (any member)
  static async recordWorkspaceSwitch(req: Request, res: Response) {
    try {
      const { teamId, email } = req.body as any;
      const team = await SandboxTeam.findOne({ _id: teamId });
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
      const member = (team.members as any).find((m: any) => m.email === String(email).toLowerCase());
      if (member) member.lastSwitchAt = new Date();
      await team.save();
      await SandboxTeam.findByIdAndUpdate(teamId, { $push: { logs: { type: 'switch', at: new Date(), actorEmail: email } } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to record switch' });
    }
  }

  // Team: get logs (owner only)
  static async getTeamLogs(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user?._id?.toString();
      const team = await SandboxTeam.findOne({ ownerId }).lean();
      if (!team) return res.json({ success: true, data: [] });
      res.json({ success: true, data: team.logs?.slice(-200) || [] });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
  }

  // Team: reject invite (invited user)
  static async rejectTeamInvite(req: Request, res: Response) {
    try {
      const { token } = req.body as any;
      if (!token) return res.status(400).json({ success: false, message: 'Token required' });
      
      const team = await SandboxTeam.findOne({ 'invites.token': token });
      if (!team) return res.status(404).json({ success: false, message: 'Invite not found' });
      
      // Get the email before removing the invite
      const inviteEmail = team.invites.find((invite: any) => invite.token === token)?.email;
      
      // Remove the invite
      team.invites = team.invites.filter((invite: any) => invite.token !== token);
      await team.save();
      
      // Log the rejection
      await SandboxTeam.findByIdAndUpdate(team._id, { 
        $push: { logs: { type: 'reject', at: new Date(), actorEmail: inviteEmail } } 
      });
      
      res.json({ success: true, message: 'Invite rejected' });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to reject invite' });
    }
  }

  // Team: get pending invites for current user
  static async getPendingInvites(req: Request, res: Response) {
    try {
      const userEmail = (req as any).user?.email;
      if (!userEmail) return res.status(401).json({ success: false, message: 'User email required' });
      
      const teams = await SandboxTeam.find({ 'invites.email': userEmail }).lean();
      const pendingInvites = teams.map(team => ({
        teamId: team._id,
        teamName: team.name,
        ownerId: team.ownerId,
        invite: team.invites.find((invite: any) => invite.email === userEmail)
      }));
      
      res.json({ success: true, data: pendingInvites });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending invites' });
    }
  }

  // Internal proxy methods for workspace-bound hosted checkout
  static async getSessionForCheckout(req: Request, res: Response) {
    try {
      const { id: sessionId } = req.params;
      
      // Find session directly (public endpoint for checkout)
      const session = await SandboxSession.findOne({ sessionId }).lean();
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or expired'
        });
      }

      // Check if session is expired
      if (session.status === 'expired' || new Date() > new Date(session.expiresAt)) {
        return res.status(410).json({
          success: false,
          message: 'Session has expired'
        });
      }

      // Return complete session data for checkout
      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl: `${process.env.TL_BASE}/checkout/${session.sessionId}`,
          amount: session.amount / 100, // Convert to major units
          currency: session.currency,
          description: session.description,
          customerEmail: session.customerEmail,
          status: session.status,
          expiresAt: session.expiresAt,
          productImage: session.productImage || null,
          productName: session.productName || null,
          successUrl: session.successUrl,
          cancelUrl: session.cancelUrl
        }
      });
    } catch (error) {
      console.error('Error fetching session for checkout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch session for checkout' 
      });
    }
  }

  static async processPaymentForCheckout(req: Request, res: Response) {
    try {
      const { id: sessionId } = req.params;
      const paymentData = req.body;
      
      // Use server-side sandbox secret for internal requests
      const sandboxSecret = process.env.SANDBOX_SECRET;
      if (!sandboxSecret) {
        return res.status(500).json({ 
          success: false, 
          message: 'Sandbox secret not configured' 
        });
      }

      // Process payment using server-side authentication
      const response = await fetch(`${process.env.TL_BASE}/api/v1/sandbox/sessions/${sessionId}/process-payment`, {
        method: 'POST',
        headers: {
          'x-sandbox-secret': sandboxSecret,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      // Return payment result to frontend
      res.json(data);
    } catch (error) {
      console.error('Error processing payment for checkout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process payment for checkout' 
      });
    }
  }

  /**
   * Get fraud settings for sandbox (per workspace)
   */
  static async getFraudSettings(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }
      const config = await SandboxConfig.findOne({ userId: userId.toString() });
      if (!config) {
        return res.status(404).json({ success: false, error: 'Not found', message: 'Sandbox config not found' });
      }
      return res.status(200).json({
        success: true,
        data: {
          fraud: config.fraud || { enabled: true, blockThreshold: 70, reviewThreshold: 50, flagThreshold: 30 }
        }
      });
    } catch (error) {
      logger.error('getFraudSettings error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Update fraud settings for sandbox (per workspace)
   */
  static async updateFraudSettings(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not authenticated' });
      }
      const { enabled, blockThreshold, reviewThreshold, flagThreshold } = req.body || {};
      const errors: string[] = [];
      const isNumberOrUndef = (v: any) => v === undefined || typeof v === 'number';
      if (enabled !== undefined && typeof enabled !== 'boolean') errors.push('enabled must be boolean');
      if (!isNumberOrUndef(blockThreshold)) errors.push('blockThreshold must be number');
      if (!isNumberOrUndef(reviewThreshold)) errors.push('reviewThreshold must be number');
      if (!isNumberOrUndef(flagThreshold)) errors.push('flagThreshold must be number');
      if (errors.length) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Validation failed', fieldHints: errors });
      }

      const config = await SandboxConfig.findOne({ userId: userId.toString() });
      if (!config) {
        return res.status(404).json({ success: false, error: 'Not found', message: 'Sandbox config not found' });
      }

      config.fraud = {
        enabled: enabled !== undefined ? enabled : config.fraud?.enabled ?? true,
        blockThreshold: blockThreshold ?? config.fraud?.blockThreshold ?? 70,
        reviewThreshold: reviewThreshold ?? config.fraud?.reviewThreshold ?? 50,
        flagThreshold: flagThreshold ?? config.fraud?.flagThreshold ?? 30
      };

      await config.save();
      return res.status(200).json({ success: true, data: { fraud: config.fraud } });
    } catch (error) {
      logger.error('updateFraudSettings error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}