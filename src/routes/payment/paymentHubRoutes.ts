import { Router } from 'express';
import paymentHubController from '../../controllers/payment/paymentHubController';
import { authenticateToken } from '../../middleware/auth';
import { validateMerchantAccess } from '../../middleware/merchantAccess';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Payment Channel Routes
router.post('/merchants/:merchantId/channels', validateMerchantAccess, paymentHubController.createPaymentChannel);
router.get('/merchants/:merchantId/channels', validateMerchantAccess, paymentHubController.getPaymentChannels);
router.get('/channels/:channelId', paymentHubController.getPaymentChannel);
router.put('/channels/:channelId', paymentHubController.updatePaymentChannel);
router.delete('/channels/:channelId', paymentHubController.deletePaymentChannel);

// Product Routes
router.post('/merchants/:merchantId/products', validateMerchantAccess, paymentHubController.createProduct);
router.get('/merchants/:merchantId/products', validateMerchantAccess, paymentHubController.getProducts);
router.get('/products/:productId', paymentHubController.getProduct);
router.put('/products/:productId', paymentHubController.updateProduct);
router.delete('/products/:productId', paymentHubController.deleteProduct);
router.get('/merchants/:merchantId/products/search', validateMerchantAccess, paymentHubController.searchProducts);

// Payment Link Routes
router.post('/merchants/:merchantId/links', validateMerchantAccess, paymentHubController.createPaymentLink);
router.get('/merchants/:merchantId/links', validateMerchantAccess, paymentHubController.getPaymentLinks);
router.get('/links/:linkId', paymentHubController.getPaymentLink);
router.put('/links/:linkId', paymentHubController.updatePaymentLink);
router.delete('/links/:linkId', paymentHubController.deletePaymentLink);

// Dashboard and Statistics
router.get('/merchants/:merchantId/stats', validateMerchantAccess, paymentHubController.getPaymentHubStats);

// Public Payment Link (no authentication required for customers)
router.get('/pay/:linkId', paymentHubController.getPublicPaymentLink);

// Utility Routes (Admin only)
router.post('/admin/cleanup-expired-links', paymentHubController.cleanupExpiredLinks);

export default router;
