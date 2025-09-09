import { logger } from '../utils/helpers/logger';

// Environment validation schema
interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  
  // Database Configuration
  MONGODB_URI: string;
  REDIS_URL: string;
  
  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Email Configuration
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  
  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
  
  // Webhook Configuration
  WEBHOOK_TIMEOUT: number;
  WEBHOOK_MAX_RETRIES: number;
  
  // Analytics
  ANALYTICS_ENABLED: boolean;
  FRAUD_DETECTION_ENABLED: boolean;
  
  // Security
  TRUSTED_IPS: string[];
  CORS_ORIGINS: string[];
  
  // Optional configurations
  LOG_LEVEL: string;
  SENTRY_DSN?: string;
  NEW_RELIC_LICENSE_KEY?: string;
}

// Default environment values
const DEFAULT_ENV: Partial<EnvironmentConfig> = {
  NODE_ENV: 'development',
  PORT: 5000,
  API_VERSION: 'v1',
  MONGODB_URI: 'mongodb://localhost:27017/transactlab',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'your-refresh-secret-change-in-production',
  JWT_REFRESH_EXPIRES_IN: '7d',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASS: '',
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: '',
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  MAX_FILE_SIZE: 5242880,
  UPLOAD_PATH: './uploads',
  WEBHOOK_TIMEOUT: 10000,
  WEBHOOK_MAX_RETRIES: 3,
  ANALYTICS_ENABLED: true,
  FRAUD_DETECTION_ENABLED: true,
  TRUSTED_IPS: [],
  CORS_ORIGINS: [
    'https://transactlab-payment-sandbox.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://transactlab.com',
    'https://www.transactlab.com',
    'https://app.transactlab.com'
  ],
  LOG_LEVEL: 'info'
};

