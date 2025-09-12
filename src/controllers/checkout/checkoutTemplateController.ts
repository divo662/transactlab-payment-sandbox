import { Request, Response } from 'express';
import CheckoutSettings from '../../models/CheckoutSettings';
import { logger } from '../../utils/helpers/logger';

// Static catalog for three templates
const TEMPLATE_CATALOG = [
  { id: 'classic', name: 'Classic', description: 'Two-column, brand header, trust badges' },
  { id: 'modern', name: 'Modern', description: 'Centered card, large product banner' },
  { id: 'minimal', name: 'Minimal', description: 'Clean and focused, high-conversion' },
];

function resolveConfig(base: any, overrides?: any) {
  return { ...base, ...(overrides || {}) };
}

export class CheckoutTemplateController {
  static async listTemplates(req: Request, res: Response) {
    res.json({ success: true, data: TEMPLATE_CATALOG });
  }

  static async getSettings(req: Request, res: Response) {
    try {
      const ownerId = req.user?._id;
      const doc = await CheckoutSettings.findOne({ ownerId });
      if (!doc) {
        const created = await CheckoutSettings.create({ ownerId });
        return res.json({ success: true, data: created });
      }
      res.json({ success: true, data: doc });
    } catch (e) {
      logger.error('getSettings error', e);
      res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
  }

  static async upsertSettings(req: Request, res: Response) {
    try {
      const ownerId = req.user?._id;
      const update = req.body;
      const doc = await CheckoutSettings.findOneAndUpdate(
        { ownerId },
        { $set: update },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: doc });
    } catch (e) {
      logger.error('upsertSettings error', e);
      res.status(500).json({ success: false, message: 'Failed to save settings' });
    }
  }

  static async upsertSdkDefaults(req: Request, res: Response) {
    try {
      const ownerId = req.user?._id;
      const payload = req.body || {};
      const doc = await CheckoutSettings.findOneAndUpdate(
        { ownerId },
        { $set: { sdkDefaults: payload } },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: doc?.sdkDefaults || {} });
    } catch (e) {
      logger.error('upsertSdkDefaults error', e);
      res.status(500).json({ success: false, message: 'Failed to save SDK defaults' });
    }
  }

  static async upsertProductOverride(req: Request, res: Response) {
    try {
      const ownerId = req.user?._id;
      const { productId } = req.params;
      const payload = req.body || {};
      const doc = await CheckoutSettings.findOne({ ownerId });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Settings not found' });
      }
      const i = doc.productOverrides.findIndex(p => p.productId === productId);
      if (i >= 0) {
        const current: any = (doc.productOverrides[i] as any) || {};
        doc.productOverrides[i] = { ...current, ...payload, productId } as any;
      } else {
        doc.productOverrides.push({ productId, ...payload } as any);
      }
      await doc.save();
      res.json({ success: true, data: doc });
    } catch (e) {
      logger.error('upsertProductOverride error', e);
      res.status(500).json({ success: false, message: 'Failed to save product overrides' });
    }
  }

  // Returns resolved config + sample session values for preview
  static async preview(req: Request, res: Response) {
    try {
      const ownerId = req.user?._id;
      const { template: templateId, productId } = req.query as { template?: string, productId?: string };

      const base = {
        activeTemplateId: (templateId as any) || 'classic',
        theme: { brandColor: '#0a164d', accentColor: '#22c55e', backgroundStyle: 'solid' },
        brand: { companyName: 'Your Store' },
        layout: { showItemized: true, showTrustBadges: true, showSupportBox: true, showLegal: true },
        legal: {}
      };

      const settings = await CheckoutSettings.findOne({ ownerId });
      const merged = settings ? {
        activeTemplateId: settings.activeTemplateId,
        theme: resolveConfig(base.theme, settings.theme),
        brand: resolveConfig(base.brand, settings.brand),
        layout: resolveConfig(base.layout, settings.layout),
        legal: resolveConfig(base.legal, settings.legal)
      } : base;

      if (productId && settings) {
        const ov = settings.productOverrides.find(p => p.productId === productId);
        if (ov) {
          merged.theme = resolveConfig(merged.theme, ov.theme);
          merged.brand = resolveConfig(merged.brand, ov.brand);
          merged.layout = resolveConfig(merged.layout, ov.layout);
          merged.legal = resolveConfig(merged.legal, ov.legal);
        }
      }

      const sample = {
        product: { name: 'Sample Product', priceMinor: 500000, currency: 'NGN' },
        customer: { email: 'customer@example.com' }
      };

      res.json({ success: true, data: { config: merged, sample } });
    } catch (e) {
      logger.error('preview error', e);
      res.status(500).json({ success: false, message: 'Failed to build preview' });
    }
  }
}

export default CheckoutTemplateController;

