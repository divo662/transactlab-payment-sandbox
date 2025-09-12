import { Request, Response } from 'express';
import fetch from 'node-fetch';
import User from '../../models/User';
import { logger } from '../../utils/helpers/logger';

export default class KycController {
  static async startKyc(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const providerBase = process.env.KYC_PROVIDER_BASE_URL || 'https://kycplayground.vercel.app';
      const apiKey = process.env.KYC_PROVIDER_API_KEY || 'kyc_mel3jx6r_qhountyxygk';
      const webhookUrl = process.env.KYC_PROVIDER_WEBHOOK_URL || `${process.env.TL_BASE || ''}/api/v1/auth/webhooks/kyc`;
      const returnUrl = req.body?.returnUrl || `${process.env.TL_BASE || ''}/auth/kyc/callback`;

      const resCreate = await fetch(`${providerBase}/api/verifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ webhookUrl, returnUrl, metadata: { userId } })
      });
      if (!resCreate.ok) {
        const text = await resCreate.text();
        return res.status(resCreate.status).json({ success: false, message: text || 'Failed to create KYC session' });
      }
      const data = await resCreate.json();
      const sessionId = data.sessionId || data.verificationId || data.id;
      const hostedUrl = data.redirectUrl || data.hostedUrl || `${providerBase}/verify/${sessionId}`;

      await User.findByIdAndUpdate(userId, { $set: { 'kyc.lastSessionId': sessionId, 'kyc.lastStatus': 'created' } });

      return res.json({ success: true, data: { hostedUrl, sessionId } });
    } catch (e: any) {
      logger.error('startKyc error', e);
      return res.status(500).json({ success: false, message: 'Failed to start KYC' });
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const event = req.header('X-KYCPlayground-Event') || 'unknown';
      const payload = req.body || {};
      const sessionId = payload?.sessionId || payload?.data?.sessionId;
      const status = payload?.status || payload?.data?.status;
      const userId = payload?.userId || payload?.metadata?.userId || payload?.data?.userId;

      if (sessionId && status) {
        const set: any = { 'kyc.lastSessionId': sessionId, 'kyc.lastStatus': status };
        if (String(status).toLowerCase() === 'completed') set.isKycVerified = true;
        if (userId) await User.findByIdAndUpdate(userId, { $set: set });
      }

      return res.json({ received: true, event });
    } catch (e) {
      logger.error('kyc webhook error', e);
      return res.status(500).json({ success: false });
    }
  }
}


