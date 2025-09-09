import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/helpers/logger';
import app from './app';

/**
 * Server Startup
 */
const PORT = process.env['PORT'] || 3000;
const HOST = process.env['HOST'] || 'localhost';

/**
 * Create HTTP server
 */
const server = createServer(app);

/**
 * Initialize server
 */
async function startServer() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('Database connected successfully');

    // Try to connect to Redis (optional)
    logger.info('Connecting to Redis...');
    try {
      await redisClient.connect();
      if (redisClient.isAvailable()) {
        logger.info('Redis connected successfully');
      } else {
        logger.warn('Redis connection failed, continuing without Redis');
      }
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError);
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 TransactLab server started successfully`);
      logger.info(`📍 Server running on http://${HOST}:${PORT}`);
      logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`📚 API docs: http://${HOST}:${PORT}/docs`);
      logger.info(`🔗 API endpoint: http://${HOST}:${PORT}/api/v1`);
      
      // Log startup information
      console.log('\n' + '='.repeat(60));
      console.log('🎯 TransactLab Payment Gateway Simulation');
      console.log('='.repeat(60));
      console.log(`📍 Server: http://${HOST}:${PORT}`);
      console.log(`📊 Health: http://${HOST}:${PORT}/health`);
      console.log(`📚 Docs: http://${HOST}:${PORT}/docs`);
      console.log(`🔗 API: http://${HOST}:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log('='.repeat(60) + '\n');
    });

  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    // Disconnect Redis if available
    try {
      if (redisClient.isAvailable()) {
        await redisClient.disconnect();
      }
    } catch (redisError) {
      logger.warn('Error disconnecting Redis during shutdown:', redisError);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason
  });
  process.exit(1);
});

// Start the server
startServer();

export default server; 