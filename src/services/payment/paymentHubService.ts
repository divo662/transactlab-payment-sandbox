import PaymentChannel from '../../models/PaymentChannel';
import Product from '../../models/Product';
import PaymentLink from '../../models/PaymentLink';
import Merchant from '../../models/Merchant';
import { IPaymentChannel, IProduct, IPaymentLink } from '../../models';
import mongoose from 'mongoose';

export interface CreatePaymentChannelData {
  merchantId: string;
  type: 'direct' | 'product' | 'subscription' | 'donation' | 'custom';
  name: string;
  description?: string;
  settings: {
    allowedPaymentMethods: string[];
    supportedCurrencies: string[];
    defaultCurrency: string;
    allowPartialPayments?: boolean;
    requireCustomerInfo?: boolean;
    customerFields?: string[];
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
    webhookUrl?: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      customCss?: string;
      pageTitle?: string;
      pageDescription?: string;
    };
    notifications?: {
      email?: boolean;
      sms?: boolean;
      webhook?: boolean;
    };
  };
  limits?: {
    minimumAmount?: number;
    maximumAmount?: number;
    dailyLimit?: number;
    monthlyLimit?: number;
  };
  fees?: {
    percentage?: number;
    fixed?: number;
    currency?: string;
  };
  metadata?: Record<string, any>;
}

