import { Types } from 'mongoose';
import Merchant from '../../models/Merchant';
import User from '../../models/User';
import Transaction from '../../models/Transaction';
import ApiKey from '../../models/ApiKey';
import { logger } from '../../utils/helpers/logger';

export interface MerchantData {
  businessName: string;
  businessEmail: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  taxId?: string;
  businessType?: string;
  description?: string;
  logo?: string;
  banner?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface MerchantResult {
  success: boolean;
  merchant?: any;
  message?: string;
  error?: string;
}

export interface MerchantStats {
  totalTransactions: number;
  totalRevenue: number;
  successRate: number;
  averageTransactionValue: number;
  monthlyGrowth: number;
}

/**
 * Merchant Service
 * Handles business profile management and merchant operations
 */
export class MerchantService {
  /**
   * Create merchant profile
   */
  static async createMerchant(userId: Types.ObjectId, data: MerchantData): Promise<MerchantResult> {
    try {
      // Check if merchant already exists for this user
      const existingMerchant = await Merchant.findOne({ userId });
      if (existingMerchant) {
        return {
          success: false,
          message: 'Merchant profile already exists for this user'
        };
      }

      // Create merchant profile
      const merchant = new Merchant({
        userId,
        ...data,
        isActive: true,
        status: 'active'
      });

      await merchant.save();

      logger.info('Merchant profile created successfully', {
        merchantId: merchant._id,
        userId,
        businessName: merchant.businessName
      });

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant profile created successfully'
      };

    } catch (error) {
      logger.error('Failed to create merchant profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Failed to create merchant profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get merchant profile
   */
  static async getMerchantProfile(merchantId: Types.ObjectId): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant profile retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get merchant profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get merchant profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get merchant by user ID
   */
  static async getMerchantByUserId(userId: Types.ObjectId): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant profile retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get merchant by user ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Failed to get merchant profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update merchant profile
   */
  static async updateMerchantProfile(
    merchantId: Types.ObjectId,
    updateData: Partial<MerchantData>
  ): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      logger.info('Merchant profile updated successfully', {
        merchantId: merchant._id,
        businessName: merchant.businessName
      });

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant profile updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update merchant profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to update merchant profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deactivate merchant account
   */
  static async deactivateMerchant(merchantId: Types.ObjectId): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        {
          isActive: false,
          status: 'inactive',
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      // Deactivate all API keys for this merchant
      await ApiKey.updateMany(
        { merchantId },
        { isActive: false, updatedAt: new Date() }
      );

      logger.info('Merchant account deactivated', {
        merchantId: merchant._id,
        businessName: merchant.businessName
      });

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant account deactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to deactivate merchant account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to deactivate merchant account',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reactivate merchant account
   */
  static async reactivateMerchant(merchantId: Types.ObjectId): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        {
          isActive: true,
          status: 'active',
          deactivatedAt: undefined,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      logger.info('Merchant account reactivated', {
        merchantId: merchant._id,
        businessName: merchant.businessName
      });

      return {
        success: true,
        merchant: merchant.toObject(),
        message: 'Merchant account reactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to reactivate merchant account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to reactivate merchant account',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get merchant statistics
   */
  static async getMerchantStats(merchantId: Types.ObjectId): Promise<MerchantStats> {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      // Get current month stats
      const currentMonthStats = await Transaction.aggregate([
        {
          $match: {
            merchantId,
            createdAt: { $gte: lastMonth },
            status: { $in: ['successful', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            averageTransactionValue: { $avg: '$amount' }
          }
        }
      ]);

      // Get previous month stats
      const previousMonthStats = await Transaction.aggregate([
        {
          $match: {
            merchantId,
            createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
            status: { $in: ['successful', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      // Get total transactions for success rate calculation
      const totalTransactions = await Transaction.countDocuments({
        merchantId,
        createdAt: { $gte: lastMonth }
      });

      const successfulTransactions = await Transaction.countDocuments({
        merchantId,
        createdAt: { $gte: lastMonth },
        status: { $in: ['successful', 'completed'] }
      });

      const currentStats = currentMonthStats[0] || {
        totalTransactions: 0,
        totalRevenue: 0,
        averageTransactionValue: 0
      };

      const previousStats = previousMonthStats[0] || {
        totalTransactions: 0,
        totalRevenue: 0
      };

      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
      const monthlyGrowth = previousStats.totalRevenue > 0 
        ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100 
        : 0;

      const stats: MerchantStats = {
        totalTransactions: currentStats.totalTransactions,
        totalRevenue: currentStats.totalRevenue,
        successRate: Math.round(successRate * 100) / 100,
        averageTransactionValue: Math.round(currentStats.averageTransactionValue * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      };

      logger.debug('Merchant statistics retrieved', {
        merchantId,
        stats
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get merchant statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        totalTransactions: 0,
        totalRevenue: 0,
        successRate: 0,
        averageTransactionValue: 0,
        monthlyGrowth: 0
      };
    }
  }

  /**
   * Get all merchants with pagination
   */
  static async getAllMerchants(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      industry?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{
    merchants: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.industry) query.industry = filters.industry;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      const [merchants, total] = await Promise.all([
        Merchant.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Merchant.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Merchants retrieved', {
        page,
        limit,
        total,
        totalPages
      });

      return {
        merchants,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to get all merchants', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        merchants: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  /**
   * Search merchants
   */
  static async searchMerchants(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    merchants: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(searchTerm, 'i');

      const query = {
        $or: [
          { businessName: searchRegex },
          { businessEmail: searchRegex },
          { industry: searchRegex }
        ]
      };

      const [merchants, total] = await Promise.all([
        Merchant.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Merchant.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Merchants search completed', {
        searchTerm,
        page,
        limit,
        total,
        totalPages
      });

      return {
        merchants,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to search merchants', {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchTerm
      });

      return {
        merchants: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  /**
   * Delete merchant profile
   */
  static async deleteMerchant(merchantId: Types.ObjectId): Promise<MerchantResult> {
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return {
          success: false,
          message: 'Merchant profile not found'
        };
      }

      // Check if merchant has active transactions
      const activeTransactions = await Transaction.countDocuments({
        merchantId,
        status: { $in: ['pending', 'processing'] }
      });

      if (activeTransactions > 0) {
        return {
          success: false,
          message: 'Cannot delete merchant with active transactions'
        };
      }

      // Delete API keys
      await ApiKey.deleteMany({ merchantId });

      // Delete merchant profile
      await Merchant.findByIdAndDelete(merchantId);

      logger.info('Merchant profile deleted', {
        merchantId,
        businessName: merchant.businessName
      });

      return {
        success: true,
        message: 'Merchant profile deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete merchant profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to delete merchant profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default MerchantService; 