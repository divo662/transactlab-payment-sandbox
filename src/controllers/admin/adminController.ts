import { Request, Response } from 'express';
import { logger } from '../../utils/helpers/logger';
import User from '../../models/User';
import Transaction from '../../models/Transaction';
import Refund from '../../models/Refund';
import Subscription from '../../models/Subscription';

interface AdminDashboardRequest {
  period?: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateUserRequest {
  userId: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
  isVerified?: boolean;
}

interface UpdateMerchantRequest {
  merchantId: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export class AdminController {
  /**
   * Get admin dashboard
   * GET /api/v1/admin/dashboard
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d', startDate, endDate }: AdminDashboardRequest = req.query;

      // Calculate date range
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Use custom date range if provided
      if (startDate && endDate) {
        start = new Date(startDate);
        const end = new Date(endDate);
      }

      // Get dashboard statistics
      const [
        totalUsers,
        totalTransactions,
        totalRevenue,
        activeUsers,
        recentTransactions
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: start } }),
        Transaction.countDocuments({ createdAt: { $gte: start } }),
        Transaction.aggregate([
          { $match: { status: 'success', createdAt: { $gte: start } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        User.countDocuments({ lastLogin: { $gte: start } }),
        Transaction.find({ createdAt: { $gte: start } })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('merchantId', 'businessName')
      ]);

      const revenue = totalRevenue[0]?.total || 0;

      logger.info('Admin dashboard data retrieved');

      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          period,
          overview: {
            totalUsers,
            totalTransactions,
            totalRevenue: revenue,
            activeUsers
          },
          recentTransactions: recentTransactions.map(tx => ({
            id: tx._id,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            merchant: (tx as any).merchantId?.businessName || 'Unknown',
            customer: tx.customerName || tx.customerEmail || 'Anonymous',
            createdAt: tx.createdAt
          }))
        }
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data',
        message: 'An error occurred while retrieving dashboard data'
      });
    }
  }

  /**
   * Get all users
   * GET /api/v1/admin/users
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const perPage = parseInt(req.query['perPage'] as string) || 20;
      const search = req.query['search'] as string;
      const role = req.query['role'] as string;
      const isActive = req.query['isActive'] as string;

      const limit = Math.min(perPage, 100);
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      logger.info('All users retrieved by admin');

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          })),
          pagination: {
            page: Number(page),
            perPage: Number(perPage),
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        message: 'An error occurred while retrieving users'
      });
    }
  }

  /**
   * Update user
   * PUT /api/v1/admin/users/:id
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role, isActive, isVerified }: UpdateUserRequest = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Store original values for comparison
      const originalIsActive = user.isActive;
      const originalIsVerified = user.isVerified;
      const originalRole = user.role;

      // Update fields
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      if (isVerified !== undefined) user.isVerified = isVerified;

      await user.save();

      // Send notification emails for status changes
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        
        // Send account activation email
        if (!originalIsActive && user.isActive) {
          await EmailService.sendAccountActivatedEmail(user.email, {
            customerName: user.firstName,
            businessName: 'TransactLab'
          });
          logger.info(`Account activation email sent to: ${user.email}`);
        }
        
        // Send account deactivation email
        if (originalIsActive && !user.isActive) {
          await EmailService.sendAccountDeactivatedEmail(user.email, {
            customerName: user.firstName,
            businessName: 'TransactLab'
          });
          logger.info(`Account deactivation email sent to: ${user.email}`);
        }
        
        // Send verification email
        if (!originalIsVerified && user.isVerified) {
          await EmailService.sendAccountVerifiedEmail(user.email, {
            customerName: user.firstName,
            businessName: 'TransactLab'
          });
          logger.info(`Account verification email sent to: ${user.email}`);
        }
        
        // Send role change email
        if (originalRole !== user.role) {
          await EmailService.sendRoleChangedEmail(user.email, {
            customerName: user.firstName,
            oldRole: originalRole,
            newRole: user.role,
            businessName: 'TransactLab'
          });
          logger.info(`Role change email sent to: ${user.email}`);
        }
      } catch (emailError) {
        logger.error('Failed to send admin notification emails:', emailError);
        // Don't fail admin update if emails fail
      }

      logger.info(`User updated by admin: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        message: 'An error occurred while updating the user'
      });
    }
  }

  // Merchant-related admin endpoints removed as User no longer stores merchant fields

  /**
   * Get system statistics
   * GET /api/v1/admin/stats
   */
  static async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get comprehensive statistics
      const [
        userStats,
        transactionStats,
        revenueStats
      ] = await Promise.all([
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ]),
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ]),
        Transaction.aggregate([
          {
            $match: {
              status: 'success',
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              revenue: { $sum: '$amount' },
              fees: { $sum: '$fees' },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ])
      ]);

      logger.info('System statistics retrieved by admin');

      res.status(200).json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: {
          period,
          userStats,
          transactionStats,
          revenueStats
        }
      });
    } catch (error) {
      logger.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system statistics',
        message: 'An error occurred while retrieving system statistics'
      });
    }
  }

  /**
   * Get system logs
   * GET /api/v1/admin/logs
   */
  static async getSystemLogs(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement actual log retrieval from log storage
      // For now, return mock data
      const logs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'System started successfully',
          module: 'system'
        },
        {
          timestamp: new Date(Date.now() - 60000),
          level: 'info',
          message: 'Database connection established',
          module: 'database'
        }
      ];

      logger.info('System logs retrieved by admin');

      res.status(200).json({
        success: true,
        message: 'System logs retrieved successfully',
        data: {
          logs
        }
      });
    } catch (error) {
      logger.error('Get system logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system logs',
        message: 'An error occurred while retrieving system logs'
      });
    }
  }
}

export default AdminController; 