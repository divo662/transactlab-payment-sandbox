import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnalytics extends Document {
  merchantId: mongoose.Types.ObjectId;
  date: Date;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  metrics: {
    transactions: {
      total: number;
      successful: number;
      failed: number;
      pending: number;
      cancelled: number;
    };
    revenue: {
      total: number;
      successful: number;
      fees: number;
      refunds: number;
      chargebacks: number;
    };
    customers: {
      new: number;
      returning: number;
      total: number;
    };
    paymentMethods: {
      card: number;
      bankTransfer: number;
      ussd: number;
      mobileMoney: number;
      wallet: number;
      crypto: number;
    };
    performance: {
      averageTransactionValue: number;
      successRate: number;
      averageProcessingTime: number;
      peakHour: number;
      peakDay: string;
    };
    geographic: {
      countries: Record<string, number>;
      states: Record<string, number>;
      cities: Record<string, number>;
    };
    devices: {
      mobile: number;
      desktop: number;
      tablet: number;
    };
    browsers: Record<string, number>;
    operatingSystems: Record<string, number>;
  };
  breakdown: {
    hourly?: Record<string, any>;
    daily?: Record<string, any>;
    weekly?: Record<string, any>;
    monthly?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Merchant ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      enum: {
        values: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
        message: 'Invalid period'
      }
    },
    metrics: {
      transactions: {
        total: {
          type: Number,
          default: 0,
          min: [0, 'Total transactions cannot be negative']
        },
        successful: {
          type: Number,
          default: 0,
          min: [0, 'Successful transactions cannot be negative']
        },
        failed: {
          type: Number,
          default: 0,
          min: [0, 'Failed transactions cannot be negative']
        },
        pending: {
          type: Number,
          default: 0,
          min: [0, 'Pending transactions cannot be negative']
        },
        cancelled: {
          type: Number,
          default: 0,
          min: [0, 'Cancelled transactions cannot be negative']
        }
      },
      revenue: {
        total: {
          type: Number,
          default: 0,
          min: [0, 'Total revenue cannot be negative']
        },
        successful: {
          type: Number,
          default: 0,
          min: [0, 'Successful revenue cannot be negative']
        },
        fees: {
          type: Number,
          default: 0,
          min: [0, 'Fees cannot be negative']
        },
        refunds: {
          type: Number,
          default: 0,
          min: [0, 'Refunds cannot be negative']
        },
        chargebacks: {
          type: Number,
          default: 0,
          min: [0, 'Chargebacks cannot be negative']
        }
      },
      customers: {
        new: {
          type: Number,
          default: 0,
          min: [0, 'New customers cannot be negative']
        },
        returning: {
          type: Number,
          default: 0,
          min: [0, 'Returning customers cannot be negative']
        },
        total: {
          type: Number,
          default: 0,
          min: [0, 'Total customers cannot be negative']
        }
      },
      paymentMethods: {
        card: {
          type: Number,
          default: 0,
          min: [0, 'Card transactions cannot be negative']
        },
        bankTransfer: {
          type: Number,
          default: 0,
          min: [0, 'Bank transfer transactions cannot be negative']
        },
        ussd: {
          type: Number,
          default: 0,
          min: [0, 'USSD transactions cannot be negative']
        },
        mobileMoney: {
          type: Number,
          default: 0,
          min: [0, 'Mobile money transactions cannot be negative']
        },
        wallet: {
          type: Number,
          default: 0,
          min: [0, 'Wallet transactions cannot be negative']
        },
        crypto: {
          type: Number,
          default: 0,
          min: [0, 'Crypto transactions cannot be negative']
        }
      },
      performance: {
        averageTransactionValue: {
          type: Number,
          default: 0,
          min: [0, 'Average transaction value cannot be negative']
        },
        successRate: {
          type: Number,
          default: 0,
          min: [0, 'Success rate cannot be negative'],
          max: [100, 'Success rate cannot exceed 100']
        },
        averageProcessingTime: {
          type: Number,
          default: 0,
          min: [0, 'Average processing time cannot be negative']
        },
        peakHour: {
          type: Number,
          min: [0, 'Peak hour must be between 0 and 23'],
          max: [23, 'Peak hour must be between 0 and 23']
        },
        peakDay: {
          type: String,
          enum: {
            values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            message: 'Invalid peak day'
          }
        }
      },
      geographic: {
        countries: {
          type: Schema.Types.Mixed,
          default: {}
        },
        states: {
          type: Schema.Types.Mixed,
          default: {}
        },
        cities: {
          type: Schema.Types.Mixed,
          default: {}
        }
      },
      devices: {
        mobile: {
          type: Number,
          default: 0,
          min: [0, 'Mobile transactions cannot be negative']
        },
        desktop: {
          type: Number,
          default: 0,
          min: [0, 'Desktop transactions cannot be negative']
        },
        tablet: {
          type: Number,
          default: 0,
          min: [0, 'Tablet transactions cannot be negative']
        }
      },
      browsers: {
        type: Schema.Types.Mixed,
        default: {}
      },
      operatingSystems: {
        type: Schema.Types.Mixed,
        default: {}
      }
    },
    breakdown: {
      hourly: {
        type: Schema.Types.Mixed
      },
      daily: {
        type: Schema.Types.Mixed
      },
      weekly: {
        type: Schema.Types.Mixed
      },
      monthly: {
        type: Schema.Types.Mixed
      }
    },
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
analyticsSchema.index({ merchantId: 1 });
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ period: 1 });
analyticsSchema.index({ merchantId: 1, date: 1 });
analyticsSchema.index({ merchantId: 1, period: 1 });

