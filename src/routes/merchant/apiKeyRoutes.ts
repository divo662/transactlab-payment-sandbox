import { Router } from 'express';
import { ApiKeyController } from '../../controllers/merchant/apiKeyController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/merchant/api-keys
 * @desc    Create new API key
 * @access  Private (Merchant)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.apiKey, 
  validateRequest('createApiKey'),
  ApiKeyController.createApiKey
);

/**
 * @route   GET /api/v1/merchant/api-keys
 * @desc    List API keys
 * @access  Private (Merchant)
 */
router.get('/', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  ApiKeyController.listApiKeys
);

/**
 * @route   GET /api/v1/merchant/api-keys/:id
 * @desc    Get API key by ID
 * @access  Private (Merchant)
 */
router.get('/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  ApiKeyController.getApiKey
);

/**
 * @route   PUT /api/v1/merchant/api-keys/:id
 * @desc    Update API key
 * @access  Private (Merchant)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.apiKey, 
  validateRequest('updateApiKey'),
  ApiKeyController.updateApiKey
);

/**
 * @route   POST /api/v1/merchant/api-keys/:id/revoke
 * @desc    Revoke API key
 * @access  Private (Merchant)
 */
router.post('/:id/revoke', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.apiKey, 
  ApiKeyController.revokeApiKey
);

/**
 * @route   POST /api/v1/merchant/api-keys/:id/reactivate
 * @desc    Reactivate API key
 * @access  Private (Merchant)
 */
router.post('/:id/reactivate', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.apiKey, 
  ApiKeyController.reactivateApiKey
);

/**
 * @route   GET /api/v1/merchant/api-keys/stats
 * @desc    Get API key statistics
 * @access  Private (Merchant)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  ApiKeyController.getApiKeyStats
);

/**
 * @route   POST /api/v1/merchant/api-keys/validate
 * @desc    Validate API key
 * @access  Public
 */
router.post('/validate', 
  rateLimiters.apiKey, 
  validateRequest('validateApiKey'),
  ApiKeyController.validateApiKey
);

export default router; 