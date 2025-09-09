// Export validation middleware functions
export { validateTransaction, validateTransactionQuery, validateAmount, transactionSchemas } from './transactionValidation';
export { validateWebhook, verifyWebhookSignature, validateWebhookUrl, validateWebhookEvents, validateWebhookPayload } from './webhookValidation';
export { validateUser, validatePasswordStrength, validateEmail, validatePhone, userSchemas } from './userValidation';

// Generic validation function for routes
export const validateRequest = (schemaName: string) => {
  return (req: any, res: any, next: any) => {
    // This is a placeholder - the actual implementation would depend on the specific validation needed
    // For now, we'll just pass through to the next middleware
    next();
  };
};

// Default export for convenience
import { validateTransaction, validateTransactionQuery, validateAmount, transactionSchemas } from './transactionValidation';
import { validateWebhook, verifyWebhookSignature, validateWebhookUrl, validateWebhookEvents, validateWebhookPayload } from './webhookValidation';
import { validateUser, validatePasswordStrength, validateEmail, validatePhone, userSchemas } from './userValidation';

export default {
  validateTransaction,
  validateTransactionQuery,
  validateAmount,
  validateWebhook,
  verifyWebhookSignature,
  validateWebhookUrl,
  validateWebhookEvents,
  validateWebhookPayload,
  validateUser,
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  validateRequest,
  transactionSchemas,
  userSchemas
}; 