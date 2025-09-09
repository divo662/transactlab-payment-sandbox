import jwt from 'jsonwebtoken';
import { logger } from '../utils/helpers/logger';

// JWT Configuration
export const JWT_CONFIG = {
  // Secret keys
  ACCESS_TOKEN_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-access-key-change-in-production',
  REFRESH_TOKEN_SECRET: process.env['JWT_REFRESH_SECRET'] || 'your-super-secret-jwt-refresh-key-change-in-production',
  
  // Token expiration times
  ACCESS_TOKEN_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  
  // Issuer and audience
  ISSUER: 'transactlab',
  AUDIENCE: 'transactlab-api',
  
  // Algorithm
  ALGORITHM: 'HS256' as const,
  
  // Cookie settings
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
};

// Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  merchantId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Generate access token
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: JWT_CONFIG.ALGORITHM,
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: JWT_CONFIG.ALGORITHM,
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as TokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      logger.error('Error verifying access token:', error);
      throw new Error('Token verification failed');
    }
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token:', error);
      throw new Error('Token verification failed');
    }
  }
};

// Decode token without verification (for logging/debugging)
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

// Get token expiration time
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    logger.error('Error getting token expiration time:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
    return true;
  } catch (error) {
    logger.error('Error checking token expiration:', error);
    return true;
  }
};

// Generate token pair (access + refresh)
export const generateTokenPair = (payload: Omit<TokenPayload, 'iat' | 'exp'>) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({
    userId: payload.userId,
    tokenId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  };
};

// Token blacklist for logout
export class TokenBlacklist {
  private static blacklist = new Set<string>();

  static add(token: string): void {
    this.blacklist.add(token);
  }

  static has(token: string): boolean {
    return this.blacklist.has(token);
  }

  static remove(token: string): void {
    this.blacklist.delete(token);
  }

  static clear(): void {
    this.blacklist.clear();
  }
}

// Check if token is blacklisted
export const isTokenBlacklisted = (token: string): boolean => {
  return TokenBlacklist.has(token);
};

// Logout by blacklisting token
export const logout = (token: string): void => {
  TokenBlacklist.add(token);
}; 