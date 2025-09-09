import { Request, Response } from 'express';
import { ApiKey, Merchant } from '../../models';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface CreateApiKeyRequest {
  name: string;
  type: 'public' | 'secret' | 'test';
  permissions: string[];
  restrictions?: {
    ipWhitelist?: string[];
    rateLimit?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
    allowedEndpoints?: string[];
    blockedEndpoints?: string[];
  };
  expiresAt?: string;
}

interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  restrictions?: {
    ipWhitelist?: string[];
    rateLimit?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
    allowedEndpoints?: string[];
    blockedEndpoints?: string[];
  };
  expiresAt?: string;
}

// Response interfaces
interface ApiKeyResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ApiKeyController {
  /**
   * Create new API key
   * POST /api/v1/merchant/api-keys
   */
  static async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        name,
        type,
        permissions,
        restrictions,
        expiresAt
      }: CreateApiKeyRequest = req.body;

      // Validate merchant
      const merchant = await Merchant.findById(merchantId);
      if (!merchant || !merchant.isActive) {
        res.status(400).json({
          success: false,
          error: 'Invalid merchant',
          message: 'Invalid or inactive merchant account'
        });
        return;
      }

      // Validate permissions
      const validPermissions = [
        'transactions.read',
        'transactions.write',
        'transactions.refund',
        'merchants.read',
        'merchants.write',
        'webhooks.read',
        'webhooks.write',
        'analytics.read',
        'subscriptions.read',
        'subscriptions.write',
        'customers.read',
        'customers.write'
      ];

      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
        return;
      }

      // Create API key
      const apiKey = new ApiKey({
        merchantId,
        name,
        type,
        permissions,
        restrictions,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      await apiKey.save();

      logger.info(`API key created: ${apiKey.name} for merchant: ${merchantId}`);

      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            type: apiKey.type,
            permissions: apiKey.permissions,
            restrictions: apiKey.restrictions,
            isActive: apiKey.isActive,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
            // Only return the actual key on creation
            key: apiKey.key,
            secret: apiKey.secret
          }
        }
      });
    } catch (error) {
      logger.error('Create API key error:', error);
      res.status(500).json({
        success: false,
        error: 'API key creation failed',
        message: 'An error occurred while creating the API key'
      });
    }
  }

  /**
   * List API keys
   * GET /api/v1/merchant/api-keys
   */
  static async listApiKeys(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { type, isActive } = req.query;

      // Build query
      const query: any = { merchantId };
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const apiKeys = await ApiKey.find(query).sort({ createdAt: -1 });

      logger.info(`API keys listed for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'API keys retrieved successfully',
        data: {
          apiKeys: apiKeys.map(key => ({
            id: key._id,
            name: key.name,
            type: key.type,
            permissions: key.permissions,
            restrictions: key.restrictions,
            isActive: key.isActive,
            isRevoked: key.isRevoked,
            expiresAt: key.expiresAt,
            lastUsedAt: key.lastUsedAt,
            usageStats: key.usageStats,
            createdAt: key.createdAt
          }))
        }
      });
    } catch (error) {
      logger.error('List API keys error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve API keys',
        message: 'An error occurred while retrieving API keys'
      });
    }
  }

  /**
   * Get API key by ID
   * GET /api/v1/merchant/api-keys/:id
   */
  static async getApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const apiKey = await ApiKey.findOne({
        _id: id,
        merchantId
      });

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'API key not found',
          message: 'API key not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'API key retrieved successfully',
        data: {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            type: apiKey.type,
            permissions: apiKey.permissions,
            restrictions: apiKey.restrictions,
            isActive: apiKey.isActive,
            isRevoked: apiKey.isRevoked,
            expiresAt: apiKey.expiresAt,
            lastUsedAt: apiKey.lastUsedAt,
            usageStats: apiKey.usageStats,
            createdAt: apiKey.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Get API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve API key',
        message: 'An error occurred while retrieving the API key'
      });
    }
  }

  /**
   * Update API key
   * PUT /api/v1/merchant/api-keys/:id
   */
  static async updateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        name,
        permissions,
        restrictions,
        expiresAt
      }: UpdateApiKeyRequest = req.body;

      const apiKey = await ApiKey.findOne({
        _id: id,
        merchantId
      });

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'API key not found',
          message: 'API key not found'
        });
        return;
      }

      // Update fields
      if (name) apiKey.name = name;
      if (permissions) apiKey.permissions = permissions;
      if (restrictions) {
        if (restrictions.ipWhitelist) apiKey.restrictions.ipWhitelist = restrictions.ipWhitelist;
        if (restrictions.rateLimit) {
          // Ensure all rate limit properties are provided with defaults
          apiKey.restrictions.rateLimit = {
            requestsPerMinute: restrictions.rateLimit.requestsPerMinute || 60,
            requestsPerHour: restrictions.rateLimit.requestsPerHour || 1000,
            requestsPerDay: restrictions.rateLimit.requestsPerDay || 10000
          };
        }
        if (restrictions.allowedEndpoints) apiKey.restrictions.allowedEndpoints = restrictions.allowedEndpoints;
        if (restrictions.blockedEndpoints) apiKey.restrictions.blockedEndpoints = restrictions.blockedEndpoints;
      }
      if (expiresAt) apiKey.expiresAt = new Date(expiresAt);

      await apiKey.save();

      logger.info(`API key updated: ${apiKey.name}`);

      res.status(200).json({
        success: true,
        message: 'API key updated successfully',
        data: {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            type: apiKey.type,
            permissions: apiKey.permissions,
            restrictions: apiKey.restrictions,
            isActive: apiKey.isActive,
            expiresAt: apiKey.expiresAt
          }
        }
      });
    } catch (error) {
      logger.error('Update API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update API key',
        message: 'An error occurred while updating the API key'
      });
    }
  }

  /**
   * Revoke API key
   * POST /api/v1/merchant/api-keys/:id/revoke
   */
  static async revokeApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const apiKey = await ApiKey.findOne({
        _id: id,
        merchantId
      });

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'API key not found',
          message: 'API key not found'
        });
        return;
      }

      if (apiKey.isRevoked) {
        res.status(400).json({
          success: false,
          error: 'API key already revoked',
          message: 'API key is already revoked'
        });
        return;
      }

      await (apiKey as any).revoke();

      logger.info(`API key revoked: ${apiKey.name}`);

      res.status(200).json({
        success: true,
        message: 'API key revoked successfully'
      });
    } catch (error) {
      logger.error('Revoke API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke API key',
        message: 'An error occurred while revoking the API key'
      });
    }
  }

  /**
   * Reactivate API key
   * POST /api/v1/merchant/api-keys/:id/reactivate
   */
  static async reactivateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const apiKey = await ApiKey.findOne({
        _id: id,
        merchantId
      });

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'API key not found',
          message: 'API key not found'
        });
        return;
      }

      if (!apiKey.isRevoked) {
        res.status(400).json({
          success: false,
          error: 'API key not revoked',
          message: 'API key is not revoked'
        });
        return;
      }

      await (apiKey as any).reactivate();

      logger.info(`API key reactivated: ${apiKey.name}`);

      res.status(200).json({
        success: true,
        message: 'API key reactivated successfully'
      });
    } catch (error) {
      logger.error('Reactivate API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate API key',
        message: 'An error occurred while reactivating the API key'
      });
    }
  }

  /**
   * Get API key statistics
   * GET /api/v1/merchant/api-keys/stats
   */
  static async getApiKeyStats(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const stats = await (ApiKey as any).getStats(merchantId);

      logger.info(`API key stats retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'API key statistics retrieved successfully',
        data: {
          stats: stats[0] || {
            totalKeys: 0,
            activeKeys: 0,
            revokedKeys: 0,
            totalRequests: 0,
            totalSuccess: 0,
            totalFailures: 0
          }
        }
      });
    } catch (error) {
      logger.error('Get API key stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get API key statistics',
        message: 'An error occurred while retrieving API key statistics'
      });
    }
  }

  /**
   * Validate API key
   * POST /api/v1/merchant/api-keys/validate
   */
  static async validateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.body;

      if (!key) {
        res.status(400).json({
          success: false,
          error: 'API key required',
          message: 'API key is required'
        });
        return;
      }

      const apiKey = await (ApiKey as any).findByKey(key);

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'Invalid API key',
          message: 'API key not found'
        });
        return;
      }

      if (!apiKey.isActive || apiKey.isRevoked) {
        res.status(401).json({
          success: false,
          error: 'API key inactive',
          message: 'API key is inactive or revoked'
        });
        return;
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        res.status(401).json({
          success: false,
          error: 'API key expired',
          message: 'API key has expired'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'API key is valid',
        data: {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            type: apiKey.type,
            permissions: apiKey.permissions,
            isActive: apiKey.isActive,
            expiresAt: apiKey.expiresAt
          }
        }
      });
    } catch (error) {
      logger.error('Validate API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate API key',
        message: 'An error occurred while validating the API key'
      });
    }
  }
}

export default ApiKeyController; 