import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { JWT_CONFIG, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../config/jwt';
import { logger } from '../../utils/helpers/logger';

export interface TokenPayload {
  userId: string | Types.ObjectId;
  email: string;
  role: string;
  merchantId?: string | Types.ObjectId;
}

export interface TokenResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  decoded?: TokenPayload;
  message?: string;
  error?: string;
}

/**
 * JWT Service
 * Handles JWT token generation, verification, and management
 */
export class JWTService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    try {
      const tokenPayload = {
        userId: payload.userId.toString(),
        email: payload.email,
        role: payload.role as 'user' | 'admin',
        merchantId: payload.merchantId?.toString()
      };

      const token = generateAccessToken(tokenPayload);

      logger.debug('Access token generated', {
        userId: payload.userId,
        email: payload.email
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: payload.userId
      });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    try {
      const refreshPayload = {
        userId: payload.userId.toString(),
        tokenId: `${payload.userId}-${Date.now()}`
      };

      const refreshToken = generateRefreshToken(refreshPayload);

      logger.debug('Refresh token generated', {
        userId: payload.userId,
        email: payload.email
      });

      return refreshToken;
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: payload.userId
      });
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      logger.info('Tokens generated successfully', {
        userId: payload.userId,
        email: payload.email
      });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Failed to generate tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: payload.userId
      });
      throw error;
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenResult {
    try {
      const decoded = verifyAccessToken(token);

      logger.debug('Access token verified', {
        userId: decoded.userId,
        email: decoded.email
      });

      return {
        success: true,
        decoded: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          merchantId: decoded.merchantId
        },
        message: 'Access token verified successfully'
      };
    } catch (error) {
      logger.warn('Access token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Invalid access token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenResult {
    try {
      const decoded = verifyRefreshToken(token);

      logger.debug('Refresh token verified', {
        userId: decoded.userId,
        tokenId: decoded.tokenId
      });

      return {
        success: true,
        decoded: {
          userId: decoded.userId,
          email: '', // Refresh tokens don't have email
          role: 'user' // Default role for refresh tokens
        },
        message: 'Refresh token verified successfully'
      };
    } catch (error) {
      logger.warn('Refresh token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Invalid refresh token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string): TokenResult {
    try {
      // Verify refresh token
      const refreshResult = this.verifyRefreshToken(refreshToken);
      if (!refreshResult.success || !refreshResult.decoded) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(refreshResult.decoded);

      logger.info('Access token refreshed successfully', {
        userId: refreshResult.decoded.userId,
        email: refreshResult.decoded.email
      });

      return {
        success: true,
        token: newAccessToken,
        message: 'Access token refreshed successfully'
      };
    } catch (error) {
      logger.error('Failed to refresh access token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to refresh access token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decode token without verification
   */
  static decodeToken(token: string): TokenResult {
    try {
      const decoded = jwt.decode(token) as TokenPayload;

      if (!decoded) {
        return {
          success: false,
          message: 'Invalid token format'
        };
      }

      return {
        success: true,
        decoded,
        message: 'Token decoded successfully'
      };
    } catch (error) {
      logger.error('Failed to decode token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to decode token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      logger.error('Failed to get token expiration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      
      if (!expiration) {
        return true;
      }

      return expiration < new Date();
    } catch (error) {
      logger.error('Failed to check token expiration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return true;
    }
  }

  /**
   * Get token payload without verification
   */
  static getTokenPayload(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded || null;
    } catch (error) {
      logger.error('Failed to get token payload', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Generate API key token
   */
  static generateApiKeyToken(apiKey: string, merchantId: Types.ObjectId): string {
    try {
      const payload = {
        userId: `api_${merchantId.toString()}`,
        email: `api@${merchantId.toString()}.transactlab.com`,
        role: 'user' as 'user' | 'admin',
        merchantId: merchantId.toString(),
        apiKey,
        type: 'api_key'
      };

      const token = generateAccessToken(payload);

      logger.debug('API key token generated', {
        merchantId,
        apiKey: apiKey.substring(0, 8) + '...'
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate API key token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });
      throw error;
    }
  }

  /**
   * Verify API key token
   */
  static verifyApiKeyToken(token: string): TokenResult {
    try {
      const decoded = verifyAccessToken(token) as any;

      if (decoded.type !== 'api_key') {
        return {
          success: false,
          message: 'Invalid token type'
        };
      }

      return {
        success: true,
        decoded: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          merchantId: decoded.merchantId
        },
        message: 'API key token verified successfully'
      };
    } catch (error) {
      logger.warn('API key token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Invalid API key token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate webhook signature token
   */
  static generateWebhookSignature(payload: any, secret: string): string {
    try {
      const signature = jwt.sign(payload, secret, {
        expiresIn: '1h' // Webhook signatures last 1 hour
      });

      logger.debug('Webhook signature generated', {
        payloadKeys: Object.keys(payload)
      });

      return signature;
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
  static verifyWebhookSignature(signature: string, payload: any, secret: string): TokenResult {
    try {
      const decoded = jwt.verify(signature, secret) as any;

      // Compare payload
      if (JSON.stringify(decoded) !== JSON.stringify(payload)) {
        return {
          success: false,
          message: 'Payload mismatch'
        };
      }

      return {
        success: true,
        decoded,
        message: 'Webhook signature verified successfully'
      };
    } catch (error) {
      logger.warn('Webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Invalid webhook signature',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }


}

export default JWTService; 