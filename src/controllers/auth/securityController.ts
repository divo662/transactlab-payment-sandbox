import { Request, Response } from 'express';
import { User } from '../../models';
import { SecurityService } from '../../services/auth/securityService';
import { EmailService } from '../../services/notification/emailService';
import { logger } from '../../utils/helpers/logger';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class SecurityController {
  /**
   * Setup TOTP (Google Authenticator) for user
   * POST /api/v1/auth/security/totp/setup
   */
  static async setupTotp(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if ((user as any).totpEnabled) {
        res.status(400).json({
          success: false,
          message: 'TOTP is already enabled for this account'
        });
        return;
      }

      const { secret, qrCode, backupCodes } = await SecurityService.generateTotpSetup(userId);

      res.status(200).json({
        success: true,
        message: 'TOTP setup generated successfully',
        data: {
          secret,
          qrCode,
          backupCodes
        }
      });
    } catch (error) {
      logger.error('Error setting up TOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup TOTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify TOTP setup and enable 2FA
   * POST /api/v1/auth/security/totp/verify
   */
  static async verifyTotpSetup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      const { code } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          message: 'TOTP code is required'
        });
        return;
      }

      const verified = await SecurityService.verifyTotpSetup(userId, code);

      if (verified) {
        const user = await User.findById(userId);
        if (user) {
          // Send confirmation email
          await EmailService.sendTemplatedEmail('totp_setup', user.email, {
            customerName: `${user.firstName} ${user.lastName}`,
            dashboardUrl: `${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/dashboard`
          });
        }

        res.status(200).json({
          success: true,
          message: 'Two-Factor Authentication enabled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid TOTP code'
        });
      }
    } catch (error) {
      logger.error('Error verifying TOTP setup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify TOTP setup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Disable TOTP for user
   * DELETE /api/v1/auth/security/totp
   */
  static async disableTotp(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required to disable 2FA'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify password before disabling 2FA
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
        return;
      }

      await SecurityService.disableTotp(userId);

      res.status(200).json({
        success: true,
        message: 'Two-Factor Authentication disabled successfully'
      });
    } catch (error) {
      logger.error('Error disabling TOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable TOTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user's trusted devices
   * GET /api/v1/auth/security/devices
   */
  static async getTrustedDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      
      const devices = await SecurityService.getTrustedDevices(userId);

      res.status(200).json({
        success: true,
        message: 'Trusted devices retrieved successfully',
        data: {
          devices
        }
      });
    } catch (error) {
      logger.error('Error getting trusted devices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trusted devices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Remove a trusted device
   * DELETE /api/v1/auth/security/devices/:deviceId
   */
  static async removeTrustedDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      const { deviceId } = req.params;

      if (!deviceId) {
        res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
        return;
      }

      await SecurityService.removeTrustedDevice(userId, deviceId);

      res.status(200).json({
        success: true,
        message: 'Device removed successfully'
      });
    } catch (error) {
      logger.error('Error removing trusted device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove trusted device',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update security settings
   * PUT /api/v1/auth/security/settings
   */
  static async updateSecuritySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      const {
        requireEmailVerification,
        allowNewDeviceLogin,
        notifyOnNewDevice,
        requireTwoFactor,
        sessionTimeout,
        maxConcurrentSessions
      } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Update security settings
      if (requireEmailVerification !== undefined) {
        (user as any).securitySettings.requireEmailVerification = requireEmailVerification;
      }
      if (allowNewDeviceLogin !== undefined) {
        (user as any).securitySettings.allowNewDeviceLogin = allowNewDeviceLogin;
      }
      if (notifyOnNewDevice !== undefined) {
        (user as any).securitySettings.notifyOnNewDevice = notifyOnNewDevice;
      }
      if (requireTwoFactor !== undefined) {
        (user as any).securitySettings.requireTwoFactor = requireTwoFactor;
      }
      if (sessionTimeout !== undefined) {
        (user as any).securitySettings.sessionTimeout = sessionTimeout;
      }
      if (maxConcurrentSessions !== undefined) {
        (user as any).securitySettings.maxConcurrentSessions = maxConcurrentSessions;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Security settings updated successfully',
        data: {
          securitySettings: (user as any).securitySettings
        }
      });
    } catch (error) {
      logger.error('Error updating security settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update security settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get security settings
   * GET /api/v1/auth/security/settings
   */
  static async getSecuritySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Security settings retrieved successfully',
        data: {
          securitySettings: (user as any).securitySettings,
          totpEnabled: (user as any).totpEnabled,
          trustedDevicesCount: (user as any).trustedDevices?.length || 0
        }
      });
    } catch (error) {
      logger.error('Error getting security settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get security settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate new backup codes
   * POST /api/v1/auth/security/totp/backup-codes
   */
  static async generateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id?.toString();
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required to generate backup codes'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
        return;
      }

      const backupCodes = (user as any).generateTotpBackupCodes();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Backup codes generated successfully',
        data: {
          backupCodes
        }
      });
    } catch (error) {
      logger.error('Error generating backup codes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate backup codes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default SecurityController;
