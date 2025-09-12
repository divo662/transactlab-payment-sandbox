import { Request, Response } from 'express';

type BakeRequestBody = {
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  frontendUrl?: string;
  sandboxSecret?: string;
  encrypt?: boolean;
};

export const MagicSdkController = {
  async bake(req: Request, res: Response) {
    try {
      const {
        successUrl,
        cancelUrl,
        callbackUrl,
        frontendUrl,
        sandboxSecret,
        encrypt = false,
      } = (req.body || {}) as BakeRequestBody;

      const missing: string[] = [];
      if (!successUrl) missing.push('successUrl');
      if (!cancelUrl) missing.push('cancelUrl');
      if (!callbackUrl) missing.push('callbackUrl');
      if (!frontendUrl) missing.push('frontendUrl');
      if (!sandboxSecret) missing.push('sandboxSecret');

      if (missing.length) {
        return res.status(400).json({ success: false, message: 'Missing fields', missing });
      }

      // Build config JSON that the SDK expects
      const config = {
        apiKey: sandboxSecret,
        webhookSecret: 'set-in-dashboard-or-env',
        urls: {
          success: successUrl,
          cancel: cancelUrl,
          callback: callbackUrl,
          frontend: frontendUrl,
        },
        environment: 'sandbox',
        baseUrl: process.env.PUBLIC_BACKEND_ORIGIN
          ? `${process.env.PUBLIC_BACKEND_ORIGIN}/api/v1`
          : 'https://transactlab-backend.onrender.com/api/v1',
      };

      const suggestedCli = encrypt
        ? 'npx tl init  # choose encryption when prompted'
        : 'npx tl init --skip-prompts';

      return res.json({
        success: true,
        data: {
          suggestedCli,
          files: [
            {
              path: 'transactlab-magic/config.json',
              contents: JSON.stringify(config, null, 2),
            },
          ],
          notes:
            'Use the CLI or write the provided config.json. Then run `npx tl test` to verify.',
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error?.message || 'Internal error' });
    }
  },
};

export default MagicSdkController;


