import { Request, Response, NextFunction } from 'express';
import authMiddleware from './authMiddleware';
import SandboxConfig from '../../models/SandboxConfig';
import SandboxApiKey from '../../models/SandboxApiKey';
import { logger } from '../../utils/helpers/logger';

/**
 * Flexible auth for Sandbox routes:
 * - If Authorization: Bearer <JWT> is present, validate via existing auth middleware
 * - Otherwise, accept secret key headers and resolve the sandbox user by key
 *   Supported headers: x-sandbox-secret, x-transactlab-secret, x-api-key
 */
export const sandboxFlexibleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[sandboxFlexibleAuth] Headers received:', {
      path: req.path,
      method: req.method,
      'x-owner-id': req.headers['x-owner-id'],
      'x-team-id': req.headers['x-team-id'],
      'x-sandbox-secret': req.headers['x-sandbox-secret'],
      'x-api-key': req.headers['x-api-key'],
      authorization: req.headers.authorization ? 'Bearer ***' : 'none'
    });
    
    const authz = req.headers.authorization;
    if (authz && authz.toLowerCase().startsWith('bearer ')) {
      return authMiddleware.authenticateToken(req, res, (err) => {
        if (err) return next(err);
        // After JWT auth, check for workspace scoping headers
        const headerOwner = req.headers['x-owner-id'] || req.headers['X-Owner-Id'];
        if (headerOwner && typeof headerOwner === 'string') {
          console.log('[sandboxFlexibleAuth] Applying workspace scope after JWT auth:', {
            originalUserId: (req as any).user?._id,
            newUserId: headerOwner
          });
          (req as any).user = { _id: headerOwner };
        }
        next();
      });
    }

    const secretHeader = (req.headers['x-sandbox-secret'] || req.headers['x-transactlab-secret']) as string | undefined;
    const apiKeyHeader = (req.headers['x-api-key'] as string | undefined);

    if (!secretHeader && !apiKeyHeader) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Provide Authorization Bearer token or x-sandbox-secret' });
    }

    // 1) Try sandbox secret from SandboxConfig
    if (secretHeader) {
      const cfg = await SandboxConfig.findOne({ testSecretKey: secretHeader });
      if (cfg) {
        (req as any).user = { _id: cfg.userId };
        return next();
      }
      // 2) Try sandbox API secretKey from SandboxApiKey
      const keyBySecret = await SandboxApiKey.findOne({ secretKey: secretHeader, isActive: true });
      if (keyBySecret) {
        const userId = (keyBySecret as any).userId?.toString?.() || (keyBySecret as any).userId;
        (req as any).user = { _id: userId };
        return next();
      }
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid sandbox secret' });
    }

    // 3) Try x-api-key header
    if (apiKeyHeader) {
      const key = await SandboxApiKey.findOne({ apiKey: apiKeyHeader, isActive: true });
      if (!key) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid API key' });
      }
      const userId = (key as any).userId?.toString?.() || (key as any).userId;
      (req as any).user = { _id: userId };
      return next();
    }
    return next();
  } catch (err) {
    logger.error('sandboxFlexibleAuth error', err);
    return res.status(500).json({ success: false, error: 'Internal server error', message: 'Auth failed' });
  }
};

export default { sandboxFlexibleAuth };