// Compound indexes
analyticsSchema.index({ merchantId: 1, date: 1, period: 1 });

// Virtual for net revenue
analyticsSchema.virtual('netRevenue').get(function (this: any) {
  return this.metrics.revenue.successful - this.metrics.revenue.refunds - this.metrics.revenue.chargebacks;
});

// Virtual for total transaction volume
analyticsSchema.virtual('totalTransactionVolume').get(function (this: any) {
  return this.metrics.transactions.successful + this.metrics.transactions.failed + this.metrics.transactions.pending;
});

// Virtual for conversion rate
analyticsSchema.virtual('conversionRate').get(function (this: any) {
  if (this.metrics.transactions.total === 0) return 0;
  return (this.metrics.transactions.successful / this.metrics.transactions.total) * 100;
});

// Virtual for average order value
analyticsSchema.virtual('averageOrderValue').get(function (this: any) {
  if (this.metrics.transactions.successful === 0) return 0;
  return this.metrics.revenue.successful / this.metrics.transactions.successful;
});

// Pre-save middleware to calculate derived metrics
analyticsSchema.pre('save', function (next) {
  // Calculate success rate
  if (this.metrics.transactions.total > 0) {
    this.metrics.performance.successRate = (this.metrics.transactions.successful / this.metrics.transactions.total) * 100;
  }
  
  // Calculate average transaction value
  if (this.metrics.transactions.successful > 0) {
    this.metrics.performance.averageTransactionValue = this.metrics.revenue.successful / this.metrics.transactions.successful;
  }
  
  next();
});

// Instance method to update transaction metrics
analyticsSchema.methods['updateTransactionMetrics'] = async function (transactionData: any) {
  this['metrics'].transactions.total += 1;
  
  switch (transactionData.status) {
    case 'success':
      this['metrics'].transactions.successful += 1;
      this['metrics'].revenue.successful += transactionData.amount;
      this['metrics'].revenue.total += transactionData.amount;
      break;
    case 'failed':
      this['metrics'].transactions.failed += 1;
      break;
    case 'pending':
      this['metrics'].transactions.pending += 1;
      break;
    case 'cancelled':
      this['metrics'].transactions.cancelled += 1;
      break;
  }
  
  // Update payment method metrics
  if (transactionData.paymentMethod) {
    switch (transactionData.paymentMethod) {
      case 'card':
        this['metrics'].paymentMethods.card += 1;
        break;
      case 'bank_transfer':
        this['metrics'].paymentMethods.bankTransfer += 1;
        break;
      case 'ussd':
        this['metrics'].paymentMethods.ussd += 1;
        break;
      case 'mobile_money':
        this['metrics'].paymentMethods.mobileMoney += 1;
        break;
      case 'wallet':
        this['metrics'].paymentMethods.wallet += 1;
        break;
      case 'crypto':
        this['metrics'].paymentMethods.crypto += 1;
        break;
    }
  }
  
  return await this['save']();
};

