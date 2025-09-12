import { Router } from 'express';
import { MagicSdkController } from '../../../controllers/magic/magicSdkController';
import { authenticateToken } from '../../../middleware/auth';
import { rateLimiters } from '../../../config/rateLimit';

const router = Router();

/**
 * @route   POST /api/v1/magic-sdk/bake
 * @desc    Bake a preconfigured SDK package (returns config payload and CLI)
 * @access  Authenticated (dashboard)
 */
router.post('/bake', authenticateToken, rateLimiters.general, MagicSdkController.bake);

export default router;


