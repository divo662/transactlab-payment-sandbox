import { Request, Response } from 'express';
import paymentHubService from '../../services/payment/paymentHubService';
import { ResponseHelper } from '../../utils/helpers/responseHelper';
import { logger } from '../../utils/helpers/logger';
import Merchant from '../../models/Merchant';

class PaymentHubController {
  // Payment Channel Endpoints
  async createPaymentChannel(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const channelData = req.body;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const paymentChannel = await paymentHubService.createPaymentChannel({
        ...channelData,
        merchantId
      });

      logger.info(`Payment channel created: ${paymentChannel.id} for merchant: ${merchantId}`);
      return ResponseHelper.created(res, paymentChannel, 'Payment channel created successfully');
    } catch (error) {
      logger.error('Error creating payment channel:', error);
      return ResponseHelper.internalServerError(res, 'Failed to create payment channel', error.message);
    }
  }

  async getPaymentChannels(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { type, isActive } = req.query;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const filters: any = {};
      if (type) filters.type = type;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const channels = await paymentHubService.getPaymentChannels(merchantId, filters);
      return ResponseHelper.success(res, channels, 'Payment channels retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving payment channels:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment channels', error.message);
    }
  }

  async getPaymentChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const channel = await paymentHubService.getPaymentChannel(channelId);

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(channel.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      return ResponseHelper.success(res, channel, 'Payment channel retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving payment channel:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment channel', error.message);
    }
  }

  async updatePaymentChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const updateData = req.body;

      const channel = await paymentHubService.getPaymentChannel(channelId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(channel.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const updatedChannel = await paymentHubService.updatePaymentChannel(channelId, updateData);
      
      logger.info(`Payment channel updated: ${channelId}`);
      return ResponseHelper.success(res, updatedChannel, 'Payment channel updated successfully');
    } catch (error) {
      logger.error('Error updating payment channel:', error);
      return ResponseHelper.internalServerError(res, 'Failed to update payment channel', error.message);
    }
  }

  async deletePaymentChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.params;

      const channel = await paymentHubService.getPaymentChannel(channelId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(channel.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      await paymentHubService.deletePaymentChannel(channelId);
      
      logger.info(`Payment channel deleted: ${channelId}`);
      return ResponseHelper.success(res, null, 'Payment channel deleted successfully');
    } catch (error) {
      logger.error('Error deleting payment channel:', error);
      return ResponseHelper.internalServerError(res, 'Failed to delete payment channel', error.message);
    }
  }

  // Product Endpoints
  async createProduct(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const productData = req.body;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const product = await paymentHubService.createProduct({
        ...productData,
        merchantId
      });

      logger.info(`Product created: ${product.id} for merchant: ${merchantId}`);
      return ResponseHelper.created(res, product, 'Product created successfully');
    } catch (error) {
      logger.error('Error creating product:', error);
      return ResponseHelper.internalServerError(res, 'Failed to create product', error.message);
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { category, type, isActive, isFeatured } = req.query;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const filters: any = {};
      if (category) filters.category = category;
      if (type) filters.type = type;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';

      const products = await paymentHubService.getProducts(merchantId, filters);
      return ResponseHelper.success(res, products, 'Products retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving products:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve products', error.message);
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const product = await paymentHubService.getProduct(productId);

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(product.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      return ResponseHelper.success(res, product, 'Product retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving product:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve product', error.message);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const updateData = req.body;

      const product = await paymentHubService.getProduct(productId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(product.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const updatedProduct = await paymentHubService.updateProduct(productId, updateData);
      
      logger.info(`Product updated: ${productId}`);
      return ResponseHelper.success(res, updatedProduct, 'Product updated successfully');
    } catch (error) {
      logger.error('Error updating product:', error);
      return ResponseHelper.internalServerError(res, 'Failed to update product', error.message);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const product = await paymentHubService.getProduct(productId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(product.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      await paymentHubService.deleteProduct(productId);
      
      logger.info(`Product deleted: ${productId}`);
      return ResponseHelper.success(res, null, 'Product deleted successfully');
    } catch (error) {
      logger.error('Error deleting product:', error);
      return ResponseHelper.internalServerError(res, 'Failed to delete product', error.message);
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { q: query } = req.query;

      if (!query || typeof query !== 'string') {
        return ResponseHelper.badRequest(res, 'Search query is required');
      }

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const products = await paymentHubService.searchProducts(merchantId, query);
      return ResponseHelper.success(res, products, 'Products search completed successfully');
    } catch (error) {
      logger.error('Error searching products:', error);
      return ResponseHelper.internalServerError(res, 'Failed to search products', error.message);
    }
  }

  // Payment Link Endpoints
  async createPaymentLink(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const linkData = req.body;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const paymentLink = await paymentHubService.createPaymentLink({
        ...linkData,
        merchantId
      });

      logger.info(`Payment link created: ${paymentLink.id} for merchant: ${merchantId}`);
      return ResponseHelper.created(res, paymentLink, 'Payment link created successfully');
    } catch (error) {
      logger.error('Error creating payment link:', error);
      return ResponseHelper.internalServerError(res, 'Failed to create payment link', error.message);
    }
  }

  async getPaymentLinks(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { linkType, isActive, channelId } = req.query;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const filters: any = {};
      if (linkType) filters.linkType = linkType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (channelId) filters.channelId = channelId;

      const links = await paymentHubService.getPaymentLinks(merchantId, filters);
      return ResponseHelper.success(res, links, 'Payment links retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving payment links:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment links', error.message);
    }
  }

  async getPaymentLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const link = await paymentHubService.getPaymentLink(linkId);

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(link.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      return ResponseHelper.success(res, link, 'Payment link retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving payment link:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment link', error.message);
    }
  }

  async updatePaymentLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const updateData = req.body;

      const link = await paymentHubService.getPaymentLink(linkId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(link.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const updatedLink = await paymentHubService.updatePaymentLink(linkId, updateData);
      
      logger.info(`Payment link updated: ${linkId}`);
      return ResponseHelper.success(res, updatedLink, 'Payment link updated successfully');
    } catch (error) {
      logger.error('Error updating payment link:', error);
      return ResponseHelper.internalServerError(res, 'Failed to update payment link', error.message);
    }
  }

  async deletePaymentLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;

      const link = await paymentHubService.getPaymentLink(linkId);
      
      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(link.merchantId.toString(), req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      await paymentHubService.deletePaymentLink(linkId);
      
      logger.info(`Payment link deleted: ${linkId}`);
      return ResponseHelper.success(res, null, 'Payment link deleted successfully');
    } catch (error) {
      logger.error('Error deleting payment link:', error);
      return ResponseHelper.internalServerError(res, 'Failed to delete payment link', error.message);
    }
  }

  // Dashboard and Statistics
  async getPaymentHubStats(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;

      // Validate merchant access
      const hasAccess = await paymentHubService.validateMerchantAccess(merchantId, req.user._id.toString());
      if (!hasAccess) {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const stats = await paymentHubService.getPaymentHubStats(merchantId);
      return ResponseHelper.success(res, stats, 'Payment hub statistics retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving payment hub stats:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment hub statistics', error.message);
    }
  }

  // Public Payment Link (for customers)
  async getPublicPaymentLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const link = await paymentHubService.getPaymentLink(linkId);

      // Check if link is usable using type assertion for the method
      const linkDoc = link as any;
      const canUse = linkDoc.canBeUsed();
      if (!canUse.canUse) {
        return ResponseHelper.badRequest(res, canUse.reason);
      }

      // Get merchant details for public display
      const merchant = await Merchant.findById(link.merchantId);

      // Return public link data (without sensitive merchant info)
      const publicLink = {
        id: link.id,
        title: link.title,
        description: link.description,
        amount: link.amount,
        currency: link.currency,
        quantity: link.quantity,
        totalAmount: (link as any).totalAmount,
        settings: link.settings,
        branding: link.settings.branding,
        merchant: {
          businessName: merchant.businessName,
          logo: merchant.logo
        }
      };

      return ResponseHelper.success(res, publicLink, 'Payment link retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving public payment link:', error);
      return ResponseHelper.internalServerError(res, 'Failed to retrieve payment link', error.message);
    }
  }

  // Utility endpoints
  async cleanupExpiredLinks(req: Request, res: Response) {
    try {
      // Only allow admin users to cleanup expired links
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Access denied');
      }

      const cleanedCount = await paymentHubService.cleanupExpiredLinks();
      
      logger.info(`Cleaned up ${cleanedCount} expired payment links`);
      return ResponseHelper.success(res, { cleanedCount }, `${cleanedCount} expired links cleaned up successfully`);
    } catch (error) {
      logger.error('Error cleaning up expired links:', error);
      return ResponseHelper.internalServerError(res, 'Failed to cleanup expired links', error.message);
    }
  }
}

export default new PaymentHubController();