// Instance method to update customer metrics
analyticsSchema.methods['updateCustomerMetrics'] = async function (isNewCustomer: boolean) {
  this['metrics'].customers.total += 1;
  
  if (isNewCustomer) {
    this['metrics'].customers.new += 1;
  } else {
    this['metrics'].customers.returning += 1;
  }
  
  return await this['save']();
};

// Instance method to update geographic metrics
analyticsSchema.methods['updateGeographicMetrics'] = async function (location: any) {
  if (location.country) {
    this['metrics'].geographic.countries[location.country] = 
      (this['metrics'].geographic.countries[location.country] || 0) + 1;
  }
  
  if (location.state) {
    this['metrics'].geographic.states[location.state] = 
      (this['metrics'].geographic.states[location.state] || 0) + 1;
  }
  
  if (location.city) {
    this['metrics'].geographic.cities[location.city] = 
      (this['metrics'].geographic.cities[location.city] || 0) + 1;
  }
  
  return await this['save']();
};

// Instance method to update device metrics
analyticsSchema.methods['updateDeviceMetrics'] = async function (deviceType: string, browser?: string, os?: string) {
  switch (deviceType) {
    case 'mobile':
      this['metrics'].devices.mobile += 1;
      break;
    case 'desktop':
      this['metrics'].devices.desktop += 1;
      break;
    case 'tablet':
      this['metrics'].devices.tablet += 1;
      break;
  }
  
  if (browser) {
    this['metrics'].browsers[browser] = (this['metrics'].browsers[browser] || 0) + 1;
  }
  
  if (os) {
    this['metrics'].operatingSystems[os] = (this['metrics'].operatingSystems[os] || 0) + 1;
  }
  
  return await this['save']();
};

// Static method to find analytics by merchant
analyticsSchema.statics['findByMerchant'] = function (merchantId: mongoose.Types.ObjectId) {
  return this.find({ merchantId }).sort({ date: -1 });
};

// Static method to find analytics by date range
analyticsSchema.statics['findByDateRange'] = function (
  merchantId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    merchantId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get analytics summary
analyticsSchema.statics['getSummary'] = async function (merchantId: mongoose.Types.ObjectId) {
  const analytics = await this.find({ merchantId }).sort({ date: -1 }).limit(30);
  
  const summary = {
    totalTransactions: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageTransactionValue: 0,
    successRate: 0,
    topPaymentMethods: [] as any[],
    topCountries: [] as any[],
    trends: {
      transactions: [] as any[],
      revenue: [] as any[],
      customers: [] as any[]
    }
  };
  
  analytics.forEach((analytic: any) => {
    summary.totalTransactions += analytic['metrics'].transactions.total;
    summary.totalRevenue += analytic['metrics'].revenue.total;
    summary.totalCustomers += analytic['metrics'].customers.total;
  });
  
  if (summary.totalTransactions > 0) {
    summary.averageTransactionValue = summary.totalRevenue / summary.totalTransactions;
    summary.successRate = (summary.totalTransactions / summary.totalTransactions) * 100;
  }
  
  return summary;
};

// Static method to get trends
analyticsSchema.statics['getTrends'] = async function (
  merchantId: mongoose.Types.ObjectId,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 12);
      break;
  }
  
  const analytics = await this.find({
    merchantId,
    date: { $gte: startDate, $lte: endDate },
    period
  }).sort({ date: 1 });
  
  return analytics.map((analytic: any) => ({
    date: analytic.date,
    transactions: analytic['metrics'].transactions.total,
    revenue: analytic['metrics'].revenue.total,
    customers: analytic['metrics'].customers.total
  }));
};

const Analytics: Model<IAnalytics> = mongoose.model<IAnalytics>('Analytics', analyticsSchema);

export default Analytics; 