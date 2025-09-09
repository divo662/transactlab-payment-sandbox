import { Router } from 'express';
import { TransactionController } from '../../../controllers/payment/transactionController';
import { rateLimiters } from '../../../config/rateLimit';
import { authenticateToken, requireRole, authenticateApiKey } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/transactions/initialize
 * @desc    Initialize a new transaction
 * @access  Private (Merchant/API Key)
 */
router.post('/initialize', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('initializeTransaction'),
  TransactionController.initializeTransaction
);

/**
 * @route   GET /api/v1/transactions/verify/:reference
 * @desc    Verify transaction by reference
 * @access  Public
 */
router.get('/verify/:reference', TransactionController.verifyTransaction);

/**
 * @route   GET /api/v1/transactions
 * @desc    List transactions
 * @access  Private (Merchant/API Key)
 */
router.get('/', 
  authenticateApiKey, 
  rateLimiters.general, 
  TransactionController.listTransactions
);

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private (Merchant/API Key)
 */
router.get('/:id', 
  authenticateApiKey, 
  TransactionController.getTransaction
);

/**
 * @route   POST /api/v1/transactions/:id/cancel
 * @desc    Cancel transaction
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/cancel', 
  authenticateApiKey, 
  rateLimiters.payment, 
  TransactionController.cancelTransaction
);

/**
 * @route   GET /api/v1/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private (Merchant/API Key)
 */
router.get('/stats', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  TransactionController.getTransactionStats
);

export default router; 