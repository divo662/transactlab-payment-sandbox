import { Router } from 'express';
import { SandboxController } from '../../controllers/sandbox/sandboxController';
import { sandboxFlexibleAuth } from '../../middleware/auth/sandboxFlexibleAuth';
import { applyWorkspaceScope } from '../../middleware/auth/applyWorkspaceScope';
import { getFraudSummary, getRecentFraudDecisions, listFraudReviews, approveFraudReview, denyFraudReview } from '../../controllers/analytics/reportController';
import cacheMiddleware, { cacheKeyGenerators } from '../../middleware/cache/cacheMiddleware';

const router = Router();

// Apply flexible authentication: Bearer JWT or x-sandbox-secret
router.use(sandboxFlexibleAuth, applyWorkspaceScope);

// Core sandbox data and overview (with caching)
router.get('/data', cacheMiddleware({ 
  ttl: 300, // 5 minutes
  keyGenerator: cacheKeyGenerators.userRoute 
}), SandboxController.getSandboxData);

router.get('/stats', cacheMiddleware({ 
  ttl: 180, // 3 minutes
  keyGenerator: cacheKeyGenerators.userRoute 
}), SandboxController.getSandboxStats);

// API Key management (Stripe-style single permanent key)
router.get('/api-key', SandboxController.getApiKey);
router.put('/api-key', SandboxController.updateApiKey);
router.post('/api-key/regenerate', SandboxController.regenerateApiKey);
router.post('/api-key/toggle', SandboxController.toggleApiKeyStatus);

// Session management
router.post('/sessions', SandboxController.createSession);
router.get('/sessions/:sessionId', SandboxController.getSession);
router.get('/sessions', SandboxController.getRecentSessions);
router.post('/sessions/preview-template', SandboxController.getOrCreateTemplatePreviewSession);
// Quick Payment Link (session-backed)
router.post('/links/quick', SandboxController.createQuickPaymentLink);
// Checkout URL resolution (workspace-safe)
router.get('/checkout-url/:sessionId', SandboxController.getCheckoutUrl);
// Quick create customer + session
router.post('/customers/quick-session', SandboxController.createCustomerWithSession);

// Fraud settings (sandbox-only)
router.get('/fraud/settings', SandboxController.getFraudSettings);
router.put('/fraud/settings', SandboxController.updateFraudSettings);

// Fraud read-only summaries (sandbox-auth)
router.get('/fraud/summary', getFraudSummary);
router.get('/fraud/decisions', getRecentFraudDecisions);
router.get('/fraud/reviews', listFraudReviews);
router.post('/fraud/reviews/:id/approve', approveFraudReview);
router.post('/fraud/reviews/:id/deny', denyFraudReview);

// Payment processing
router.post('/sessions/:sessionId/process-payment', SandboxController.processPayment);

// Webhook management
router.post('/webhooks', SandboxController.createWebhook);
router.get('/webhooks', SandboxController.getWebhooks);
router.post('/webhooks/:webhookId/test', SandboxController.testWebhook);

// Transaction history
router.get('/transactions', SandboxController.getRecentTransactions);

// Debug endpoints
router.get('/debug/plan-product-relationships', SandboxController.debugPlanProductRelationships);

// Customers (with caching for GET requests)
router.post('/customers', SandboxController.createCustomer);
router.get('/customers', cacheMiddleware({ 
  ttl: 300, // 5 minutes
  keyGenerator: cacheKeyGenerators.userRoute 
}), SandboxController.getCustomers);
router.put('/customers/:customerId', SandboxController.updateCustomer);
router.delete('/customers/:customerId', SandboxController.deleteCustomer);
router.get('/customers/:customerId/export', SandboxController.exportCustomer);
router.get('/debug/customer-sessions', SandboxController.debugCustomerSessions);

// Products & Plans
router.post('/products', SandboxController.createProduct);
router.get('/products', SandboxController.getProducts);
router.put('/products/:productId', SandboxController.updateProduct);
router.delete('/products/:productId', SandboxController.deleteProduct);

router.post('/plans', SandboxController.createPlan);
router.get('/plans', SandboxController.getPlans);
router.put('/plans/:planId', SandboxController.updatePlan);
router.delete('/plans/:planId', SandboxController.deletePlan);

// Subscriptions
router.post('/subscriptions', SandboxController.createSubscription);
router.get('/subscriptions', SandboxController.listSubscriptions);
router.get('/subscriptions/:subscriptionId', SandboxController.getSubscription);
router.post('/subscriptions/:subscriptionId/cancel', SandboxController.cancelSubscription);
router.post('/subscriptions/:subscriptionId/pause', SandboxController.pauseSubscription);
router.post('/subscriptions/:subscriptionId/resume', SandboxController.resumeSubscription);
router.post('/subscriptions/run-renewals', SandboxController.runRenewals);

// Invoices
router.post('/invoices', SandboxController.createInvoice);
router.get('/invoices', SandboxController.getInvoices);
router.get('/invoices/:invoiceId', SandboxController.getInvoice);
router.post('/invoices/:invoiceId/send', SandboxController.sendInvoice);
router.post('/invoices/:invoiceId/mark-paid', SandboxController.markInvoicePaid);

// Payment Methods
router.post('/payment-methods', SandboxController.createPaymentMethod);
router.get('/payment-methods', SandboxController.getPaymentMethods);

// Refunds
router.get('/refunds', SandboxController.getRefunds);
router.post('/refunds', SandboxController.processRefund);

// Team
router.post('/team/invite', SandboxController.inviteTeamMember);
router.post('/team/accept', SandboxController.acceptTeamInvite);
router.get('/team/members', SandboxController.getTeamMembers);
router.get('/teams', SandboxController.getMyTeams);
router.delete('/team/invite', SandboxController.cancelTeamInvite);
router.patch('/team/name', SandboxController.renameTeam);
router.delete('/team/member', SandboxController.removeTeamMember);
router.post('/team/logs/switch', SandboxController.recordWorkspaceSwitch);
router.get('/team/logs', SandboxController.getTeamLogs);
router.post('/team/reject', SandboxController.rejectTeamInvite);
router.get('/team/pending-invites', SandboxController.getPendingInvites);

// Legacy endpoints (keeping for backward compatibility)
router.post('/transactions', SandboxController.createTestTransaction);
router.post('/subscriptions', SandboxController.createTestSubscription);
router.post('/transactions/complete', SandboxController.completePendingTransaction);
router.put('/config', SandboxController.updateSandboxConfig);

// Internal proxy routes for workspace-bound hosted checkout
// These routes bypass normal auth and use server-side sandbox secret
router.get('/internal/checkout/sessions/:id', SandboxController.getSessionForCheckout);
router.post('/internal/checkout/sessions/:id/process', SandboxController.processPaymentForCheckout);

export default router;
