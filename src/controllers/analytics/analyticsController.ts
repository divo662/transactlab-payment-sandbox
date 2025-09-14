import { Request, Response } from 'express';
import SandboxSession from '../../models/SandboxSession';
import SandboxCustomer from '../../models/SandboxCustomer';
import SandboxSubscription from '../../models/SandboxSubscription';
import SandboxProduct from '../../models/SandboxProduct';
import SandboxPlan from '../../models/SandboxPlan';
import ApiKey from '../../models/ApiKey';
import Webhook from '../../models/Webhook';
import User from '../../models/User';

// Helper function to get date range based on timeRange parameter
const getDateRange = (timeRange: string) => {
  const now = new Date();
  const start = new Date();
  
  switch (timeRange) {
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start.setDate(now.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }
  
  return { start, end: now };
};

// Helper function to generate daily data
const generateDailyData = async (userId: string, startDate: Date, endDate: Date) => {
  const dailyData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const sessions = await SandboxSession.find({
      userId,
      createdAt: { $gte: dayStart, $lte: dayEnd }
    });
    
    const totalAmount = sessions.reduce((sum, session) => sum + (session.amount || 0), 0);
    
    dailyData.push({
      date: currentDate.toISOString().split('T')[0],
      count: sessions.length,
      amount: totalAmount
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyData;
};

// Helper function to generate monthly data
const generateMonthlyData = async (userId: string, startDate: Date, endDate: Date) => {
  const monthlyData = [];
  const currentDate = new Date(startDate);
  currentDate.setDate(1); // Start of month
  
  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(currentDate);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const sessions = await SandboxSession.find({
      userId,
      createdAt: { $gte: monthStart, $lte: monthEnd }
    });
    
    const totalAmount = sessions.reduce((sum, session) => sum + (session.amount || 0), 0);
    
    monthlyData.push({
      month: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: sessions.length,
      amount: totalAmount
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return monthlyData;
};

// Get analytics overview
export const getAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { start, end } = getDateRange(timeRange as string);
    
    // Get transaction data
    const sessions = await SandboxSession.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    });
    
    const successfulSessions = sessions.filter(s => s.status === 'completed');
    const failedSessions = sessions.filter(s => s.status === 'failed');
    const pendingSessions = sessions.filter(s => s.status === 'pending');
    
    const totalAmount = sessions.reduce((sum, session) => sum + (session.amount || 0), 0);
    const averageAmount = sessions.length > 0 ? totalAmount / sessions.length : 0;
    const successRate = sessions.length > 0 ? (successfulSessions.length / sessions.length) * 100 : 0;
    
    // Get customer data
    const customers = await SandboxCustomer.find({ userId });
    const newCustomersThisMonth = await SandboxCustomer.countDocuments({
      userId,
      createdAt: { $gte: start, $lte: end }
    });
    
    // Get top customers by total spent
    const customerSpending = await SandboxSession.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { 
        _id: '$customerEmail', 
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);
    
    const topCustomers = customerSpending.map(customer => ({
      email: customer._id,
      totalSpent: customer.totalSpent,
      transactionCount: customer.transactionCount
    }));
    
    // Calculate customer growth rate
    const previousPeriodStart = new Date(start);
    const previousPeriodEnd = new Date(start);
    const periodLength = end.getTime() - start.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    
    const previousPeriodCustomers = await SandboxCustomer.countDocuments({
      userId,
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    });
    
    const growthRate = previousPeriodCustomers > 0 
      ? ((newCustomersThisMonth - previousPeriodCustomers) / previousPeriodCustomers) * 100 
      : 0;
    
    // Get API usage data (mock for now - would need actual API logging)
    const apiUsage = {
      totalRequests: 45678, // This would come from API logging
      requestsThisMonth: 12345,
      averageResponseTime: 245,
      errorRate: 2.1,
      topEndpoints: [
        { endpoint: '/api/v1/sessions', count: 12345, successRate: 98.5 },
        { endpoint: '/api/v1/customers', count: 8900, successRate: 97.2 },
        { endpoint: '/api/v1/subscriptions', count: 5600, successRate: 96.8 }
      ]
    };
    
    // Get webhook data
    const webhooks = await Webhook.find({ merchantId: userId.toString() });
    const successfulWebhooks = webhooks.filter(w => w.deliveryStats.successfulDeliveries > 0);
    const failedWebhooks = webhooks.filter(w => w.deliveryStats.failedDeliveries > 0);
    const webhookSuccessRate = webhooks.length > 0 ? (successfulWebhooks.length / webhooks.length) * 100 : 0;
    
    // Get recent webhook events (mock data for now)
    const recentWebhookEvents = [
      { event: 'payment.succeeded', status: 'success', timestamp: new Date().toISOString(), responseTime: 120 },
      { event: 'payment.failed', status: 'failed', timestamp: new Date().toISOString(), responseTime: 0 },
      { event: 'subscription.created', status: 'success', timestamp: new Date().toISOString(), responseTime: 95 }
    ];
    
    // Get revenue data
    const revenue = {
      total: totalAmount,
      thisMonth: totalAmount,
      lastMonth: 0, // Would need to calculate from previous period
      growthRate: 0, // Would need to calculate
      byCurrency: [
        { currency: 'USD', amount: totalAmount * 0.6, percentage: 60 },
        { currency: 'EUR', amount: totalAmount * 0.3, percentage: 30 },
        { currency: 'GBP', amount: totalAmount * 0.1, percentage: 10 }
      ],
      dailyRevenue: await generateDailyData(userId.toString(), start, end)
    };
    
    // Generate daily and monthly data
    const dailyData = await generateDailyData(userId.toString(), start, end);
    const monthlyData = await generateMonthlyData(userId.toString(), start, end);
    
    const analyticsData = {
      transactions: {
        total: sessions.length,
        successful: successfulSessions.length,
        failed: failedSessions.length,
        pending: pendingSessions.length,
        totalAmount,
        averageAmount,
        successRate,
        dailyData,
        monthlyData
      },
      customers: {
        total: customers.length,
        newThisMonth: newCustomersThisMonth,
        active: customers.length, // All customers are considered active in sandbox
        topCustomers,
        growthRate
      },
      apiUsage,
      webhooks: {
        total: webhooks.length,
        successful: successfulWebhooks.length,
        failed: failedWebhooks.length,
        successRate: webhookSuccessRate,
        recentEvents: recentWebhookEvents
      },
      revenue
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

// Get transaction analytics
export const getTransactionAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { start, end } = getDateRange(timeRange as string);
    
    const sessions = await SandboxSession.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    });
    
    // Group by status
    const statusCounts = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate total amount
    const totalAmount = sessions.reduce((sum, session) => sum + (session.amount || 0), 0);
    
    // Group by currency
    const currencyData = sessions.reduce((acc, session) => {
      const currency = session.currency || 'USD';
      if (!acc[currency]) {
        acc[currency] = { count: 0, amount: 0 };
      }
      acc[currency].count += 1;
      acc[currency].amount += session.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
    
    // Group by payment method (mock data for now)
    const paymentMethodData = {
      'card': { count: Math.round(sessions.length * 0.8), amount: Math.round(totalAmount * 0.8) },
      'bank_transfer': { count: Math.round(sessions.length * 0.15), amount: Math.round(totalAmount * 0.15) },
      'wallet': { count: Math.round(sessions.length * 0.05), amount: Math.round(totalAmount * 0.05) }
    };
    
    res.json({
      success: true,
      data: {
        statusCounts,
        currencyData,
        paymentMethodData,
        totalSessions: sessions.length,
        totalAmount: sessions.reduce((sum, session) => sum + (session.amount || 0), 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching transaction analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction analytics'
    });
  }
};

// Get customer analytics
export const getCustomerAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { start, end } = getDateRange(timeRange as string);
    
    const customers = await SandboxCustomer.find({ userId });
    const newCustomers = await SandboxCustomer.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    });
    
    // Get customer lifetime value
    const customerLTV = await SandboxSession.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { 
        _id: '$customerEmail', 
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        firstTransaction: { $min: '$createdAt' },
        lastTransaction: { $max: '$createdAt' }
      }},
      { $sort: { totalSpent: -1 } }
    ]);
    
    // Calculate average LTV
    const averageLTV = customerLTV.length > 0 
      ? customerLTV.reduce((sum, customer) => sum + customer.totalSpent, 0) / customerLTV.length 
      : 0;
    
    // Get customer retention data
    const retentionData = await SandboxSession.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { 
        _id: '$customerEmail', 
        transactionCount: { $sum: 1 },
        totalSpent: { $sum: '$amount' }
      }},
      { $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        repeatCustomers: { $sum: { $cond: [{ $gt: ['$transactionCount', 1] }, 1, 0] } },
        averageTransactionsPerCustomer: { $avg: '$transactionCount' }
      }}
    ]);
    
    const retentionRate = retentionData.length > 0 && retentionData[0].totalCustomers > 0
      ? (retentionData[0].repeatCustomers / retentionData[0].totalCustomers) * 100
      : 0;
    
    res.json({
      success: true,
      data: {
        totalCustomers: customers.length,
        newCustomers: newCustomers.length,
        activeCustomers: customers.length, // All customers are considered active in sandbox
        averageLTV,
        retentionRate,
        topCustomers: customerLTV.slice(0, 10),
        customerSegments: {
          highValue: customerLTV.filter(c => c.totalSpent > averageLTV * 2).length,
          mediumValue: customerLTV.filter(c => c.totalSpent > averageLTV && c.totalSpent <= averageLTV * 2).length,
          lowValue: customerLTV.filter(c => c.totalSpent <= averageLTV).length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics'
    });
  }
};

