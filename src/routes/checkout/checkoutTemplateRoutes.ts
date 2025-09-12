import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth/authMiddleware';
import CheckoutTemplateController from '../../controllers/checkout/checkoutTemplateController';

const router = Router();

// Catalog
router.get('/templates', authenticateToken, CheckoutTemplateController.listTemplates);

// Settings
router.get('/settings', authenticateToken, CheckoutTemplateController.getSettings);
router.put('/settings', authenticateToken, CheckoutTemplateController.upsertSettings);
router.put('/settings/product/:productId', authenticateToken, CheckoutTemplateController.upsertProductOverride);
router.put('/settings/sdk-defaults', authenticateToken, CheckoutTemplateController.upsertSdkDefaults);

// Preview
router.get('/preview', authenticateToken, CheckoutTemplateController.preview);

export default router;

