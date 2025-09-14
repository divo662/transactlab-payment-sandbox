import { Request } from 'express';
import { User } from '../../models';
import { EmailService } from '../notification/emailService';
import { logger } from '../../utils/helpers/logger';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  userAgent: string;
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  fingerprint: string;
}

export interface LoginAttempt {
  userId: string;
  email: string;
  deviceInfo: DeviceInfo;
  success: boolean;
  timestamp: Date;
  reason?: string;
}

export class SecurityService {
  /**
   * Generate device fingerprint from request
   */
  static generateDeviceFingerprint(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const connection = req.get('Connection') || '';
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}-${acceptLanguage}-${acceptEncoding}-${connection}`)
      .digest('hex');
    
    return fingerprint;
  }

  /**
   * Extract device information from request
   */
  static extractDeviceInfo(req: Request): DeviceInfo {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const deviceId = crypto.createHash('md5').update(`${userAgent}-${ipAddress}`).digest('hex');
    
    // Detect device type from user agent
    let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/Windows|Macintosh|Linux|X11/i.test(userAgent)) {
      deviceType = 'desktop';
    }

    // Extract device name from user agent
    let deviceName = 'Unknown Device';
    if (/Windows NT 10/i.test(userAgent)) deviceName = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(userAgent)) deviceName = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(userAgent)) deviceName = 'Windows 7';
    else if (/Mac OS X/i.test(userAgent)) deviceName = 'macOS';
    else if (/Linux/i.test(userAgent)) deviceName = 'Linux';
    else if (/Android/i.test(userAgent)) deviceName = 'Android Device';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) deviceName = 'iOS Device';

    return {
      deviceId,
      deviceName,
      deviceType,
      userAgent,
      ipAddress,
      fingerprint: this.generateDeviceFingerprint(req)
    };
  }

  /**
   * Check if device is trusted for user
   */
  static async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      return (user as any).isDeviceTrusted(deviceId);
    } catch (error) {
      logger.error('Error checking device trust status:', error);
      return false;
    }
  }

  /**
   * Add device to trusted devices
   */
  static async addTrustedDevice(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      await (user as any).addTrustedDevice(deviceInfo);
      logger.info('Device added to trusted devices', { userId, deviceId: deviceInfo.deviceId });
    } catch (error) {
      logger.error('Error adding trusted device:', error);
      throw error;
    }
  }

  /**
   * Remove device from trusted devices
   */
  static async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      await (user as any).removeTrustedDevice(deviceId);
      logger.info('Device removed from trusted devices', { userId, deviceId });
    } catch (error) {
      logger.error('Error removing trusted device:', error);
      throw error;
    }
  }

  /**
   * Send new device login alert email
   */
  static async sendNewDeviceAlert(user: any, deviceInfo: DeviceInfo, loginAttempt: LoginAttempt): Promise<void> {
    try {
      logger.info('sendNewDeviceAlert called', {
        userId: user._id,
        email: user.email,
        notifyOnNewDevice: user.securitySettings?.notifyOnNewDevice,
        hasSecuritySettings: !!user.securitySettings
      });

      if (!user.securitySettings?.notifyOnNewDevice) {
        logger.info('New device notifications disabled for user', { userId: user._id });
        return;
      }

      const location = deviceInfo.location 
        ? `${deviceInfo.location.city || 'Unknown City'}, ${deviceInfo.location.region || 'Unknown Region'}, ${deviceInfo.location.country || 'Unknown Country'}`
        : 'Unknown Location';

      await EmailService.sendEmail({
        to: user.email,
        subject: '🔒 New Device Login Alert - TransactLab',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🔒 New Device Login Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Security notification from TransactLab</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                We detected a login attempt from a new device on your TransactLab account. If this was you, no action is needed. If this wasn't you, please secure your account immediately.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Login Details:</h3>
                <ul style="color: #555; line-height: 1.6; list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong> Date & Time:</strong> ${loginAttempt.timestamp.toLocaleString()}</li>
                  <li style="margin-bottom: 10px;"><strong> Device:</strong> ${deviceInfo.deviceName}</li>
                  <li style="margin-bottom: 10px;"><strong> IP Address:</strong> ${deviceInfo.ipAddress}</li>
                  <li style="margin-bottom: 10px;"><strong> Location:</strong> ${location}</li>
                  <li style="margin-bottom: 10px;"><strong> User Agent:</strong> ${deviceInfo.userAgent.substring(0, 100)}...</li>
                </ul>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Security Tip:</strong> If you don't recognize this device, please change your password immediately and enable two-factor authentication for added security.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/dashboard/security" 
                   style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin-right: 10px;">
                  View Security Settings
                </a>
                <a href="${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/dashboard" 
                   style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>
              
              <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
                Best regards,<br>The TransactLab Security Team
              </p>
            </div>
          </div>
        `,
        text: `
          New Device Login Alert - TransactLab
          
          Hello ${user.firstName} ${user.lastName},
          
          We detected a login attempt from a new device on your TransactLab account.
          
          Login Details:
          - Date & Time: ${loginAttempt.timestamp.toLocaleString()}
          - Device: ${deviceInfo.deviceName}
          - IP Address: ${deviceInfo.ipAddress}
          - Location: ${location}
          
          If you don't recognize this device, please change your password immediately.
          
          Security Settings: ${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/dashboard/security
          
          Best regards,
          The TransactLab Security Team
        `
      });

      logger.info('New device alert email sent successfully', { 
        userId: user._id, 
        email: user.email, 
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        location: location
      });
    } catch (error) {
      logger.error('Error sending new device alert email:', error);
      // Don't throw error to avoid breaking login flow
    }
  }

  /**
   * Generate TOTP secret and QR code
   */
  static async generateTotpSetup(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `TransactLab (${user.email})`,
        issuer: 'TransactLab',
        length: 32
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = (user as any).generateTotpBackupCodes();

      // Save secret to user (but don't enable TOTP yet)
      (user as any).totpSecret = secret.base32;
      await user.save();

      return {
        secret: secret.base32!,
        qrCode,
        backupCodes
      };
    } catch (error) {
      logger.error('Error generating TOTP setup:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP code and enable 2FA
   */
  static async verifyTotpSetup(userId: string, code: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for TOTP verification', { userId });
        throw new Error('User not found');
      }

      if (!(user as any).totpSecret) {
        logger.error('TOTP secret not found for user', { 
          userId, 
          hasTotpSecret: !!(user as any).totpSecret,
          totpEnabled: (user as any).totpEnabled 
        });
        throw new Error('TOTP secret not found. Please complete TOTP setup first.');
      }

      logger.info('Verifying TOTP code', { 
        userId, 
        code, 
        secretLength: (user as any).totpSecret?.length,
        totpEnabled: (user as any).totpEnabled 
      });

      const verified = speakeasy.totp.verify({
        secret: (user as any).totpSecret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      logger.info('TOTP verification result', { userId, verified });

      if (verified) {
        (user as any).totpEnabled = true;
        await user.save();
        logger.info('TOTP enabled for user', { userId });
      }

      return verified;
    } catch (error) {
      logger.error('Error verifying TOTP setup:', error);
      return false;
    }
  }

  /**
   * Check if user has TOTP setup ready for verification
   */
  static async isTotpSetupReady(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      return !!(user && (user as any).totpSecret && !(user as any).totpEnabled);
    } catch (error) {
      logger.error('Error checking TOTP setup status:', error);
      return false;
    }
  }

  /**
   * Verify TOTP code for login
   */
  static async verifyTotpLogin(userId: string, code: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      // Check if it's a backup code
      if ((user as any).isBackupCodeValid(code)) {
        await (user as any).useBackupCode(code);
        return true;
      }

      // Verify TOTP code
      return await (user as any).verifyTotpCode(code);
    } catch (error) {
      logger.error('Error verifying TOTP login:', error);
      return false;
    }
  }

  /**
   * Disable TOTP for user
   */
  static async disableTotp(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      (user as any).totpEnabled = false;
      (user as any).totpSecret = undefined;
      (user as any).totpBackupCodes = undefined;
      await user.save();

      logger.info('TOTP disabled for user', { userId });
    } catch (error) {
      logger.error('Error disabling TOTP:', error);
      throw error;
    }
  }

  /**
   * Get user's trusted devices
   */
  static async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      return (user as any).trustedDevices.map((device: any) => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        lastUsed: device.lastUsed,
        isTrusted: device.isTrusted,
        location: device.location
      }));
    } catch (error) {
      logger.error('Error getting trusted devices:', error);
      return [];
    }
  }

  /**
   * Log login attempt
   */
  static async logLoginAttempt(loginAttempt: LoginAttempt): Promise<void> {
    try {
      logger.info('Login attempt logged', {
        userId: loginAttempt.userId,
        email: loginAttempt.email,
        deviceId: loginAttempt.deviceInfo.deviceId,
        success: loginAttempt.success,
        timestamp: loginAttempt.timestamp,
        reason: loginAttempt.reason
      });

      // Here you could also save to a separate LoginAttempts collection
      // for more detailed analytics and monitoring
    } catch (error) {
      logger.error('Error logging login attempt:', error);
    }
  }
}

export default SecurityService;
