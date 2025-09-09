// Export auth middleware functions
export { authenticateToken, optionalAuth, authenticateRefreshToken } from './authMiddleware';
export { authenticateApiKey, requireApiKeyPermission, checkApiKeyLimits, validateApiKey } from './apiKeyMiddleware';
export { requireRole, requireAdmin, requireMerchant, requireUser, requireSelfOrAdmin, requireMerchantOrAdmin, requirePermission, requireTier } from './roleMiddleware';

// Default export for convenience
import { authenticateToken, optionalAuth, authenticateRefreshToken } from './authMiddleware';
import { authenticateApiKey, requireApiKeyPermission, checkApiKeyLimits, validateApiKey } from './apiKeyMiddleware';
import { requireRole, requireAdmin, requireMerchant, requireUser, requireSelfOrAdmin, requireMerchantOrAdmin, requirePermission, requireTier } from './roleMiddleware';

export default {
  authenticateToken,
  optionalAuth,
  authenticateRefreshToken,
  authenticateApiKey,
  requireApiKeyPermission,
  checkApiKeyLimits,
  validateApiKey,
  requireRole,
  requireAdmin,
  requireMerchant,
  requireUser,
  requireSelfOrAdmin,
  requireMerchantOrAdmin,
  requirePermission,
  requireTier
}; 