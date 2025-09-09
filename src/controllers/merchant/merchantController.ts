import { Request, Response } from 'express';
import { Merchant, User } from '../../models';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface CreateMerchantRequest {
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  industry: string;
  description?: string;
  website?: string;
  currencies: string[];
  paymentMethods: string[];
}

interface UpdateMerchantRequest {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  industry?: string;
  description?: string;
  website?: string;
  logo?: string;
  currencies?: string[];
  paymentMethods?: string[];
  settings?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      webhook?: boolean;
    };
    security?: {
      twoFactorEnabled?: boolean;
      ipWhitelist?: string[];
      requireCvv?: boolean;
    };
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      customCss?: string;
    };
  };
}

// Response interfaces
interface MerchantResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class MerchantController {
  /**
   * Create merchant profile
   * POST /api/v1/merchant/profile
   */
  static async createMerchant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const {
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
        industry,
        description,
        website,
        currencies,
        paymentMethods
      }: CreateMerchantRequest = req.body;

      // Check if user already has a merchant profile
      const existingMerchant = await Merchant.findOne({ userId });
      if (existingMerchant) {
        res.status(400).json({
          success: false,
          error: 'Merchant profile already exists',
          message: 'You already have a merchant profile'
        });
        return;
      }

      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Create merchant profile
      const merchant = new Merchant({
        userId,
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
        industry,
        description,
        website,
        currencies,
        paymentMethods,
        isActive: true,
        isVerified: false // Will be verified through separate process
      });

      await merchant.save();