// Environment validation function
export const validateEnvironment = (): EnvironmentConfig => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Helper function to get environment variable with type conversion
  const getEnv = (key: string, type: 'string' | 'number' | 'boolean' | 'array', required: boolean = true): any => {
    const value = process.env[key];
    
    if (!value && required) {
      errors.push(`Missing required environment variable: ${key}`);
      return DEFAULT_ENV[key as keyof EnvironmentConfig];
    }
    
    if (!value && !required) {
      return DEFAULT_ENV[key as keyof EnvironmentConfig];
    }
    
    switch (type) {
      case 'number':
        const numValue = parseInt(value!);
        if (isNaN(numValue)) {
          errors.push(`Invalid number for environment variable: ${key}`);
          return DEFAULT_ENV[key as keyof EnvironmentConfig];
        }
        return numValue;
        
      case 'boolean':
        return value === 'true' || value === '1';
        
      case 'array':
        return value ? value.split(',').map(item => item.trim()) : [];
        
      default:
        return value;
    }
  };
  
  // Validate required environment variables
  const config: EnvironmentConfig = {
    // Server Configuration
    NODE_ENV: getEnv('NODE_ENV', 'string'),
    PORT: getEnv('PORT', 'number'),
    API_VERSION: getEnv('API_VERSION', 'string'),
    
    // Database Configuration
    MONGODB_URI: getEnv('MONGODB_URI', 'string'),
    REDIS_URL: getEnv('REDIS_URL', 'string'),
    
    // JWT Configuration
    JWT_SECRET: getEnv('JWT_SECRET', 'string'),
    JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', 'string'),
    JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'string'),
    JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', 'string'),
    
    // Email Configuration
    SMTP_HOST: getEnv('SMTP_HOST', 'string'),
    SMTP_PORT: getEnv('SMTP_PORT', 'number'),
    SMTP_USER: getEnv('SMTP_USER', 'string', false),
    SMTP_PASS: getEnv('SMTP_PASS', 'string', false),
    
    // Redis Configuration
    REDIS_HOST: getEnv('REDIS_HOST', 'string'),
    REDIS_PORT: getEnv('REDIS_PORT', 'number'),
    REDIS_PASSWORD: getEnv('REDIS_PASSWORD', 'string', false),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: getEnv('RATE_LIMIT_WINDOW_MS', 'number'),
    RATE_LIMIT_MAX_REQUESTS: getEnv('RATE_LIMIT_MAX_REQUESTS', 'number'),
    
    // File Upload
    MAX_FILE_SIZE: getEnv('MAX_FILE_SIZE', 'number'),
    UPLOAD_PATH: getEnv('UPLOAD_PATH', 'string'),
    
    // Webhook Configuration
    WEBHOOK_TIMEOUT: getEnv('WEBHOOK_TIMEOUT', 'number'),
    WEBHOOK_MAX_RETRIES: getEnv('WEBHOOK_MAX_RETRIES', 'number'),
    
    // Analytics
    ANALYTICS_ENABLED: getEnv('ANALYTICS_ENABLED', 'boolean'),
    FRAUD_DETECTION_ENABLED: getEnv('FRAUD_DETECTION_ENABLED', 'boolean'),
    
    // Security
    TRUSTED_IPS: getEnv('TRUSTED_IPS', 'array', false),
    CORS_ORIGINS: getEnv('CORS_ORIGINS', 'array', false),
    
    // Optional configurations
    LOG_LEVEL: getEnv('LOG_LEVEL', 'string', false),
    SENTRY_DSN: getEnv('SENTRY_DSN', 'string', false),
    NEW_RELIC_LICENSE_KEY: getEnv('NEW_RELIC_LICENSE_KEY', 'string', false)
  };
  
  // Additional validations
  if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === DEFAULT_ENV.JWT_SECRET) {
      errors.push('JWT_SECRET must be set in production');
    }
    if (config.JWT_REFRESH_SECRET === DEFAULT_ENV.JWT_REFRESH_SECRET) {
      errors.push('JWT_REFRESH_SECRET must be set in production');
    }
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      warnings.push('SMTP credentials not configured - email features will be disabled');
    }
  }
  
  // Validate port range
  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  // Validate MongoDB URI format
  if (!config.MONGODB_URI.startsWith('mongodb://') && !config.MONGODB_URI.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  // Validate Redis URL format
  if (!config.REDIS_URL.startsWith('redis://') && !config.REDIS_URL.startsWith('rediss://')) {
    errors.push('REDIS_URL must be a valid Redis connection string');
  }
  
  // Validate JWT expiration format
  const jwtExpirationRegex = /^\d+[smhd]$/;
  if (!jwtExpirationRegex.test(config.JWT_EXPIRES_IN)) {
    errors.push('JWT_EXPIRES_IN must be in format: <number>[s|m|h|d]');
  }
  if (!jwtExpirationRegex.test(config.JWT_REFRESH_EXPIRES_IN)) {
    errors.push('JWT_REFRESH_EXPIRES_IN must be in format: <number>[s|m|h|d]');
  }
  
  // Validate file size limits
  if (config.MAX_FILE_SIZE < 1024 || config.MAX_FILE_SIZE > 50 * 1024 * 1024) {
    errors.push('MAX_FILE_SIZE must be between 1KB and 50MB');
  }
  
  // Validate webhook timeout
  if (config.WEBHOOK_TIMEOUT < 1000 || config.WEBHOOK_TIMEOUT > 30000) {
    errors.push('WEBHOOK_TIMEOUT must be between 1 second and 30 seconds');
  }
  
  // Validate webhook retries
  if (config.WEBHOOK_MAX_RETRIES < 0 || config.WEBHOOK_MAX_RETRIES > 10) {
    errors.push('WEBHOOK_MAX_RETRIES must be between 0 and 10');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment warnings:', warnings);
  }
  
  // Throw error if there are validation errors
  if (errors.length > 0) {
    logger.error('Environment validation errors:', errors);
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  logger.info('✅ Environment validation passed');
  return config;
};

// Export validated environment configuration
export const ENV = validateEnvironment();

// Environment helper functions
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development';
export const isProduction = (): boolean => ENV.NODE_ENV === 'production';
export const isTest = (): boolean => ENV.NODE_ENV === 'test';

// Security helper functions
export const isTrustedIP = (ip: string): boolean => {
  return ENV.TRUSTED_IPS.includes(ip);
};

export const isAllowedOrigin = (origin: string): boolean => {
  return ENV.CORS_ORIGINS.includes(origin);
};

// Feature flags
export const isAnalyticsEnabled = (): boolean => ENV.ANALYTICS_ENABLED;
export const isFraudDetectionEnabled = (): boolean => ENV.FRAUD_DETECTION_ENABLED;
export const isEmailEnabled = (): boolean => !!(ENV.SMTP_USER && ENV.SMTP_PASS);

// Export environment configuration for use in other modules
export default ENV; 