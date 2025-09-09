import crypto from 'crypto';
import { logger } from '../../utils/helpers/logger';

export interface EncryptionResult {
  success: boolean;
  encrypted?: string;
  decrypted?: string;
  message?: string;
  error?: string;
}

export interface HashResult {
  success: boolean;
  hash?: string;
  message?: string;
  error?: string;
}

/**
 * Crypto Service
 * Handles encryption, decryption, and cryptographic operations
 */
export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000;

  /**
   * Generate random bytes
   */
  static generateRandomBytes(length: number): Buffer {
    try {
      return crypto.randomBytes(length);
    } catch (error) {
      logger.error('Failed to generate random bytes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        length
      });
      throw error;
    }
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number): string {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      logger.error('Failed to generate random string', {
        error: error instanceof Error ? error.message : 'Unknown error',
        length
      });
      throw error;
    }
  }

  /**
   * Generate encryption key from password
   */
  static generateKeyFromPassword(password: string, salt?: Buffer): {
    key: Buffer;
    salt: Buffer;
  } {
    try {
      const saltBuffer = salt || this.generateRandomBytes(this.SALT_LENGTH);
      const key = crypto.pbkdf2Sync(
        password,
        saltBuffer,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha512'
      );

      return { key, salt: saltBuffer };
    } catch (error) {
      logger.error('Failed to generate key from password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Encrypt data
   */
  static encrypt(data: string, key: Buffer): EncryptionResult {
    try {
      const iv = this.generateRandomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, encrypted data, and tag
      const result = iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
      
      logger.debug('Data encrypted successfully');
      
      return {
        success: true,
        encrypted: result,
        message: 'Data encrypted successfully'
      };
    } catch (error) {
      logger.error('Failed to encrypt data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to encrypt data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decrypt data
   */
  static decrypt(encryptedData: string, key: Buffer): EncryptionResult {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return {
          success: false,
          message: 'Invalid encrypted data format'
        };
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const tag = Buffer.from(parts[2], 'hex');

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('Data decrypted successfully');

      return {
        success: true,
        decrypted,
        message: 'Data decrypted successfully'
      };
    } catch (error) {
      logger.error('Failed to decrypt data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to decrypt data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Encrypt data with password
   */
  static encryptWithPassword(data: string, password: string): EncryptionResult {
    try {
      const { key, salt } = this.generateKeyFromPassword(password);
      const encryptResult = this.encrypt(data, key);

      if (!encryptResult.success) {
        return encryptResult;
      }

      // Combine salt and encrypted data
      const result = salt.toString('hex') + ':' + encryptResult.encrypted;

      return {
        success: true,
        encrypted: result,
        message: 'Data encrypted with password successfully'
      };
    } catch (error) {
      logger.error('Failed to encrypt data with password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to encrypt data with password',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decrypt data with password
   */
  static decryptWithPassword(encryptedData: string, password: string): EncryptionResult {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        return {
          success: false,
          message: 'Invalid encrypted data format'
        };
      }

      const salt = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1] + ':' + parts[2] + ':' + parts[3];

      const { key } = this.generateKeyFromPassword(password, salt);
      const decryptResult = this.decrypt(encrypted, key);

      return decryptResult;
    } catch (error) {
      logger.error('Failed to decrypt data with password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to decrypt data with password',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Hash data with salt
   */
  static hashWithSalt(data: string, salt?: Buffer): HashResult {
    try {
      const saltBuffer = salt || this.generateRandomBytes(this.SALT_LENGTH);
      const hash = crypto.pbkdf2Sync(
        data,
        saltBuffer,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha512'
      );

      const result = saltBuffer.toString('hex') + ':' + hash.toString('hex');

      logger.debug('Data hashed with salt successfully');

      return {
        success: true,
        hash: result,
        message: 'Data hashed with salt successfully'
      };
    } catch (error) {
      logger.error('Failed to hash data with salt', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to hash data with salt',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify hash
   */
  static verifyHash(data: string, hash: string): boolean {
    try {
      const parts = hash.split(':');
      if (parts.length !== 2) {
        return false;
      }

      const salt = Buffer.from(parts[0], 'hex');
      const storedHash = parts[1];

      const computedHash = crypto.pbkdf2Sync(
        data,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha512'
      );

      const isValid = crypto.timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        computedHash
      );

      logger.debug('Hash verification completed', { isValid });

      return isValid;
    } catch (error) {
      logger.error('Failed to verify hash', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Generate HMAC
   */
  static generateHMAC(data: string, secret: string): string {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(data);
      return hmac.digest('hex');
    } catch (error) {
      logger.error('Failed to generate HMAC', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Verify HMAC
   */
  static verifyHMAC(data: string, secret: string, expectedHMAC: string): boolean {
    try {
      const computedHMAC = this.generateHMAC(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(computedHMAC, 'hex'),
        Buffer.from(expectedHMAC, 'hex')
      );
    } catch (error) {
      logger.error('Failed to verify HMAC', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Generate SHA256 hash
   */
  static generateSHA256(data: string): string {
    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      logger.error('Failed to generate SHA256 hash', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate MD5 hash
   */
  static generateMD5(data: string): string {
    try {
      return crypto.createHash('md5').update(data).digest('hex');
    } catch (error) {
      logger.error('Failed to generate MD5 hash', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    try {
      return crypto.randomBytes(length).toString('base64url');
    } catch (error) {
      logger.error('Failed to generate secure token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        length
      });
      throw error;
    }
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    try {
      return crypto.randomUUID();
    } catch (error) {
      logger.error('Failed to generate UUID', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Encrypt sensitive data for storage
   */
  static encryptSensitiveData(data: string, masterKey: string): EncryptionResult {
    try {
      const key = crypto.scryptSync(masterKey, 'transactlab-salt', this.KEY_LENGTH);
      return this.encrypt(data, key);
    } catch (error) {
      logger.error('Failed to encrypt sensitive data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to encrypt sensitive data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decrypt sensitive data from storage
   */
  static decryptSensitiveData(encryptedData: string, masterKey: string): EncryptionResult {
    try {
      const key = crypto.scryptSync(masterKey, 'transactlab-salt', this.KEY_LENGTH);
      return this.decrypt(encryptedData, key);
    } catch (error) {
      logger.error('Failed to decrypt sensitive data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to decrypt sensitive data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate API key hash
   */
  static hashApiKey(apiKey: string): string {
    try {
      return this.generateSHA256(apiKey);
    } catch (error) {
      logger.error('Failed to hash API key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate webhook signature
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    try {
      return this.generateHMAC(payload, secret);
    } catch (error) {
      logger.error('Failed to generate webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      return this.verifyHMAC(payload, secret, signature);
    } catch (error) {
      logger.error('Failed to verify webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

export default CryptoService; 