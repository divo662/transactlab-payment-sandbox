import { logger } from '../../utils/helpers/logger';
import SandboxApiKey from '../../models/SandboxApiKey';
import SandboxSession from '../../models/SandboxSession';
import SandboxTransaction from '../../models/SandboxTransaction';
import SandboxWebhook from '../../models/SandboxWebhook';
import { WebhookService } from './WebhookService';
import { PaymentSimulationService } from './PaymentSimulationService';

export interface CreateSessionRequest {
  userId: string;
  apiKeyId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: {
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  paymentConfig?: {
    allowedPaymentMethods?: string[];
    requireCustomerEmail?: boolean;
    requireCustomerName?: boolean;
    autoCapture?: boolean;
    captureAmount?: number;
  };
  expiresIn?: number; // minutes
}

export interface SessionResponse {
  sessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  expiresAt: Date;
  metadata: any;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  apiKey: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  usageCount: number;
  lastUsed?: Date;
  webhookUrl?: string;
  metadata: any;
}

export class SandboxService {
  private webhookService: WebhookService;
  private paymentService: PaymentSimulationService;

  constructor() {
    this.webhookService = new WebhookService();
    this.paymentService = new PaymentSimulationService();
  }

  /**
   * Create a new API key for sandbox testing
   */
  async createApiKey(userId: string, data: {
    name: string;
    permissions?: string[];
    expiresAt?: Date;
    webhookUrl?: string;
    metadata?: any;
  }): Promise<ApiKeyResponse> {
    try {
      const apiKey = new SandboxApiKey({
        userId,
        name: data.name,
        permissions: data.permissions || ['payments:read', 'payments:write', 'customers:read', 'webhooks:read'],
        expiresAt: data.expiresAt,
        webhookUrl: data.webhookUrl,
        metadata: {
          ...data.metadata,
          environment: 'sandbox'
        }
      });

      await apiKey.save();

      logger.info(`Created new API key for user ${userId}: ${apiKey.name}`);

      return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        apiKey: apiKey.apiKey,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        usageCount: apiKey.usageCount,
        lastUsed: apiKey.lastUsed,
        webhookUrl: apiKey.webhookUrl,
        metadata: apiKey.metadata
      };
    } catch (error) {
      logger.error(`Error creating API key for user ${userId}:`, error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Validate API key and return associated data
   */
  async validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    userId?: string;
    permissions?: string[];
    keyData?: any;
  }> {
    try {
      const keyData = await SandboxApiKey.findByApiKey(apiKey);
      
      if (!keyData) {
        return { isValid: false };
      }

      if (!keyData.canMakeRequest()) {
        return { isValid: false };
      }

      // Update usage statistics
      await SandboxApiKey.updateUsage(apiKey);

      return {
        isValid: true,
        userId: keyData.userId,
        permissions: keyData.permissions,
        keyData: {
          id: keyData._id.toString(),
          name: keyData.name,
          permissions: keyData.permissions,
          rateLimit: keyData.rateLimit
        }
      };
    } catch (error) {
      logger.error(`Error validating API key:`, error);
      return { isValid: false };
    }
  }

  /**
   * Create a new checkout session
   */
  async createSession(request: CreateSessionRequest): Promise<SessionResponse> {
    try {
      // Validate API key
      const apiKeyData = await SandboxApiKey.findById(request.apiKeyId);
      if (!apiKeyData || !apiKeyData.canMakeRequest()) {
        throw new Error('Invalid or expired API key');
      }

      // Check permissions
      if (!apiKeyData.hasPermission('payments:write')) {
        throw new Error('Insufficient permissions to create payment sessions');
      }

      // Create session
      const session = new SandboxSession({
        userId: request.userId,
        apiKeyId: request.apiKeyId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        metadata: {
          source: request.metadata?.source || 'sandbox-checkout',
          tags: request.metadata?.tags || [],
          customFields: request.metadata?.customFields || {}
        },
        paymentConfig: {
          allowedPaymentMethods: request.paymentConfig?.allowedPaymentMethods || ['card'],
          requireCustomerEmail: request.paymentConfig?.requireCustomerEmail || false,
          requireCustomerName: request.paymentConfig?.requireCustomerName || false,
          autoCapture: request.paymentConfig?.autoCapture !== false,
          captureAmount: request.paymentConfig?.captureAmount
        },
        expiresAt: request.expiresIn 
          ? new Date(Date.now() + request.expiresIn * 60 * 1000)
          : new Date(Date.now() + 30 * 60 * 1000) // 30 minutes default
      });

      await session.save();

      logger.info(`Created sandbox session ${session.sessionId} for user ${request.userId}`);

      return {
        sessionId: session.sessionId,
        checkoutUrl: session.getCheckoutUrl(),
        amount: session.amount,
        currency: session.currency,
        description: session.description,
        status: session.status,
        expiresAt: session.expiresAt,
        metadata: session.metadata
      };
    } catch (error) {
      logger.error(`Error creating sandbox session for user ${request.userId}:`, error);
      throw error;
    }
  }

  /**
   * Get session details by session ID
   */
  async getSession(sessionId: string): Promise<SessionResponse | null> {
    try {
      const session = await SandboxSession.findBySessionId(sessionId);
      
      if (!session) {
        return null;
      }

      return {
        sessionId: session.sessionId,
        checkoutUrl: session.getCheckoutUrl(),
        amount: session.amount,
        currency: session.currency,
        description: session.description,
        status: session.status,
        expiresAt: session.expiresAt,
        metadata: session.metadata
      };
    } catch (error) {
      logger.error(`Error getting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Process payment for a session
   */
  async processPayment(sessionId: string, paymentData: {
    paymentMethod: string;
    customerEmail: string;
    customerName?: string;
    cardDetails?: any;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    status: string;
    message: string;
    redirectUrl?: string;
  }> {
    try {
      const session = await SandboxSession.findBySessionId(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.canBeProcessed()) {
        throw new Error('Session cannot be processed');
      }

      // Update session status to processing
      session.status = 'processing';
      await session.save();

      // Simulate payment processing
      const paymentResult = await this.paymentService.processPayment({
        sessionId: session.sessionId,
        amount: session.amount,
        currency: session.currency,
        paymentMethod: paymentData.paymentMethod,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        cardDetails: paymentData.cardDetails
      });

      if (paymentResult.success) {
        // Update session status
        session.status = 'completed';
        await session.save();

        // Create sandbox transaction record
        const transaction = new SandboxTransaction({
          transactionId: paymentResult.transactionId,
          userId: session.userId,
          amount: session.amount,
          currency: session.currency,
          status: 'successful',
          paymentMethod: paymentData.paymentMethod,
          customerEmail: paymentData.customerEmail,
          description: session.description,
          metadata: {
            isTest: true,
            sandboxMode: true,
            testTimestamp: Date.now(),
            sessionId: session.sessionId
          }
        });

        await transaction.save();

        // Send webhooks
        await this.webhookService.sendWebhooks(session.userId, 'payment.completed', {
          sessionId: session.sessionId,
          transactionId: paymentResult.transactionId,
          amount: session.amount,
          currency: session.currency,
          status: 'completed',
          customerEmail: paymentData.customerEmail
        });

        return {
          success: true,
          transactionId: paymentResult.transactionId,
          status: 'completed',
          message: 'Payment processed successfully',
          redirectUrl: '/checkout/success'
        };
      } else {
        // Update session status
        session.status = 'failed';
        session.failureReason = paymentResult.error;
        await session.save();

        // Send failure webhooks
        await this.webhookService.sendWebhooks(session.userId, 'payment.failed', {
          sessionId: session.sessionId,
          amount: session.amount,
          currency: session.currency,
          status: 'failed',
          error: paymentResult.error,
          customerEmail: paymentData.customerEmail
        });

        return {
          success: false,
          status: 'failed',
          message: paymentResult.error || 'Payment processing failed'
        };
      }
    } catch (error) {
      logger.error(`Error processing payment for session ${sessionId}:`, error);
      
      // Update session status to failed
      try {
        const session = await SandboxSession.findBySessionId(sessionId);
        if (session) {
          session.status = 'failed';
          session.failureReason = error instanceof Error ? error.message : 'Unknown error';
          await session.save();
        }
      } catch (updateError) {
        logger.error(`Error updating session status:`, updateError);
      }

      throw error;
    }
  }

  /**
   * Get user's sandbox statistics
   */
  async getUserStats(userId: string): Promise<{
    sessions: any;
    transactions: any;
    apiKeys: number;
    webhooks: number;
  }> {
    try {
      const [sessions, transactions, apiKeys, webhooks] = await Promise.all([
        SandboxSession.getUserStats(userId),
        SandboxTransaction.getUserStats(userId),
        SandboxApiKey.countDocuments({ userId, isActive: true }),
        SandboxWebhook.countDocuments({ userId, isActive: true })
      ]);

      return {
        sessions,
        transactions,
        apiKeys,
        webhooks
      };
    } catch (error) {
      logger.error(`Error getting stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's active API keys
   */
  async getUserApiKeys(userId: string): Promise<ApiKeyResponse[]> {
    try {
      const apiKeys = await SandboxApiKey.getUserKeys(userId);
      
      return apiKeys.map(key => ({
        id: key._id.toString(),
        name: key.name,
        apiKey: key.apiKey,
        permissions: key.permissions,
        isActive: key.isActive,
        expiresAt: key.expiresAt,
        usageCount: key.usageCount,
        lastUsed: key.lastUsed,
        webhookUrl: key.webhookUrl,
        metadata: key.metadata
      }));
    } catch (error) {
      logger.error(`Error getting API keys for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(apiKey: string): Promise<boolean> {
    try {
      const result = await SandboxApiKey.deactivateKey(apiKey);
      return !!result;
    } catch (error) {
      logger.error(`Error deactivating API key:`, error);
      throw error;
    }
  }
}

export default SandboxService;