      logger.info(`Merchant profile created: ${merchant.businessName} for user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Merchant profile created successfully',
        data: {
          merchant: {
            id: merchant._id,
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            industry: merchant.industry,
            isActive: merchant.isActive,
            isVerified: merchant.isVerified,
            createdAt: merchant.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Create merchant error:', error);
      res.status(500).json({
        success: false,
        error: 'Merchant profile creation failed',
        message: 'An error occurred while creating the merchant profile'
      });
    }
  }

  /**
   * Get merchant profile
   * GET /api/v1/merchant/profile
   */
  static async getMerchantProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId }).populate('userId', 'firstName lastName email');

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Merchant profile retrieved successfully',
        data: {
          merchant: {
            id: merchant._id,
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            businessPhone: merchant.businessPhone,
            businessAddress: merchant.businessAddress,
            industry: merchant.industry,
            description: merchant.description,
            website: merchant.website,
            logo: merchant.logo,
            currencies: merchant.currencies,
            paymentMethods: merchant.paymentMethods,
            isActive: merchant.isActive,
            isVerified: merchant.isVerified,
            settings: merchant.settings,
            user: merchant.userId ? {
              id: (merchant.userId as any)._id,
              name: `${(merchant.userId as any).firstName} ${(merchant.userId as any).lastName}`,
              email: (merchant.userId as any).email
            } : null,
            createdAt: merchant.createdAt,
            updatedAt: merchant.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Get merchant profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve merchant profile',
        message: 'An error occurred while retrieving the merchant profile'
      });
    }
  }

  /**
   * Update merchant profile
   * PUT /api/v1/merchant/profile
   */
  static async updateMerchantProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const {
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
        industry,
        description,
        website,
        logo,
        currencies,
        paymentMethods,
        settings
      }: UpdateMerchantRequest = req.body;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // Update fields
      if (businessName) merchant.businessName = businessName;
      if (businessEmail) merchant.businessEmail = businessEmail;
      if (businessPhone) merchant.businessPhone = businessPhone;
      if (businessAddress) merchant.businessAddress = businessAddress;
      if (industry) merchant.industry = industry;
      if (description) merchant.description = description;
      if (website) merchant.website = website;
      if (logo) merchant.logo = logo;
      if (currencies) merchant.currencies = currencies;
      if (paymentMethods) merchant.paymentMethods = paymentMethods;
      if (settings) {
        if (settings.notifications) {
          merchant.settings.notifications = { ...merchant.settings.notifications, ...settings.notifications };
        }
        if (settings.security) {
          merchant.settings.security = { ...merchant.settings.security, ...settings.security };
        }
        if (settings.branding) {
          merchant.settings.branding = { ...merchant.settings.branding, ...settings.branding };
        }
      }

      await merchant.save();

      logger.info(`Merchant profile updated: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Merchant profile updated successfully',
        data: {
          merchant: {
            id: merchant._id,
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            industry: merchant.industry,
            isActive: merchant.isActive,
            isVerified: merchant.isVerified,
            settings: merchant.settings
          }
        }
      });
    } catch (error) {
      logger.error('Update merchant profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update merchant profile',
        message: 'An error occurred while updating the merchant profile'
      });
    }
  }

  /**
   * Upload merchant logo
   * POST /api/v1/merchant/logo
   */
  static async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { logoUrl } = req.body;

      if (!logoUrl) {
        res.status(400).json({
          success: false,
          error: 'Logo URL required',
          message: 'Logo URL is required'
        });
        return;
      }

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      merchant.logo = logoUrl;
      await merchant.save();

      logger.info(`Merchant logo updated: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logo: merchant.logo
        }
      });
    } catch (error) {
      logger.error('Upload logo error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload logo',
        message: 'An error occurred while uploading the logo'
      });
    }
  }

  /**
   * Get merchant statistics
   * GET /api/v1/merchant/stats
   */
  static async getMerchantStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // Get transaction statistics
      const transactionStats = await (Merchant as any).getStats(merchant._id);

      res.status(200).json({
        success: true,
        message: 'Merchant statistics retrieved successfully',
        data: {
          merchant: {
            id: merchant._id,
            businessName: merchant.businessName,
            isActive: merchant.isActive,
            isVerified: merchant.isVerified,
            transactionVolume: merchant.transactionVolume,
            totalTransactions: merchant.totalTransactions,
            successRate: merchant.successRate,
            averageTransactionValue: merchant.averageTransactionValue,
            lastTransactionAt: merchant.lastTransactionAt
          },
          statistics: {
            transactionStats,
            limits: {
              monthlyTransactionLimit: merchant.monthlyTransactionLimit,
              dailyTransactionLimit: merchant.dailyTransactionLimit
            }
          }
        }
      });
    } catch (error) {
      logger.error('Get merchant stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve merchant statistics',
        message: 'An error occurred while retrieving merchant statistics'
      });
    }
  }

  /**
   * Update merchant limits
   * PUT /api/v1/merchant/limits
   */
  static async updateMerchantLimits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { limits }: { limits: any } = req.body;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // Update limits
      if (limits.monthlyTransactionLimit) {
        merchant.monthlyTransactionLimit = limits.monthlyTransactionLimit;
      }
      if (limits.dailyTransactionLimit) {
        merchant.dailyTransactionLimit = limits.dailyTransactionLimit;
      }

      await merchant.save();

      logger.info(`Merchant limits updated: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Merchant limits updated successfully',
        data: {
          limits: {
            monthlyTransactionLimit: merchant.monthlyTransactionLimit,
            dailyTransactionLimit: merchant.dailyTransactionLimit
          }
        }
      });
    } catch (error) {
      logger.error('Update merchant limits error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update merchant limits',
        message: 'An error occurred while updating merchant limits'
      });
    }
  }

  /**
   * Deactivate merchant account
   * POST /api/v1/merchant/deactivate
   */
  static async deactivateMerchant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      merchant.isActive = false;
      await merchant.save();

      logger.info(`Merchant account deactivated: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Merchant account deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate merchant error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate merchant account',
        message: 'An error occurred while deactivating the merchant account'
      });
    }
  }

  /**
   * Reactivate merchant account
   * POST /api/v1/merchant/reactivate
   */
  static async reactivateMerchant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      merchant.isActive = true;
      await merchant.save();

      logger.info(`Merchant account reactivated: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Merchant account reactivated successfully'
      });
    } catch (error) {
      logger.error('Reactivate merchant error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate merchant account',
        message: 'An error occurred while reactivating the merchant account'
      });
    }
  }

  /**
   * Submit merchant verification documents
   * POST /api/v1/merchant/verify
   */
  static async submitVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { documents } = req.body;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // Update verification documents
      if (documents) {
        merchant.verificationDocuments = documents;
      }

      // Mark as verified if documents are provided
      if (documents && documents.length > 0) {
        merchant.isVerified = true;
      }

      await merchant.save();

      logger.info(`Merchant verification submitted: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Verification documents submitted successfully',
        data: {
          isVerified: merchant.isVerified,
          verificationDocuments: merchant.verificationDocuments
        }
      });
    } catch (error) {
      logger.error('Submit verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit verification',
        message: 'An error occurred while submitting verification'
      });
    }
  }

  /**
   * Get merchant onboarding status
   * GET /api/v1/merchant/onboarding-status
   */
  static async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // Calculate onboarding progress
      const steps = [
        { id: "profile", isCompleted: !!merchant.businessName },
        { id: "address", isCompleted: !!merchant.businessAddress },
        { id: "payment", isCompleted: !!(merchant.currencies?.length && merchant.paymentMethods?.length) },
        { id: "verification", isCompleted: merchant.isVerified || false },
      ];

      const completedSteps = steps.filter(step => step.isCompleted).map(step => step.id);
      const currentStep = completedSteps.length + 1;
      const isComplete = completedSteps.length === steps.length;

      res.status(200).json({
        success: true,
        message: 'Onboarding status retrieved successfully',
        data: {
          currentStep,
          totalSteps: steps.length,
          completedSteps,
          isComplete,
          merchant: {
            id: merchant._id,
            businessName: merchant.businessName,
            isActive: merchant.isActive,
            isVerified: merchant.isVerified
          }
        }
      });
    } catch (error) {
      logger.error('Get onboarding status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve onboarding status',
        message: 'An error occurred while retrieving onboarding status'
      });
    }
  }

  /**
   * Get merchant payment methods
   * GET /api/v1/merchant/payment-methods
   */
  static async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: {
          paymentMethods: merchant.paymentMethods || []
        }
      });
    } catch (error) {
      logger.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment methods',
        message: 'An error occurred while retrieving payment methods'
      });
    }
  }

  /**
   * Add payment method to merchant
   * POST /api/v1/merchant/payment-methods
   */
  static async addPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { paymentMethod } = req.body;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      if (!merchant.paymentMethods.includes(paymentMethod)) {
        merchant.paymentMethods.push(paymentMethod);
        await merchant.save();
      }

      logger.info(`Payment method added to merchant: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Payment method added successfully',
        data: {
          paymentMethods: merchant.paymentMethods
        }
      });
    } catch (error) {
      logger.error('Add payment method error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add payment method',
        message: 'An error occurred while adding payment method'
      });
    }
  }

  /**
   * Update merchant payment method
   * PUT /api/v1/merchant/payment-methods/:id
   */
  static async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { id } = req.params;
      const { paymentMethod } = req.body;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // For now, just update the entire payment methods array
      // In a real implementation, you might want to update specific payment method configurations
      if (paymentMethod && !merchant.paymentMethods.includes(paymentMethod)) {
        merchant.paymentMethods = [paymentMethod];
        await merchant.save();
      }

      logger.info(`Payment method updated for merchant: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Payment method updated successfully',
        data: {
          paymentMethods: merchant.paymentMethods
        }
      });
    } catch (error) {
      logger.error('Update payment method error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment method',
        message: 'An error occurred while updating payment method'
      });
    }
  }

  /**
   * Delete merchant payment method
   * DELETE /api/v1/merchant/payment-methods/:id
   */
  static async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { id } = req.params;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // For now, just clear all payment methods
      // In a real implementation, you might want to remove specific payment methods
      merchant.paymentMethods = [];
      await merchant.save();

      logger.info(`Payment methods cleared for merchant: ${merchant.businessName}`);

      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully',
        data: {
          paymentMethods: merchant.paymentMethods
        }
      });
    } catch (error) {
      logger.error('Delete payment method error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete payment method',
        message: 'An error occurred while deleting payment method'
      });
    }
  }

  /**
   * Get merchant analytics
   * GET /api/v1/merchant/analytics
   */
  static async getMerchantAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { period = '30d' } = req.query;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // For now, return basic analytics
      // In a real implementation, you would aggregate transaction data
      res.status(200).json({
        success: true,
        message: 'Merchant analytics retrieved successfully',
        data: {
          analytics: {
            period,
            transactionVolume: merchant.transactionVolume,
            totalTransactions: merchant.totalTransactions,
            successRate: merchant.successRate,
            averageTransactionValue: merchant.averageTransactionValue,
            lastTransactionAt: merchant.lastTransactionAt
          }
        }
      });
    } catch (error) {
      logger.error('Get merchant analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve merchant analytics',
        message: 'An error occurred while retrieving merchant analytics'
      });
    }
  }

  /**
   * Get merchant transaction statistics
   * GET /api/v1/merchant/transaction-stats
   */
  static async getTransactionStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { period = '30d' } = req.query;

      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant profile not found',
          message: 'Merchant profile not found'
        });
        return;
      }

      // For now, return basic transaction stats
      // In a real implementation, you would aggregate transaction data by period
      res.status(200).json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: {
          stats: {
            period,
            transactionVolume: merchant.transactionVolume,
            totalTransactions: merchant.totalTransactions,
            successRate: merchant.successRate,
            averageTransactionValue: merchant.averageTransactionValue,
            lastTransactionAt: merchant.lastTransactionAt
          }
        }
      });
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction statistics',
        message: 'An error occurred while retrieving transaction statistics'
      });
    }
  }
}

export default MerchantController; 