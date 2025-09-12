import { Request, Response } from 'express';

type BakeRequestBody = {
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  frontendUrl?: string;
  sandboxSecret?: string;
  encrypt?: boolean;
  sdkDefaults?: any;
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
        sdkDefaults,
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
            {
              path: 'transactlab-magic/sdk-defaults.json',
              contents: JSON.stringify(sdkDefaults || {}, null, 2),
            },
            {
              path: '.env.example',
              contents: `TL_BASE=${config.baseUrl.replace(/\/$/, '')}/sandbox\nTL_SECRET=${sandboxSecret}\nTL_WEBHOOK_SECRET=whsec_...\nFRONTEND_URL=${frontendUrl}\nPORT=3000\n`,
            },
          ],
          notes:
            'Use the CLI or write the provided config.json. Then run `npx tl test` to verify.',
        },
      });
    } catch (error: any) {
      const msg = error?.message || 'Internal error';
      return res.status(500).json({ success: false, message: msg });
    }
  },

  async zip(req: Request, res: Response) {
    try {
      const { files } = await (async () => {
        const bakeRes: any = await (MagicSdkController as any).bake({ ...req, body: req.body } as Request, {
          json: (v: any) => v
        } as any);
        return bakeRes?.data || { files: [] };
      })();

      const archiver = require('archiver');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="transactlab-magic.zip"');
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err: any) => { throw err; });
      archive.pipe(res as any);
      for (const f of files || []) {
        archive.append(f.contents || '', { name: f.path || 'file.txt' });
      }
      archive.finalize();
    } catch (error: any) {
      const msg = error?.message || 'Failed to build zip';
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: msg });
      }
    }
  }
};

export default MagicSdkController;


