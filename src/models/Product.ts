import mongoose, { Document, Schema, Model } from 'mongoose';
import { CURRENCIES } from '../utils/constants/currencies';

export interface IProduct extends Document {
  merchantId: mongoose.Types.ObjectId;
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
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorders: boolean;
    backorderQuantity?: number;
  };
  images: string[];
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    sku: {
      type: String,
      trim: true,
      maxlength: [50, 'SKU cannot exceed 50 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Subcategory cannot exceed 100 characters']
    },
    type: {
      type: String,
      required: [true, 'Product type is required'],
      enum: {
        values: ['product', 'service', 'digital', 'subscription'],
        message: 'Invalid product type'
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: {
        values: Object.values(CURRENCIES),
        message: 'Invalid currency'
      }
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isDigital: {
      type: Boolean,
      default: false
    },
    requiresShipping: {
      type: Boolean,
      default: true
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    dimensions: {
      length: {
        type: Number,
        min: [0, 'Length cannot be negative']
      },
      width: {
        type: Number,
        min: [0, 'Width cannot be negative']
      },
      height: {
        type: Number,
        min: [0, 'Height cannot be negative']
      }
    },
    inventory: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, 'Quantity cannot be negative']
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: [0, 'Low stock threshold cannot be negative']
      },
      trackInventory: {
        type: Boolean,
        default: true
      },
      allowBackorders: {
        type: Boolean,
        default: false
      },
      backorderQuantity: {
        type: Number,
        min: [0, 'Backorder quantity cannot be negative']
      }
    },
    images: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
productSchema.index({ merchantId: 1 });
productSchema.index({ merchantId: 1, category: 1 });
productSchema.index({ merchantId: 1, isActive: 1 });
productSchema.index({ merchantId: 1, isFeatured: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ tags: 1 });

// Compound indexes
productSchema.index({ merchantId: 1, category: 1, isActive: 1 });
productSchema.index({ merchantId: 1, type: 1, isActive: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function (this: any) {
  if (!this.costPrice || this.costPrice === 0) return null;
  return ((this.price - this.costPrice) / this.price) * 100;
});

// Virtual for is in stock
productSchema.virtual('isInStock').get(function (this: any) {
  if (!this.inventory.trackInventory) return true;
  return this.inventory.quantity > 0;
});

// Virtual for is low stock
productSchema.virtual('isLowStock').get(function (this: any) {
  if (!this.inventory.trackInventory) return false;
  return this.inventory.quantity <= this.inventory.lowStockThreshold && this.inventory.quantity > 0;
});

// Virtual for is out of stock
productSchema.virtual('isOutOfStock').get(function (this: any) {
  if (!this.inventory.trackInventory) return false;
  return this.inventory.quantity === 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function (this: any) {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100;
});

// Pre-save middleware to set isDigital based on type
productSchema.pre('save', function (next) {
  if (this.type === 'digital' || this.type === 'service') {
    this.isDigital = true;
    this.requiresShipping = false;
  }
  next();
});

// Instance method to update inventory
productSchema.methods.updateInventory = async function (quantity: number, operation: 'add' | 'subtract' = 'subtract') {
  if (!this.inventory.trackInventory) {
    throw new Error('Inventory tracking is not enabled for this product');
  }
  
  if (operation === 'subtract') {
    if (this.inventory.quantity < quantity && !this.inventory.allowBackorders) {
      throw new Error('Insufficient inventory');
    }
    this.inventory.quantity = Math.max(0, this.inventory.quantity - quantity);
  } else {
    this.inventory.quantity += quantity;
  }
  
  return await this.save();
};

// Instance method to check if product can be purchased
productSchema.methods.canBePurchased = function (requestedQuantity: number = 1) {
  if (!this.isActive) return { canPurchase: false, reason: 'Product is not active' };
  
  if (this.inventory.trackInventory) {
    if (this.inventory.quantity < requestedQuantity && !this.inventory.allowBackorders) {
      return { canPurchase: false, reason: 'Insufficient inventory' };
    }
  }
  
  return { canPurchase: true, reason: 'Product available' };
};

// Instance method to get formatted price
productSchema.methods.getFormattedPrice = function () {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.price);
};

// Static method to find active products by merchant
productSchema.statics.findActiveByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true });
};

// Static method to find featured products by merchant
productSchema.statics.findFeaturedByMerchant = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId, isActive: true, isFeatured: true });
};

// Static method to find products by category
productSchema.statics.findByCategory = function (merchantId: mongoose.Types.ObjectId, category: string) {
  return this.find({ merchantId, category, isActive: true });
};

// Static method to search products
productSchema.statics.search = function (merchantId: mongoose.Types.ObjectId, query: string) {
  return this.find({
    merchantId,
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  });
};

// Static method to get product statistics
productSchema.statics.getStats = function (merchantId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        featuredProducts: {
          $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
        },
        totalValue: { $sum: '$price' },
        avgPrice: { $avg: '$price' },
        categories: { $addToSet: '$category' }
      }
    }
  ]);
};

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
