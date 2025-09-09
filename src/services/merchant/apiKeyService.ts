import crypto from 'crypto';
import { Types } from 'mongoose';
import ApiKey from '../../models/ApiKey';
import Merchant from '../../models/Merchant';
import { logger } from '../../utils/helpers/logger';

export interface ApiKeyData {
  name: string;
  description?: string;
  permissions: string[];
  expiresAt?: Date;
}

export interface ApiKeyResult {
  success: boolean;
  apiKey?: any;
  secretKey?: string;
  message?: string;
  error?: string;
}

export interface ApiKeyValidation {
  isValid: boolean;
  apiKey?: any;
  merchant?: any;
  message?: string;
}

/**
 * API Key Service
 * Handles API key generation, validation, and management
 */
export class ApiKeyService {
  private static readonly KEY_PREFIX = 'tl_';
  private static readonly SECRET_PREFIX = 'tlsk_';

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    try {
      const randomBytes = crypto.randomBytes(32);
      const apiKey = this.KEY_PREFIX + randomBytes.toString('base64url');
      
      logger.debug('API key generated');
      
      return apiKey;
    } catch (error) {
      logger.error('Failed to generate API key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate secret key
   */
  static generateSecretKey(): string {
    try {
      const randomBytes = crypto.randomBytes(64);
      const secretKey = this.SECRET_PREFIX + randomBytes.toString('base64url');
      
      logger.debug('Secret key generated');
      
      return secretKey;
    } catch (error) {
      logger.error('Failed to generate secret key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create API key
   */
  static async createApiKey(
    merchantId: Types.ObjectId,
    data: ApiKeyData
  ): Promise<ApiKeyResult> {
    try {
      // Verify merchant exists and is active
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return {
          success: false,
          message: 'Merchant not found'
        };
      }

      if (!merchant.isActive) {
        return {
          success: false,
          message: 'Merchant account is not active'
        };
      }

      // Generate API key and secret
      const apiKey = this.generateApiKey();
      const secretKey = this.generateSecretKey();

      // Hash the secret key for storage
      const hashedSecretKey = crypto.createHash('sha256').update(secretKey).digest('hex');

      // Create API key record
      const apiKeyRecord = new ApiKey({
        merchantId,
        name: data.name,
        description: data.description,
        key: apiKey,
        secretKey: hashedSecretKey,
        permissions: data.permissions,
        expiresAt: data.expiresAt,
        isActive: true
      });

      await apiKeyRecord.save();

      logger.info('API key created successfully', {
        apiKeyId: apiKeyRecord._id,
        merchantId,
        name: data.name
      });

      return {
        success: true,
        apiKey: apiKeyRecord.toObject(),
        secretKey, // Return the unhashed secret key only once
        message: 'API key created successfully'
      };

    } catch (error) {
      logger.error('Failed to create API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to create API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string): Promise<ApiKeyValidation> {
    try {
      const apiKeyRecord = await ApiKey.findOne({
        key: apiKey,
        isActive: true
      });

      if (!apiKeyRecord) {
        return {
          isValid: false,
          message: 'Invalid API key'
        };
      }

      // Check if API key is expired
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return {
          isValid: false,
          message: 'API key has expired'
        };
      }

      // Get merchant information
      const merchant = await Merchant.findById(apiKeyRecord.merchantId);
      if (!merchant || !merchant.isActive) {
        return {
          isValid: false,
          message: 'Merchant account is not active'
        };
      }

      logger.debug('API key validated successfully', {
        apiKeyId: apiKeyRecord._id,
        merchantId: apiKeyRecord.merchantId
      });

      return {
        isValid: true,
        apiKey: apiKeyRecord.toObject(),
        merchant: merchant.toObject()
      };

    } catch (error) {
      logger.error('Failed to validate API key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        message: 'Failed to validate API key'
      };
    }
  }

  /**
   * Validate secret key
   */
  static async validateSecretKey(apiKey: string, secretKey: string): Promise<ApiKeyValidation> {
    try {
      const apiKeyRecord = await ApiKey.findOne({
        key: apiKey,
        isActive: true
      });

      if (!apiKeyRecord) {
        return {
          isValid: false,
          message: 'Invalid API key'
        };
      }

      // Hash the provided secret key
      const hashedSecretKey = crypto.createHash('sha256').update(secretKey).digest('hex');

      // Compare with stored hash
      if (apiKeyRecord.secret !== hashedSecretKey) {
        return {
          isValid: false,
          message: 'Invalid secret key'
        };
      }

      // Check if API key is expired
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return {
          isValid: false,
          message: 'API key has expired'
        };
      }

      // Get merchant information
      const merchant = await Merchant.findById(apiKeyRecord.merchantId);
      if (!merchant || !merchant.isActive) {
        return {
          isValid: false,
          message: 'Merchant account is not active'
        };
      }

      logger.debug('Secret key validated successfully', {
        apiKeyId: apiKeyRecord._id,
        merchantId: apiKeyRecord.merchantId
      });

      return {
        isValid: true,
        apiKey: apiKeyRecord.toObject(),
        merchant: merchant.toObject()
      };

    } catch (error) {
      logger.error('Failed to validate secret key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        message: 'Failed to validate secret key'
      };
    }
  }

  /**
   * Get API keys for merchant
   */
  static async getMerchantApiKeys(
    merchantId: Types.ObjectId,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    apiKeys: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [apiKeys, total] = await Promise.all([
        ApiKey.find({ merchantId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ApiKey.countDocuments({ merchantId })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Remove secret key from response
      const sanitizedApiKeys = apiKeys.map(key => {
        const { secret, ...sanitizedKey } = key;
        return sanitizedKey;
      });

      logger.debug('API keys retrieved for merchant', {
        merchantId,
        page,
        limit,
        total,
        totalPages
      });

      return {
        apiKeys: sanitizedApiKeys,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to get merchant API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        apiKeys: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  /**
   * Get API key by ID
   */
  static async getApiKeyById(apiKeyId: Types.ObjectId): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findById(apiKeyId);
      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      // Remove secret key from response
      const { secret, ...sanitizedApiKey } = apiKey.toObject();

      return {
        success: true,
        apiKey: sanitizedApiKey,
        message: 'API key retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get API key by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to get API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update API key
   */
  static async updateApiKey(
    apiKeyId: Types.ObjectId,
    updateData: Partial<{
      name: string;
      description: string;
      permissions: string[];
      expiresAt: Date;
    }>
  ): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findByIdAndUpdate(
        apiKeyId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      // Remove secret key from response
      const { secret, ...sanitizedApiKey } = apiKey.toObject();

      logger.info('API key updated successfully', {
        apiKeyId: apiKey._id,
        merchantId: apiKey.merchantId
      });

      return {
        success: true,
        apiKey: sanitizedApiKey,
        message: 'API key updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to update API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deactivate API key
   */
  static async deactivateApiKey(apiKeyId: Types.ObjectId): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findByIdAndUpdate(
        apiKeyId,
        {
          isActive: false,
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      // Remove secret key from response
      const { secret, ...sanitizedApiKey } = apiKey.toObject();

      logger.info('API key deactivated', {
        apiKeyId: apiKey._id,
        merchantId: apiKey.merchantId
      });

      return {
        success: true,
        apiKey: sanitizedApiKey,
        message: 'API key deactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to deactivate API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to deactivate API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reactivate API key
   */
  static async reactivateApiKey(apiKeyId: Types.ObjectId): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findByIdAndUpdate(
        apiKeyId,
        {
          isActive: true,
          deactivatedAt: undefined,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      // Remove secret key from response
      const { secret, ...sanitizedApiKey } = apiKey.toObject();

      logger.info('API key reactivated', {
        apiKeyId: apiKey._id,
        merchantId: apiKey.merchantId
      });

      return {
        success: true,
        apiKey: sanitizedApiKey,
        message: 'API key reactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to reactivate API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to reactivate API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(apiKeyId: Types.ObjectId): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findByIdAndDelete(apiKeyId);
      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      logger.info('API key deleted', {
        apiKeyId: apiKey._id,
        merchantId: apiKey.merchantId
      });

      return {
        success: true,
        message: 'API key deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to delete API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Regenerate secret key
   */
  static async regenerateSecretKey(apiKeyId: Types.ObjectId): Promise<ApiKeyResult> {
    try {
      const apiKey = await ApiKey.findById(apiKeyId);
      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      // Generate new secret key
      const newSecretKey = this.generateSecretKey();
      const hashedSecretKey = crypto.createHash('sha256').update(newSecretKey).digest('hex');

      // Update the API key
      apiKey.secret = hashedSecretKey;
      apiKey.updatedAt = new Date();
      await apiKey.save();

      logger.info('Secret key regenerated', {
        apiKeyId: apiKey._id,
        merchantId: apiKey.merchantId
      });

      return {
        success: true,
        secretKey: newSecretKey, // Return the new unhashed secret key
        message: 'Secret key regenerated successfully'
      };

    } catch (error) {
      logger.error('Failed to regenerate secret key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId
      });

      return {
        success: false,
        message: 'Failed to regenerate secret key',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check API key permissions
   */
  static async checkApiKeyPermissions(
    apiKey: string,
    requiredPermissions: string[]
  ): Promise<{
    hasPermission: boolean;
    message?: string;
  }> {
    try {
      const apiKeyRecord = await ApiKey.findOne({
        key: apiKey,
        isActive: true
      });

      if (!apiKeyRecord) {
        return {
          hasPermission: false,
          message: 'Invalid API key'
        };
      }

      // Check if API key has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        apiKeyRecord.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return {
          hasPermission: false,
          message: 'Insufficient permissions'
        };
      }

      return {
        hasPermission: true
      };

    } catch (error) {
      logger.error('Failed to check API key permissions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        hasPermission: false,
        message: 'Failed to check permissions'
      };
    }
  }
}

export default ApiKeyService; 