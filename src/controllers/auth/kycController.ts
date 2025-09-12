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
      const defaultFrontend = process.env.FRONTEND_BASE || 'https://transactlab-payment-sandbox.vercel.app';
      const webhookUrl = process.env.KYC_PROVIDER_WEBHOOK_URL || `${process.env.TL_BASE || ''}/api/v1/auth/webhooks/kyc`;
      // Use caller-provided returnUrl unless it is localhost; otherwise, prefer configured front-end base
      let returnUrl = req.body?.returnUrl || process.env.KYC_PROVIDER_RETURN_URL || `${defaultFrontend}/auth/kyc/callback`;
      if (returnUrl && /localhost:\d+/i.test(returnUrl)) {
        returnUrl = process.env.KYC_PROVIDER_RETURN_URL || `${defaultFrontend}/auth/kyc/callback`;
      }

      // Debug logging
      logger.info('KYC Request Details:', {
        providerBase,
        returnUrl,
        webhookUrl,
        userId,
        apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'not set'
      });

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
      
      // Debug logging for response
      logger.info('KYC Response Details:', {
        status: resCreate.status,
        data: {
          sessionId: data.sessionId || data.verificationId || data.id,
          verificationUrl: data.verificationUrl,
          redirectUrl: data.redirectUrl,
          hostedUrl: data.hostedUrl,
          returnUrl: data.returnUrl
        }
      });
      
      const sessionId = data.sessionId || data.verificationId || data.id;
      // Prefer explicit verificationUrl if provider supplies it
      let hostedUrl = data.verificationUrl || data.redirectUrl || data.hostedUrl || `${providerBase}/verify/${sessionId}`;
      // Sanitize: never return localhost; enforce providerBase and public path
      const needsFix = !hostedUrl || /localhost:\d+/i.test(hostedUrl) || hostedUrl.startsWith('/');
      if (needsFix || (providerBase && !hostedUrl.startsWith(providerBase))) {
        hostedUrl = `${providerBase.replace(/\/$/, '')}/verify/${sessionId}`;
      }

      await User.findByIdAndUpdate(userId, { $set: { 'kyc.lastSessionId': sessionId, 'kyc.lastStatus': 'created' } });

      return res.json({ success: true, data: { hostedUrl, sessionId } });
    } catch (e: any) {
      logger.error('startKyc error', e);
      return res.status(500).json({ success: false, message: 'Failed to start KYC' });
    }
  }

  static async getKycStatus(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?._id?.toString();
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if this session ID matches the user's last KYC session
      const isCurrentSession = user.kyc?.lastSessionId === sessionId;
      const isVerified = user.isKycVerified;
      const lastStatus = user.kyc?.lastStatus;

      return res.json({
        success: true,
        data: {
          sessionId,
          isCurrentSession,
          isVerified,
          lastStatus,
          completed: isVerified && isCurrentSession
        }
      });
    } catch (e: any) {
      logger.error('getKycStatus error', e);
      return res.status(500).json({ success: false, message: 'Failed to get KYC status' });
    }
  }

  static async completeKyc(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?._id?.toString();
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Manually mark KYC as completed for this session
      await User.findByIdAndUpdate(userId, { 
        $set: { 
          'kyc.lastSessionId': sessionId, 
          'kyc.lastStatus': 'completed',
          'isKycVerified': true 
        } 
      });

      logger.info('KYC Manually Completed:', { userId, sessionId });

      return res.json({
        success: true,
        message: 'KYC verification completed successfully'
      });
    } catch (e: any) {
      logger.error('completeKyc error', e);
      return res.status(500).json({ success: false, message: 'Failed to complete KYC' });
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const event = req.header('X-KYCPlayground-Event') || 'unknown';
      const payload = req.body || {};
      const sessionId = payload?.sessionId || payload?.data?.sessionId;
      const status = payload?.status || payload?.data?.status;
      const userId = payload?.userId || payload?.metadata?.userId || payload?.data?.userId;

      // Debug logging for webhook
      logger.info('KYC Webhook Received:', {
        event,
        sessionId,
        status,
        userId,
        payload: JSON.stringify(payload, null, 2)
      });

      if (sessionId && status) {
        const set: any = { 'kyc.lastSessionId': sessionId, 'kyc.lastStatus': status };
        if (String(status).toLowerCase() === 'completed' || String(status).toLowerCase() === 'verified') {
          set.isKycVerified = true;
        }
        
        if (userId) {
          await User.findByIdAndUpdate(userId, { $set: set });
          logger.info('KYC User Updated:', { userId, sessionId, status, isKycVerified: set.isKycVerified });
        } else {
          logger.warn('KYC Webhook: No userId found in payload');
        }
      } else {
        logger.warn('KYC Webhook: Missing sessionId or status', { sessionId, status });
      }

      return res.json({ received: true, event });
    } catch (e) {
      logger.error('kyc webhook error', e);
      return res.status(500).json({ success: false });
    }
  }
}