// Export analytics data
export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { type, format = 'json', timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { start, end } = getDateRange(timeRange as string);
    
    let data;
    
    switch (type) {
      case 'transactions':
        const sessions = await SandboxSession.find({
          userId,
          createdAt: { $gte: start, $lte: end }
        });
        data = sessions.map(session => ({
          id: session._id,
          customerEmail: session.customerEmail,
          amount: session.amount,
          currency: session.currency,
          status: session.status,
          paymentMethod: 'card', // Default payment method since it's not stored in the model
          createdAt: session.createdAt
        }));
        break;
        
      case 'customers':
        const customers = await SandboxCustomer.find({ userId });
        data = customers.map(customer => ({
          id: customer._id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          totalSpent: customer.totalSpent,
          totalTransactions: customer.totalTransactions,
          createdAt: customer.createdAt
        }));
        break;
        
      case 'revenue':
        const revenueSessions = await SandboxSession.find({
          userId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        });
        data = revenueSessions.map(session => ({
          id: session._id,
          amount: session.amount,
          currency: session.currency,
          customerEmail: session.customerEmail,
          createdAt: session.createdAt
        }));
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${timeRange}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data,
        metadata: {
          type,
          timeRange,
          recordCount: data.length,
          exportedAt: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return csvContent;
};