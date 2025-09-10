import { Router } from 'express';
import { SandboxController } from '../../controllers/sandbox/sandboxController';

const router = Router();

// Internal proxy routes for workspace-bound hosted checkout
// These routes bypass normal auth and use server-side sandbox secret
router.get('/internal/checkout/sessions/:id', SandboxController.getSessionForCheckout);
router.post('/internal/checkout/sessions/:id/process', SandboxController.processPaymentForCheckout);

export default router;
