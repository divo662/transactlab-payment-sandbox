import { Router } from 'express';
import { SecurityController } from '../../controllers/auth/securityController';
import { authenticateToken as authMiddleware } from '../../middleware/auth/authMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// TOTP (Google Authenticator) routes
router.post('/totp/setup', SecurityController.setupTotp);
router.post('/totp/verify', SecurityController.verifyTotpSetup);
router.delete('/totp', SecurityController.disableTotp);
router.post('/totp/backup-codes', SecurityController.generateBackupCodes);

// Device management routes
router.get('/devices', SecurityController.getTrustedDevices);
router.delete('/devices/:deviceId', SecurityController.removeTrustedDevice);

// Security settings routes
router.get('/settings', SecurityController.getSecuritySettings);
router.put('/settings', SecurityController.updateSecuritySettings);

export default router;