export interface CreateProductData {
  merchantId: string;
  name: string;
  description?: string;
  sku?: string;
  category: string;
  subcategory?: string;
  type: 'product' | 'service' | 'digital' | 'subscription';
  price: number;
  currency: string;
  compareAtPrice?: number;
  costPrice?: number;
  isFeatured?: boolean;
  requiresShipping?: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inventory?: {
    quantity?: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
    allowBackorders?: boolean;
    backorderQuantity?: number;
  };
  images?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreatePaymentLinkData {
  merchantId: string;
  channelId: string;
  productId?: string;
  customerId?: string;
  linkType: 'single' | 'product' | 'subscription' | 'donation' | 'custom';
  title: string;
  description?: string;
  amount: number;
  currency: string;
  quantity?: number;
  expiresAt?: Date;
  maxUses?: number;
  settings?: {
    allowPartialPayments?: boolean;
    requireCustomerInfo?: boolean;
    customerFields?: string[];
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
    webhookUrl?: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      customCss?: string;
      pageTitle?: string;
      pageDescription?: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface PaymentHubStats {
  channels: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  products: {
    total: number;
    active: number;
    featured: number;
    byCategory: Record<string, number>;
    totalValue: number;
    avgPrice: number;
  };
  paymentLinks: {
    total: number;
    active: number;
    totalUses: number;
    totalAmount: number;
    byType: Record<string, number>;
  };
  recentActivity: {
    recentChannels: IPaymentChannel[];
    recentProducts: IProduct[];
    recentLinks: IPaymentLink[];
  };
}

class PaymentHubService {
  // Payment Channel Methods
  async createPaymentChannel(data: CreatePaymentChannelData): Promise<IPaymentChannel> {
    try {
      // Generate unique slug using type assertion for static method
      const paymentChannelModel = PaymentChannel as any;
      const slug = await paymentChannelModel.generateSlug(data.name, new mongoose.Types.ObjectId(data.merchantId));
      
      const paymentChannel = new PaymentChannel({
        ...data,
        slug,
        merchantId: new mongoose.Types.ObjectId(data.merchantId)
      });
      
      return await paymentChannel.save();
    } catch (error) {
      throw new Error(`Failed to create payment channel: ${error.message}`);
    }
  }

  async getPaymentChannels(merchantId: string, filters?: { type?: string; isActive?: boolean }): Promise<IPaymentChannel[]> {
    try {
      const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };
      
      if (filters?.type) query.type = filters.type;
      if (filters?.isActive !== undefined) query.isActive = filters.isActive;
      
      return await PaymentChannel.find(query).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get payment channels: ${error.message}`);
    }
  }

  async getPaymentChannel(channelId: string): Promise<IPaymentChannel> {
    try {
      const channel = await PaymentChannel.findById(channelId);
      if (!channel) {
        throw new Error('Payment channel not found');
      }
      return channel;
    } catch (error) {
      throw new Error(`Failed to get payment channel: ${error.message}`);
    }
  }

  async updatePaymentChannel(channelId: string, data: Partial<CreatePaymentChannelData>): Promise<IPaymentChannel> {
    try {
      const channel = await PaymentChannel.findByIdAndUpdate(
        channelId,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!channel) {
        throw new Error('Payment channel not found');
      }
      
      return channel;
    } catch (error) {
      throw new Error(`Failed to update payment channel: ${error.message}`);
    }
  }

  async deletePaymentChannel(channelId: string): Promise<void> {
    try {
      const result = await PaymentChannel.findByIdAndDelete(channelId);
      if (!result) {
        throw new Error('Payment channel not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete payment channel: ${error.message}`);
    }
  }

  // Product Methods
  async createProduct(data: CreateProductData): Promise<IProduct> {
    try {
      const product = new Product({
        ...data,
        merchantId: new mongoose.Types.ObjectId(data.merchantId)
      });
      
      return await product.save();
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async getProducts(merchantId: string, filters?: { category?: string; type?: string; isActive?: boolean; isFeatured?: boolean }): Promise<IProduct[]> {
    try {
      const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };
      
      if (filters?.category) query.category = filters.category;
      if (filters?.type) query.type = filters.type;
      if (filters?.isActive !== undefined) query.isActive = filters.isActive;
      if (filters?.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
      
      return await Product.find(query).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async getProduct(productId: string): Promise<IProduct> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateProduct(productId: string, data: Partial<CreateProductData>): Promise<IProduct> {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      const result = await Product.findByIdAndDelete(productId);
      if (!result) {
        throw new Error('Product not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  async searchProducts(merchantId: string, query: string): Promise<IProduct[]> {
    try {
      // Use type assertion for static method
      const productModel = Product as any;
      return await productModel.search(new mongoose.Types.ObjectId(merchantId), query);
    } catch (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  // Payment Link Methods
  async createPaymentLink(data: CreatePaymentLinkData): Promise<IPaymentLink> {
    try {
      // Validate payment channel exists
      const channel = await PaymentChannel.findById(data.channelId);
      if (!channel) {
        throw new Error('Payment channel not found');
      }

      // Validate product if product link
      if (data.productId) {
        const product = await Product.findById(data.productId);
        if (!product) {
          throw new Error('Product not found');
        }
      }

      const paymentLink = new PaymentLink({
        ...data,
        merchantId: new mongoose.Types.ObjectId(data.merchantId),
        channelId: new mongoose.Types.ObjectId(data.channelId),
        productId: data.productId ? new mongoose.Types.ObjectId(data.productId) : undefined,
        customerId: data.customerId ? new mongoose.Types.ObjectId(data.customerId) : undefined
      });
      
      return await paymentLink.save();
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  async getPaymentLinks(merchantId: string, filters?: { linkType?: string; isActive?: boolean; channelId?: string }): Promise<IPaymentLink[]> {
    try {
      const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };
      
      if (filters?.linkType) query.linkType = filters.linkType;
      if (filters?.isActive !== undefined) query.isActive = filters.isActive;
      if (filters?.channelId) query.channelId = new mongoose.Types.ObjectId(filters.channelId);
      
      return await PaymentLink.find(query)
        .populate('channelId', 'name type')
        .populate('productId', 'name price currency')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get payment links: ${error.message}`);
    }
  }

  async getPaymentLink(linkId: string): Promise<IPaymentLink> {
    try {
      const link = await PaymentLink.findById(linkId)
        .populate('channelId', 'name type settings')
        .populate('productId', 'name description price currency images')
        .populate('merchantId', 'businessName businessEmail logo');
      
      if (!link) {
        throw new Error('Payment link not found');
      }
      
      return link;
    } catch (error) {
      throw new Error(`Failed to get payment link: ${error.message}`);
    }
  }

  async updatePaymentLink(linkId: string, data: Partial<CreatePaymentLinkData>): Promise<IPaymentLink> {
    try {
      const link = await PaymentLink.findByIdAndUpdate(
        linkId,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!link) {
        throw new Error('Payment link not found');
      }
      
      return link;
    } catch (error) {
      throw new Error(`Failed to update payment link: ${error.message}`);
    }
  }

  async deletePaymentLink(linkId: string): Promise<void> {
    try {
      const result = await PaymentLink.findByIdAndDelete(linkId);
      if (!result) {
        throw new Error('Payment link not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete payment link: ${error.message}`);
    }
  }

  async incrementLinkUsage(linkId: string): Promise<void> {
    try {
      const link = await PaymentLink.findById(linkId);
      if (!link) {
        throw new Error('Payment link not found');
      }
      
      // Use type assertion for instance method
      const linkDoc = link as any;
      await linkDoc.incrementUsage();
    } catch (error) {
      throw new Error(`Failed to increment link usage: ${error.message}`);
    }
  }

  // Dashboard and Statistics
  async getPaymentHubStats(merchantId: string): Promise<PaymentHubStats> {
    try {
      const [channelStats, productStats, linkStats, recentActivity] = await Promise.all([
        this.getChannelStats(merchantId),
        this.getProductStats(merchantId),
        this.getLinkStats(merchantId),
        this.getRecentActivity(merchantId)
      ]);

      return {
        channels: channelStats,
        products: productStats,
        paymentLinks: linkStats,
        recentActivity
      };
    } catch (error) {
      throw new Error(`Failed to get payment hub stats: ${error.message}`);
    }
  }

  private async getChannelStats(merchantId: string) {
    const channels = await PaymentChannel.find({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    
    const byType = channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: channels.length,
      active: channels.filter(c => c.isActive).length,
      byType
    };
  }

  private async getProductStats(merchantId: string) {
    // Use type assertion for static method
    const productModel = Product as any;
    const stats = await productModel.getStats(new mongoose.Types.ObjectId(merchantId));
    const stat = stats[0] || { totalProducts: 0, activeProducts: 0, featuredProducts: 0, totalValue: 0, avgPrice: 0, categories: [] };
    
    const byCategory = stat.categories.reduce((acc, cat) => {
      acc[cat] = 0; // You could enhance this to get actual counts
      return acc;
    }, {} as Record<string, number>);

    return {
      total: stat.totalProducts || 0,
      active: stat.activeProducts || 0,
      featured: stat.featuredProducts || 0,
      byCategory,
      totalValue: stat.totalValue || 0,
      avgPrice: stat.avgPrice || 0
    };
  }

  private async getLinkStats(merchantId: string) {
    // Use type assertion for static method
    const paymentLinkModel = PaymentLink as any;
    const stats = await paymentLinkModel.getStats(new mongoose.Types.ObjectId(merchantId));
    const stat = stats[0] || { totalLinks: 0, activeLinks: 0, totalUses: 0, totalAmount: 0, linkTypes: [] };
    
    const byType = stat.linkTypes.reduce((acc, type) => {
      acc[type] = 0; // You could enhance this to get actual counts
      return acc;
    }, {} as Record<string, number>);

    return {
      total: stat.totalLinks || 0,
      active: stat.activeLinks || 0,
      totalUses: stat.totalUses || 0,
      totalAmount: stat.totalAmount || 0,
      byType
    };
  }

  private async getRecentActivity(merchantId: string) {
    const [recentChannels, recentProducts, recentLinks] = await Promise.all([
      PaymentChannel.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
        .sort({ createdAt: -1 })
        .limit(5),
      PaymentLink.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    return {
      recentChannels,
      recentProducts,
      recentLinks
    };
  }

  // Utility Methods
  async validateMerchantAccess(merchantId: string, userId: string): Promise<boolean> {
    try {
      const merchant = await Merchant.findOne({ 
        _id: new mongoose.Types.ObjectId(merchantId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      return !!merchant;
    } catch (error) {
      return false;
    }
  }

  async cleanupExpiredLinks(): Promise<number> {
    try {
      // Use type assertion for static method
      const paymentLinkModel = PaymentLink as any;
      return await paymentLinkModel.cleanupExpired();
    } catch (error) {
      throw new Error(`Failed to cleanup expired links: ${error.message}`);
    }
  }
}

export default new PaymentHubService();
