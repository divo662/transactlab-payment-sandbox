import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import axios from 'axios';
import { logger } from '../../utils/helpers/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email Service
 * Handles email notifications and templating using EmailJS, Resend, or SMTP
 */
export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  private static transporter: nodemailer.Transporter | null = null;
  private static resend: Resend | null = null;
  private static transporterLastError: Date | null = null;
  private static readonly TRANSPORTER_RESET_INTERVAL = 60000; // Reset transporter after 1 minute of errors
  
  // EMAIL SERVICES COMPLETELY DISABLED - Set to true to disable ALL email functionality
  private static readonly EMAIL_DISABLED = true; // Force disable all emails - change to false to re-enable

  /**
   * Initialize Resend client (preferred method)
   */
  private static getResendClient(): Resend | null {
    if (this.resend) {
      return this.resend;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.warn('RESEND_API_KEY not configured. Falling back to SMTP or disabling emails.');
      return null;
    }

    try {
      this.resend = new Resend(resendApiKey);
      logger.info('Resend client initialized successfully');
      return this.resend;
    } catch (error) {
      logger.error('Failed to initialize Resend client', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Send email via EmailJS REST API
   */
  private static async sendViaEmailJS(options: EmailOptions): Promise<EmailResult> {
    try {
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ID;
      const userId = process.env.EMAILJS_USER_ID;

      if (!publicKey || !serviceId || !templateId) {
        logger.warn('[EMAILJS] EmailJS credentials not fully configured', {
          hasPublicKey: !!publicKey,
          hasServiceId: !!serviceId,
          hasTemplateId: !!templateId
        });
        return {
          success: false,
          message: 'EmailJS not configured',
          error: 'Missing EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, or EMAILJS_TEMPLATE_ID'
        };
      }

      logger.info('[EMAILJS] Sending email via EmailJS', {
        serviceId,
        templateId,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject
      });

      // Prepare template parameters
      // EmailJS templates use {{variable_name}} format
      const templateParams: Record<string, any> = {
        to_email: Array.isArray(options.to) ? options.to[0] : options.to,
        to_name: options.data?.name || options.data?.customerName || 'User',
        from_name: options.data?.businessName || 'TransactLab',
        subject: options.subject,
        message: options.html || options.text || '',
        reply_to: options.replyTo || options.from || this.DEFAULT_FROM,
        ...options.data // Include all template data
      };

      // EmailJS REST API endpoint
      // Try with access token in URL (newer method), fallback to user_id only (older method)
      const emailjsUrl = userId 
        ? `https://api.emailjs.com/api/v1.0/email/send?accessToken=${publicKey}`
        : `https://api.emailjs.com/api/v1.0/email/send`;

      const requestData: any = {
        service_id: serviceId,
        template_id: templateId,
        user_id: userId || publicKey, // User ID (required) or Public Key as fallback
        template_params: templateParams
      };

      // EmailJS API call
      const response = await axios.post(emailjsUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      if (response.status === 200) {
        logger.info('[EMAILJS] ✅ Email sent successfully via EmailJS', {
          status: response.status,
          statusText: response.statusText,
          to: templateParams.to_email,
          subject: options.subject
        });

        return {
          success: true,
          messageId: response.data?.messageId || `emailjs-${Date.now()}`,
          message: 'Email sent successfully via EmailJS'
        };
      } else {
        logger.error('[EMAILJS] ❌ EmailJS returned non-200 status', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });

        return {
          success: false,
          message: `EmailJS error: ${response.statusText}`,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[EMAILJS] ❌ Failed to send email via EmailJS', {
        error: errorMessage,
        response: error.response?.data,
        status: error.response?.status,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject
      });

      let userFriendlyError = 'Failed to send email via EmailJS';
      if (error.response?.data?.error) {
        userFriendlyError = `EmailJS error: ${error.response.data.error}`;
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'EmailJS request timeout. Please try again.';
      } else if (error.response?.status === 400) {
        userFriendlyError = 'EmailJS template or service configuration error. Please check your template parameters.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        userFriendlyError = 'EmailJS authentication failed. Please check your API keys.';
      }

      return {
        success: false,
        message: userFriendlyError,
        error: errorMessage
      };
    }
  }

  /**
   * Reset SMTP transporter (call when connection fails)
   */
  private static resetTransporter(): void {
    if (this.transporter) {
      logger.info('[SMTP] Resetting transporter due to connection issues');
      try {
        this.transporter.close();
      } catch (error) {
        // Ignore errors when closing
      }
      this.transporter = null;
      this.transporterLastError = new Date();
    }
  }

  /**
   * Initialize SMTP transporter (fallback method)
   */
  private static async getTransporter(): Promise<nodemailer.Transporter | null> {
    // Reset transporter if it's been failing for too long
    if (this.transporter && this.transporterLastError) {
      const timeSinceError = Date.now() - this.transporterLastError.getTime();
      if (timeSinceError > this.TRANSPORTER_RESET_INTERVAL) {
        logger.info('[SMTP] Resetting stale transporter after error period');
        this.resetTransporter();
      }
    }

    if (this.transporter) {
      logger.info('[SMTP] Using existing transporter instance');
      return this.transporter;
    }

    // Allow SMTP even if Resend is configured (as fallback)
    // Resend requires domain verification for production emails
    // So SMTP can be used as a fallback when Resend fails

    try {
      // Check if SMTP credentials are configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = process.env.SMTP_PORT || '587';

      logger.info('[SMTP] Initializing SMTP transporter...', {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        hasPassword: !!smtpPass
      });

      if (!smtpHost || !smtpUser || !smtpPass) {
        logger.warn('[SMTP] SMTP credentials not configured. Email functionality will be disabled.');
        logger.warn('[SMTP] Missing:', {
          host: !smtpHost,
          user: !smtpUser,
          password: !smtpPass
        });
        logger.warn('To enable emails, set RESEND_API_KEY (recommended) or SMTP credentials in your .env file');
        return null;
      }

      logger.info('[SMTP] Creating nodemailer transporter with config:', {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        user: smtpUser
      });

      // Gmail-specific optimizations
      const isGmail = smtpHost?.toLowerCase().includes('gmail') || false;
      
      // Create transporter configuration
      const transporterConfig: any = {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: isGmail ? 20000 : 15000, // Longer timeout for Gmail
        greetingTimeout: isGmail ? 10000 : 5000,
        socketTimeout: isGmail ? 20000 : 15000
      };

      // Only add pool settings if not using Gmail (Gmail doesn't support pooling well)
      if (!isGmail) {
        transporterConfig.pool = false;
        transporterConfig.maxConnections = 1;
        transporterConfig.maxMessages = 1;
        transporterConfig.rateDelta = 1000;
        transporterConfig.rateLimit = 5;
      }
      
      this.transporter = nodemailer.createTransport(transporterConfig);

      logger.info('[SMTP] Transporter created (connection will be verified on first use)');
      
      // Try to verify connection with timeout, but don't fail if it times out
      // The connection will be established when actually sending
      try {
        logger.info('[SMTP] Attempting to verify SMTP connection (with timeout)...');
        const verifyPromise = this.transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection verification timeout')), 5000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        logger.info('[SMTP] ✅ SMTP connection verified successfully', {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser
        });
      } catch (verifyError: any) {
        // Don't fail if verification times out - connection will be established on send
        if (verifyError.message?.includes('timeout')) {
          logger.warn('[SMTP] ⚠️ Connection verification timed out (will connect on first send)', {
            host: smtpHost,
            port: smtpPort,
            error: verifyError.message
          });
        } else {
          logger.warn('[SMTP] ⚠️ Connection verification failed (will retry on first send)', {
            host: smtpHost,
            port: smtpPort,
            error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
          });
        }
        // Continue anyway - connection will be established when sending
      }

      return this.transporter;
    } catch (error) {
      logger.error('[SMTP] ❌ Failed to create SMTP transporter', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER
      });
      return null;
    }
  }

  private static readonly TEMPLATES: Record<string, EmailTemplate> = {
    'subscription_started': {
      name: 'subscription_started',
      subject: 'Your subscription is active — {{subscriptionId}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Subscription Activated</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Thank you for subscribing</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
            <p style="font-size: 15px; color: #333;">Hi <strong>{{customerName}}</strong>, your subscription is now active.</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #333;"><strong>Plan:</strong> {{planName}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Amount:</strong> {{amount}} / {{interval}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Subscription ID:</strong> {{subscriptionId}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Next billing:</strong> {{nextBillingDate}}</p>
            </div>
            <p style="font-size: 14px; color: #666;">You can manage your subscription from your account dashboard at any time.</p>
            <p style="font-size: 13px; color: #999; text-align: center; margin-top: 16px;">Powered by TransactLab Sandbox</p>
          </div>
        </div>
      `,
      text: `
        Subscription Activated
        Hi {{customerName}}, your subscription is now active.
        Plan: {{planName}}
        Amount: {{amount}} / {{interval}}
        Subscription ID: {{subscriptionId}}
        Next billing: {{nextBillingDate}}
      `
    },
    'subscription_upcoming_invoice': {
      name: 'subscription_upcoming_invoice',
      subject: 'Upcoming subscription billing — {{nextBillingDate}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Upcoming Billing</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Reminder for your subscription</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
            <p style="font-size: 15px; color: #333;">Hi <strong>{{customerName}}</strong>, this is a reminder that your subscription will renew soon.</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #333;"><strong>Plan:</strong> {{planName}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Amount:</strong> {{amount}} / {{interval}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Next billing:</strong> {{nextBillingDate}}</p>
            </div>
            <p style="font-size: 14px; color: #666;">No action is required. If you need to update your billing details or cancel, visit your account dashboard.</p>
            <p style="font-size: 13px; color: #999; text-align: center; margin-top: 16px;">Powered by TransactLab Sandbox</p>
          </div>
        </div>
      `,
      text: `
        Upcoming Billing Reminder
        Plan: {{planName}}
        Amount: {{amount}} / {{interval}}
        Next billing: {{nextBillingDate}}
      `
    },
    'welcome': {
      name: 'welcome',
      subject: 'Welcome to TransactLab Sandbox!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to TransactLab Sandbox!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Build and test payments with no real money</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>{{name}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Thanks for joining TransactLab Sandbox — a safe, production-like environment to simulate checkouts, webhooks, subscriptions and refunds without moving real funds.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Next steps</h3>
              <ul style="color: #555; line-height: 1.6;">
                <li>Create API keys (publishable and secret) in Sandbox → API Keys</li>
                <li>Create a Checkout Session and redirect to the hosted checkout</li>
                <li>Use test card numbers to simulate success/failure and 3‑D Secure</li>
                <li>Configure a webhook URL and inspect events from the Sandbox dashboard</li>
              </ul>
            </div>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need help getting started, our team is here to help.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{dashboardUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Open Sandbox Dashboard</a>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Team
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to TransactLab Sandbox!
        
        Hi {{name}},
        
        Thanks for joining TransactLab Sandbox — a safe, production-like environment to simulate checkouts, webhooks, subscriptions and refunds without moving real funds.
        
        Next steps:
        - Create API keys in Sandbox → API Keys
        - Create a Checkout Session and redirect to hosted checkout
        - Use test card numbers to simulate outcomes
        - Configure a webhook URL and inspect events
        
        If you have any questions or need help getting started, our team is here to help.
        
        Sandbox Dashboard: {{dashboardUrl}}
        
        Best regards,
        The TransactLab Team
      `
    },
    'email_verification': {
      name: 'email_verification',
      subject: 'Verify Your Email - TransactLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Complete your TransactLab account setup</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>{{name}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Thanks for signing up for TransactLab! To complete your account setup, please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #0a164d; word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 5px;">
              {{verificationUrl}}
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
              </p>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Team
            </p>
          </div>
        </div>
      `,
      text: `
        Verify Your Email - TransactLab
        
        Hi {{name}},
        
        Thanks for signing up for TransactLab! To complete your account setup, please verify your email address.
        
        Verification Link: {{verificationUrl}}
        
        Important: This verification link will expire in 24 hours for security reasons.
        
        Best regards,
        The TransactLab Team
      `
    },
    'payment_success': {
      name: 'payment_success',
      subject: 'Payment Successful - {{reference}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Payment Successful!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Transaction completed successfully</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Your payment of <strong>{{amount}}</strong> has been processed successfully.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Transaction Details:</h3>
              <ul style="color: #555; line-height: 1.6; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong>Reference:</strong> {{reference}}</li>
                <li style="margin-bottom: 10px;"><strong>Amount:</strong> {{amount}}</li>
                <li style="margin-bottom: 10px;"><strong>Date:</strong> {{date}}</li>
                <li style="margin-bottom: 10px;"><strong>Payment Method:</strong> {{paymentMethod}}</li>
              </ul>
            </div>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your business!
            </p>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>{{businessName}}
            </p>
          </div>
        </div>
      `,
      text: `
        Payment Successful!
        
        Hi {{customerName}},
        
        Your payment of {{amount}} has been processed successfully.
        
        Transaction Details:
        - Reference: {{reference}}
        - Amount: {{amount}}
        - Date: {{date}}
        - Payment Method: {{paymentMethod}}
        
        Thank you for your business!
        
        Best regards,
        {{businessName}}
      `
    },
    'payment_receipt': {
      name: 'payment_receipt',
      subject: 'Your Receipt — {{reference}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Payment Receipt</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
            <p style="font-size: 15px; color: #333;">Hi <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">We're confirming your payment of <strong>{{amount}}</strong>. Below are the details of your transaction.</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #333;"><strong>Reference:</strong> {{reference}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Date:</strong> {{date}}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Payment Method:</strong> {{paymentMethod}}</p>
            </div>
            <p style="font-size: 14px; color: #666;">If you have any questions about this receipt, simply reply to this email.</p>
            <p style="font-size: 13px; color: #999; text-align: center; margin-top: 24px;">Powered by TransactLab Sandbox</p>
          </div>
        </div>
      `,
      text: `
        Payment Receipt\n\n
        Hi {{customerName}},\n
        We're confirming your payment of {{amount}}.\n
        Reference: {{reference}}\n
        Date: {{date}}\n
        Payment Method: {{paymentMethod}}\n\n
        Powered by TransactLab Sandbox
      `
    },
    'owner_transaction_alert': {
      name: 'owner_transaction_alert',
      subject: 'New Sandbox Transaction — {{reference}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">New Transaction (Sandbox)</h1>
          </div>
          <div style="background: white; padding: 22px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
            <p style="font-size: 15px; color: #333;">A new sandbox transaction was completed.</p>
            <ul style="list-style: none; padding: 0; font-size: 14px; color: #555; line-height: 1.6;">
              <li><strong>Reference:</strong> {{reference}}</li>
              <li><strong>Customer:</strong> {{customerEmail}}</li>
              <li><strong>Amount:</strong> {{amount}}</li>
              <li><strong>Date:</strong> {{date}}</li>
              <li><strong>Method:</strong> {{paymentMethod}}</li>
            </ul>
            <p style="font-size: 13px; color: #999; text-align: center; margin-top: 16px;">Powered by TransactLab Sandbox</p>
          </div>
        </div>
      `,
      text: `
        New Sandbox Transaction\n\n
        Reference: {{reference}}\n
        Customer: {{customerEmail}}\n
        Amount: {{amount}}\n
        Date: {{date}}\n
        Method: {{paymentMethod}}\n
      `
    },
    'password_reset': {
      name: 'password_reset',
      subject: 'Password Reset Request - TransactLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure your account</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>{{name}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetLink}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #0a164d; word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 5px;">
              {{resetLink}}
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Team
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request - TransactLab
        
        Hi {{name}},
        
        We received a request to reset your password. Click the link below to create a new password:
        
        {{resetLink}}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        The TransactLab Team
      `
    },
    'security_question_reset': {
      name: 'security_question_reset',
      subject: 'Security Question Reset Request - TransactLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Security Question Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Update your account security</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>{{name}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your security question. Click the button below to set a new security question and answer:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Reset Security Question</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #0a164d; word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 5px;">
              {{resetUrl}}
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this security question reset, please ignore this email and your security question will remain unchanged.
            </p>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Team
            </div>
          </div>
        </div>
      `,
      text: `
        Security Question Reset Request - TransactLab
        
        Hi {{name}},
        
        We received a request to reset your security question. Click the link below to set a new security question and answer:
        
        {{resetUrl}}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this security question reset, please ignore this email and your security question will remain unchanged.
        
        Best regards,
        The TransactLab Team
      `
    },
    'new_device_alert': {
      name: 'new_device_alert',
      subject: 'New Device Login Alert - TransactLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">New Device Login Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Security notification from TransactLab</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              We detected a login attempt from a new device on your TransactLab account. If this was you, no action is needed. If this wasn't you, please secure your account immediately.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Login Details:</h3>
              <ul style="color: #555; line-height: 1.6; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong> Date & Time:</strong> {{timestamp}}</li>
                <li style="margin-bottom: 10px;"><strong> Device:</strong> {{deviceName}}</li>
                <li style="margin-bottom: 10px;"><strong> IP Address:</strong> {{ipAddress}}</li>
                <li style="margin-bottom: 10px;"><strong> Location:</strong> {{location}}</li>
                <li style="margin-bottom: 10px;"><strong> User Agent:</strong> {{userAgent}}</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Tip:</strong> If you don't recognize this device, please change your password immediately and enable two-factor authentication for added security.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{dashboardUrl}}" style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Security Team
            </p>
          </div>
        </div>
      `,
      text: `
        New Device Login Alert - TransactLab
        
        Hello {{customerName}},
        
        We detected a login attempt from a new device on your TransactLab account.
        
        Login Details:
        - Date & Time: {{timestamp}}
        - Device: {{deviceName}}
        - IP Address: {{ipAddress}}
        - Location: {{location}}
        
        If you don't recognize this device, please change your password immediately.
        
        Security Settings: {{securityUrl}}
        
        Best regards,
        The TransactLab Security Team
      `
    },
    'totp_setup': {
      name: 'totp_setup',
      subject: 'Two-Factor Authentication Setup - TransactLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">2FA Setup Complete</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is now more secure</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Great news! You've successfully enabled Two-Factor Authentication (2FA) on your TransactLab account. Your account is now protected with an additional layer of security.
            </p>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">What's Next?</h3>
              <ul style="color: #0c4a6e; line-height: 1.6;">
                <li>Use your authenticator app to generate codes when logging in</li>
                <li>Keep your backup codes safe - store them in a secure location</li>
                <li>Never share your authenticator app or backup codes with anyone</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> Your backup codes are shown only once. Make sure to save them in a secure location. If you lose your authenticator device and backup codes, you may be locked out of your account.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{dashboardUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>The TransactLab Security Team
            </p>
          </div>
        </div>
      `,
      text: `
        2FA Setup Complete - TransactLab
        
        Hello {{customerName}},
        
        Great news! You've successfully enabled Two-Factor Authentication (2FA) on your TransactLab account.
        
        What's Next?
        - Use your authenticator app to generate codes when logging in
        - Keep your backup codes safe - store them in a secure location
        - Never share your authenticator app or backup codes with anyone
        
        Important: Your backup codes are shown only once. Make sure to save them in a secure location.
        
        Dashboard: {{dashboardUrl}}
        
        Best regards,
        The TransactLab Security Team
      `
    },
    'invoice_sent': {
      name: 'invoice_sent',
      subject: 'Invoice #{{invoiceId}} - {{amount}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a164d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Invoice</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Request</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              You have received an invoice for <strong>{{amount}}</strong>. Please review the details below and complete your payment.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0a164d;">
              <h3 style="color: #333; margin-top: 0;">Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Invoice ID:</td>
                  <td style="padding: 8px 0; color: #333;">{{invoiceId}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">{{amount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Due Date:</td>
                  <td style="padding: 8px 0; color: #333;">{{dueDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">{{description}}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{paymentUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                Pay Invoice
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Payment Deadline:</strong> This invoice is due on {{dueDate}}. Please ensure payment is completed before the due date to avoid any late fees.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you have any questions about this invoice or need to discuss payment arrangements, please contact us at your earliest convenience.
            </p>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>{{businessName}}<br>Powered by TransactLab Sandbox
            </p>
          </div>
        </div>
      `,
      text: `
        Invoice #{{invoiceId}} - {{amount}}
        
        Hello {{customerName}},
        
        You have received an invoice for {{amount}}. Please review the details below and complete your payment.
        
        Invoice Details:
        - Invoice ID: {{invoiceId}}
        - Amount: {{amount}}
        - Due Date: {{dueDate}}
        - Description: {{description}}
        
        Payment URL: {{paymentUrl}}
        
        Payment Deadline: This invoice is due on {{dueDate}}. Please ensure payment is completed before the due date to avoid any late fees.
        
        If you have any questions about this invoice or need to discuss payment arrangements, please contact us at your earliest convenience.
        
        Best regards,
        {{businessName}}
        Powered by TransactLab Sandbox
      `
    },
    'invoice_reminder': {
      name: 'invoice_reminder',
      subject: 'Payment Reminder - Invoice #{{invoiceId}} Due Soon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Payment Reminder</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your invoice is due soon</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              This is a friendly reminder that your invoice for <strong>{{amount}}</strong> is due <strong>{{daysUntilDue}} day(s)</strong> from now.
            </p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #dc2626; margin-top: 0;">Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Invoice ID:</td>
                  <td style="padding: 8px 0; color: #333;">{{invoiceId}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">{{amount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Due Date:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">{{dueDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">{{description}}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{paymentUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                Pay Invoice Now
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> Please complete your payment by {{dueDate}} to avoid any late fees or service interruptions. If you've already made payment, please disregard this reminder.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you have any questions about this invoice or need assistance with payment, please don't hesitate to contact us.
            </p>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>{{businessName}}<br>Powered by TransactLab Sandbox
            </p>
          </div>
        </div>
      `,
      text: `
        Payment Reminder - Invoice #{{invoiceId}} Due Soon
        
        Hello {{customerName}},
        
        This is a friendly reminder that your invoice for {{amount}} is due {{daysUntilDue}} day(s) from now.
        
        Invoice Details:
        - Invoice ID: {{invoiceId}}
        - Amount: {{amount}}
        - Due Date: {{dueDate}}
        - Description: {{description}}
        
        Payment URL: {{paymentUrl}}
        
        Important: Please complete your payment by {{dueDate}} to avoid any late fees or service interruptions. If you've already made payment, please disregard this reminder.
        
        If you have any questions about this invoice or need assistance with payment, please don't hesitate to contact us.
        
        Best regards,
        {{businessName}}
        Powered by TransactLab Sandbox
      `
    },
    'invoice_overdue': {
      name: 'invoice_overdue',
      subject: 'Overdue Invoice #{{invoiceId}} - Immediate Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Overdue Invoice</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate action required</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>{{customerName}}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              This invoice for <strong>{{amount}}</strong> is now <strong>{{daysOverdue}} day(s)</strong> overdue. Please make payment immediately to avoid further action.
            </p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #dc2626; margin-top: 0;">Overdue Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Invoice ID:</td>
                  <td style="padding: 8px 0; color: #333;">{{invoiceId}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount Due:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-size: 18px; font-weight: bold;">{{amount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Original Due Date:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">{{dueDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Days Overdue:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">{{daysOverdue}} days</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">{{description}}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{paymentUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                Pay Overdue Invoice
              </a>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626; font-size: 14px;">
                <strong>Urgent:</strong> This invoice is overdue. Please make payment immediately to avoid late fees and potential service interruptions. If you've already made payment, please contact us to update our records.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you're experiencing financial difficulties or need to discuss payment arrangements, please contact us immediately. We're here to help find a solution that works for both parties.
            </p>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              Best regards,<br>{{businessName}}<br>Powered by TransactLab Sandbox
            </p>
          </div>
        </div>
      `,
      text: `
        Overdue Invoice #{{invoiceId}} - Immediate Action Required
        
        Hello {{customerName}},
        
        This invoice for {{amount}} is now {{daysOverdue}} day(s) overdue. Please make payment immediately to avoid further action.
        
        Overdue Invoice Details:
        - Invoice ID: {{invoiceId}}
        - Amount Due: {{amount}}
        - Original Due Date: {{dueDate}}
        - Days Overdue: {{daysOverdue}} days
        - Description: {{description}}
        
        Payment URL: {{paymentUrl}}
        
        Urgent: This invoice is overdue. Please make payment immediately to avoid late fees and potential service interruptions.
        
        If you're experiencing financial difficulties or need to discuss payment arrangements, please contact us immediately.
        
        Best regards,
        {{businessName}}
        Powered by TransactLab Sandbox
      `
    }
  };

  /**
   * Send email using EmailJS, Resend, or SMTP (in priority order)
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // EMAIL SERVICES COMPLETELY DISABLED
    if (this.EMAIL_DISABLED) {
      logger.info('[EMAIL] ⚠️ Email services are disabled - email not sent', {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject
      });
      return {
        success: true, // Return success to not break calling code
        message: 'Email service is disabled',
        messageId: 'disabled'
      };
    }
    
    try {
      // Check which email service to use (priority: EmailJS > Resend > SMTP)
      const hasEmailJS = !!(process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID);
      const hasResend = !!process.env.RESEND_API_KEY;
      const useSMTP = process.env.USE_SMTP === 'true' || (!hasEmailJS && !hasResend);
      const useResend = !useSMTP && hasResend && !hasEmailJS;
      const useEmailJS = hasEmailJS && process.env.USE_EMAILJS !== 'false';
      
      logger.info('[EMAIL] Starting email send process', {
        useEmailJS,
        useResend,
        useSMTP,
        hasEmailJS,
        hasResend,
        USE_SMTP: process.env.USE_SMTP,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject
      });

      // Try EmailJS first (if configured)
      if (useEmailJS) {
        logger.info('[EMAIL] Attempting to send email via EmailJS (primary method)');
        const emailjsResult = await this.sendViaEmailJS(options);
        if (emailjsResult.success) {
          return emailjsResult;
        } else {
          logger.warn('[EMAIL] EmailJS failed, trying fallback...', {
            error: emailjsResult.error
          });
          // Fall through to Resend or SMTP
        }
      }
      
      // Try SMTP first if configured (primary method)
      if (useSMTP) {
        logger.info('[SMTP] Attempting to send email via SMTP (primary method)');
        logger.info('[SMTP] Email details:', {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          from: options.from || this.DEFAULT_FROM,
          hasHtml: !!options.html,
          hasText: !!options.text,
          hasAttachments: !!(options.attachments && options.attachments.length > 0)
        });

        const transporter = await this.getTransporter();
        if (transporter) {
          logger.info('[SMTP] Transporter obtained, preparing email data...');
          const emailData = {
            from: options.from || this.DEFAULT_FROM,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
            attachments: options.attachments
          };

          logger.info('[SMTP] Sending email via SMTP...', {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            htmlLength: emailData.html?.length || 0,
            textLength: emailData.text?.length || 0
          });

          // Retry logic for SMTP sending
          const maxRetries = 2;
          let lastError: any = null;
          let currentTransporter = transporter;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              // Reset transporter if this is a retry after a connection error
              if (attempt > 1 && lastError) {
                const isConnectionError = lastError?.message?.includes('timeout') || 
                                        lastError?.message?.includes('Connection') ||
                                        lastError?.code === 'ETIMEDOUT' ||
                                        lastError?.code === 'ECONNREFUSED';
                
                if (isConnectionError) {
                  logger.info(`[SMTP] Retry attempt ${attempt}: Resetting transporter and creating new connection`);
                  this.resetTransporter();
                  // Get a fresh transporter
                  const freshTransporter = await this.getTransporter();
                  if (!freshTransporter) {
                    throw new Error('Could not create fresh transporter for retry');
                  }
                  currentTransporter = freshTransporter;
                }
              }

              const info = await currentTransporter.sendMail(emailData);

              logger.info('[SMTP] ✅ Email sent successfully via SMTP!', {
                attempt,
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected,
                pending: info.pending,
                to: emailData.to,
                subject: emailData.subject,
                from: emailData.from
              });

              // Clear error timestamp on success
              this.transporterLastError = null;

              return {
                success: true,
                messageId: info.messageId,
                message: 'Email sent successfully via SMTP'
              };
            } catch (sendError: any) {
              lastError = sendError;
              const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
              const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout') || sendError?.code === 'ETIMEDOUT';
              const isConnectionError = errorMessage.includes('Connection') || sendError?.code === 'ECONNREFUSED' || sendError?.code === 'ECONNRESET';
              
              logger.error(`[SMTP] ❌ Failed to send email via SMTP (attempt ${attempt}/${maxRetries})`, {
                error: errorMessage,
                code: sendError?.code,
                command: sendError?.command,
                response: sendError?.response,
                responseCode: sendError?.responseCode,
                to: emailData.to,
                subject: emailData.subject,
                isTimeout,
                isConnectionError
              });

              // Mark transporter as having errors
              this.transporterLastError = new Date();

              // If this is the last attempt, return error
              if (attempt === maxRetries) {
                // Reset transporter for next time
                if (isTimeout || isConnectionError) {
                  this.resetTransporter();
                }

                let userFriendlyError = 'Failed to send email via SMTP';
                if (isTimeout) {
                  userFriendlyError = 'SMTP connection timeout after retries. Please check your SMTP server settings, network connection, and ensure Gmail "Less secure app access" is enabled or use an App Password.';
                } else if (isConnectionError) {
                  userFriendlyError = 'SMTP connection failed. Please verify your SMTP_HOST and SMTP_PORT settings.';
                } else if (sendError?.responseCode) {
                  userFriendlyError = `SMTP server error (${sendError.responseCode}): ${errorMessage}`;
                } else {
                  userFriendlyError = `SMTP error: ${errorMessage}`;
                }
                
                return {
                  success: false,
                  message: userFriendlyError,
                  error: errorMessage
                };
              }

              // Wait before retry (exponential backoff)
              const waitTime = attempt * 1000; // 1s, 2s
              logger.info(`[SMTP] Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } else {
          const errorMsg = 'SMTP transporter could not be initialized. Please check your SMTP configuration.';
          logger.error('[SMTP] ❌ Transporter is null - cannot send email', {
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            hasSMTPHost: !!process.env.SMTP_HOST,
            hasSMTPUser: !!process.env.SMTP_USER,
            hasSMTPPass: !!process.env.SMTP_PASS
          });
          
          // Return detailed error instead of generic message
          return {
            success: false,
            message: errorMsg,
            error: 'SMTP configuration error: Transporter initialization failed. Please check your SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
          };
        }
      }
      
      // Try Resend as fallback (if configured and SMTP not used)
      if (useResend) {
        const resendClient = this.getResendClient();
        if (resendClient) {
          try {
            const toEmails = Array.isArray(options.to) ? options.to : [options.to];
            const result = await resendClient.emails.send({
              from: options.from || this.DEFAULT_FROM,
              to: toEmails,
              subject: options.subject,
              html: options.html,
              text: options.text,
              replyTo: options.replyTo,
              // Resend doesn't support attachments in the same way, but we can add them if needed
            });

            // Check if the email was actually sent
            if (result.error) {
              logger.error('Resend API returned an error:', {
                error: result.error,
                to: toEmails,
                subject: options.subject
              });
              throw new Error(result.error.message || 'Resend API error');
            }

            // Check if we have a valid response
            if (!result.data || !result.data.id) {
              logger.error('Resend API response missing data.id:', {
                result,
                to: toEmails,
                subject: options.subject
              });
              throw new Error('Invalid response from Resend API');
            }

            logger.info('Email sent successfully via Resend', {
              messageId: result.data.id,
              to: toEmails,
              subject: options.subject
            });

            return {
              success: true,
              messageId: result.data.id,
              message: 'Email sent successfully via Resend'
            };
          } catch (resendError: any) {
            // Log full error details for debugging
            const errorMessage = resendError?.message || resendError?.error?.message || String(resendError);
            const errorDetails = {
              message: errorMessage,
              name: resendError?.name,
              code: resendError?.code || resendError?.error?.code,
              status: resendError?.status || resendError?.response?.status,
              fullError: resendError
            };
            
            logger.error('Resend email failed, trying SMTP fallback', {
              error: errorDetails,
              to: Array.isArray(options.to) ? options.to : [options.to],
              subject: options.subject,
              from: options.from || this.DEFAULT_FROM
            });
            
            // Check for common Resend errors
            if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid_api_key')) {
              logger.error('Resend API key is invalid. Please check your RESEND_API_KEY in environment variables.');
            } else if (errorMessage.includes('domain') || errorMessage.includes('Domain') || errorMessage.includes('verify a domain') || errorMessage.includes('testing emails')) {
              logger.error('Resend domain not verified. Falling back to SMTP. To use Resend, verify a domain at resend.com/domains');
              logger.info('Using SMTP fallback - make sure SMTP credentials are configured in your .env file');
            } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
              logger.error('Resend rate limit exceeded. Please wait before sending more emails.');
            }
            
            // Fall through to SMTP fallback (if Resend fails)
            // Try SMTP as fallback when Resend fails
            logger.info('[SMTP] Attempting SMTP fallback after Resend failure...');
            const fallbackTransporter = await this.getTransporter();
            if (fallbackTransporter) {
              logger.info('[SMTP] Fallback transporter obtained, preparing email data...');
              const emailData = {
                from: options.from || this.DEFAULT_FROM,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                replyTo: options.replyTo,
                attachments: options.attachments
              };

              logger.info('[SMTP] Sending email via SMTP (fallback)...', {
                from: emailData.from,
                to: emailData.to,
                subject: emailData.subject
              });

              try {
                const info = await fallbackTransporter.sendMail(emailData);

                logger.info('[SMTP] ✅ Email sent successfully via SMTP (Resend fallback)!', {
                  messageId: info.messageId,
                  response: info.response,
                  accepted: info.accepted,
                  rejected: info.rejected,
                  pending: info.pending,
                  to: emailData.to,
                  subject: emailData.subject,
                  from: emailData.from
                });

                return {
                  success: true,
                  messageId: info.messageId,
                  message: 'Email sent successfully via SMTP'
                };
              } catch (fallbackError: any) {
                const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout') || fallbackError?.code === 'ETIMEDOUT';
                
                logger.error('[SMTP] ❌ SMTP fallback also failed', {
                  error: errorMessage,
                  stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
                  code: fallbackError?.code,
                  command: fallbackError?.command,
                  response: fallbackError?.response,
                  responseCode: fallbackError?.responseCode,
                  to: emailData.to,
                  subject: emailData.subject,
                  isTimeout
                });
                
                // Return error instead of throwing
                return {
                  success: false,
                  message: isTimeout 
                    ? 'SMTP connection timeout. Please check your SMTP server settings.'
                    : `SMTP fallback failed: ${errorMessage}`,
                  error: errorMessage
                };
              }
            } else {
              logger.error('[SMTP] ❌ Fallback transporter is null - cannot send email', {
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject
              });
              
              return {
                success: false,
                message: 'SMTP fallback transporter could not be initialized',
                error: 'SMTP configuration error: Fallback transporter initialization failed'
              };
            }
          }
        }
      }

      // No email service configured
      logger.warn('[EMAIL] ❌ Email not sent - no email service configured', {
        subject: options.subject,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        USE_SMTP: process.env.USE_SMTP,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSMTPHost: !!process.env.SMTP_HOST,
        hasSMTPUser: !!process.env.SMTP_USER,
        hasSMTPPass: !!process.env.SMTP_PASS
      });
      logger.warn('[EMAIL] To enable emails, configure RESEND_API_KEY (recommended) or SMTP credentials in your .env file');
      return {
        success: false,
        message: 'Email service not configured',
        error: 'No email service available (Resend or SMTP)'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
      
      logger.error('[EMAIL] ❌ Failed to send email - Top level catch', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        from: options.from || this.DEFAULT_FROM,
        isTimeout,
        fullError: error
      });

      let userFriendlyMessage = 'Failed to send email';
      if (isTimeout) {
        userFriendlyMessage = 'Email service timeout. Please check your email service configuration and try again.';
      } else if (errorMessage.includes('Connection')) {
        userFriendlyMessage = 'Email service connection failed. Please verify your email service settings.';
      }

      return {
        success: false,
        message: userFriendlyMessage,
        error: errorMessage
      };
    }
  }

  /**
   * Send templated email
   */
  static async sendTemplatedEmail(
    templateName: string,
    to: string | string[],
    data: Record<string, any>,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResult> {
    try {
      const template = this.TEMPLATES[templateName];
      if (!template) {
        return {
          success: false,
          message: `Email template '${templateName}' not found`
        };
      }

      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, data);
      const html = this.replaceTemplateVariables(template.html, data);
      const text = template.text ? this.replaceTemplateVariables(template.text, data) : undefined;

      const emailOptions: EmailOptions = {
        to,
        subject,
        html,
        text,
        ...options
      };

      return await this.sendEmail(emailOptions);

    } catch (error) {
      logger.error('Failed to send templated email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateName,
        to,
        data
      });

      return {
        success: false,
        message: 'Failed to send templated email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(
    to: string,
    name: string,
    verificationToken: string
  ): Promise<EmailResult> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/auth/verify-email?token=${verificationToken}`;
    
    return await this.sendTemplatedEmail('email_verification', to, {
      name,
      verificationUrl
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    to: string,
    name: string
  ): Promise<EmailResult> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/dashboard`;
    
    return await this.sendTemplatedEmail('welcome', to, {
      name,
      dashboardUrl
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('password_reset', to, { name, resetLink });
  }

  /**
   * Send payment success email
   */
  static async sendPaymentSuccessEmail(
    to: string,
    data: {
      customerName: string;
      amount: number;
      currency: string;
      reference: string;
      date: string;
      paymentMethod: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('payment_success', to, data);
  }

  /**
   * Send payment receipt to customer
   */
  static async sendPaymentReceipt(
    to: string,
    data: {
      customerName: string;
      amount: number;
      currency: string;
      reference: string;
      date: string;
      paymentMethod: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('payment_receipt', to, data);
  }

  /**
   * Send owner transaction alert
   */
  static async sendOwnerTransactionAlert(
    to: string,
    data: {
      customerEmail: string;
      amount: number;
      currency: string;
      reference: string;
      date: string;
      paymentMethod: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('owner_transaction_alert', to, data);
  }

  /**
   * Send payment failed email
   */
  static async sendPaymentFailedEmail(
    to: string,
    data: {
      customerName: string;
      amount: number;
      currency: string;
      reference: string;
      date: string;
      reason: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('payment_failed', to, data);
  }

  /**
   * Send refund processed email
   */
  static async sendRefundProcessedEmail(
    to: string,
    data: {
      customerName: string;
      amount: number;
      currency: string;
      reference: string;
      date: string;
      reason: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('refund_processed', to, data);
  }

  /**
   * Send security question reset email
   */
  static async sendSecurityQuestionResetEmail(
    to: string,
    name: string,
    resetToken: string
  ): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://transactlab-payment-sandbox.vercel.app'}/auth/reset-security-question?token=${resetToken}`;
    
    return await this.sendTemplatedEmail('security_question_reset', to, {
      name,
      resetUrl
    });
  }

  /**
   * Send subscription billed email
   */
  static async sendSubscriptionBilledEmail(
    to: string,
    data: {
      customerName: string;
      amount: number;
      currency: string;
      subscriptionId: string;
      billingCycle: number;
      nextBillingDate: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('subscription_billed', to, data);
  }

  /**
   * Send subscription started email
   */
  static async sendSubscriptionStartedEmail(
    to: string,
    data: {
      customerName: string;
      planName: string;
      amount: number;
      currency: string;
      interval: string;
      subscriptionId: string;
      nextBillingDate: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('subscription_started', to, data);
  }

  /**
   * Send upcoming billing reminder email
   */
  static async sendUpcomingBillingReminder(
    to: string,
    data: {
      customerName: string;
      planName: string;
      amount: number;
      currency: string;
      interval: string;
      nextBillingDate: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('subscription_upcoming_invoice', to, data);
  }

  /**
   * Send subscription cancelled email
   */
  static async sendSubscriptionCancelledEmail(
    to: string,
    data: {
      customerName: string;
      subscriptionId: string;
      cancelledAt: string;
      reason: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('subscription_cancelled', to, data);
  }

  /**
   * Send account activated email
   */
  static async sendAccountActivatedEmail(
    to: string,
    data: {
      customerName: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('account_activated', to, data);
  }

  /**
   * Send account deactivated email
   */
  static async sendAccountDeactivatedEmail(
    to: string,
    data: {
      customerName: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('account_deactivated', to, data);
  }

  /**
   * Send account verified email
   */
  static async sendAccountVerifiedEmail(
    to: string,
    data: {
      customerName: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('account_verified', to, data);
  }

  /**
   * Send role changed email
   */
  static async sendRoleChangedEmail(
    to: string,
    data: {
      customerName: string;
      oldRole: string;
      newRole: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('role_changed', to, data);
  }

  /**
   * Send merchant activated email
   */
  static async sendMerchantActivatedEmail(
    to: string,
    data: {
      businessName: string;
      businessEmail: string;
      businessName2: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('merchant_activated', to, data);
  }

  /**
   * Send merchant deactivated email
   */
  static async sendMerchantDeactivatedEmail(
    to: string,
    data: {
      businessName: string;
      businessEmail: string;
      businessName2: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('merchant_deactivated', to, data);
  }

  /**
   * Send merchant verified email
   */
  static async sendMerchantVerifiedEmail(
    to: string,
    data: {
      businessName: string;
      businessEmail: string;
      businessName2: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('merchant_verified', to, data);
  }

  /**
   * Send team invite email (simple HTML)
   */
  static async sendTeamInvite(to: string, acceptUrl: string): Promise<EmailResult> {
    // EMAIL SERVICES DISABLED
    if (this.EMAIL_DISABLED) {
      logger.info('[EMAIL] ⚠️ Email services are disabled - team invite not sent', { to });
      return {
        success: true,
        message: 'Email service is disabled',
        messageId: 'disabled'
      };
    }
    
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: this.DEFAULT_FROM,
        to,
        subject: 'TransactLab Team Invite',
        html: `<div style="font-family:Arial,sans-serif"><h2>You're invited to a TransactLab workspace</h2><p>Click to join: <a href="${acceptUrl}">${acceptUrl}</a></p><p>If you don't have an account yet, register first and then return to this link.</p></div>`
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send team invite', { error });
      return { success: false, error: 'send_failed' };
    }
  }

  /**
   * Send invoice to customer
   */
  static async sendInvoiceToCustomer(
    to: string,
    data: {
      customerName: string;
      invoiceId: string;
      amount: string;
      currency: string;
      dueDate: string;
      description: string;
      paymentUrl: string;
      businessName: string;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('invoice_sent', to, data);
  }

  /**
   * Send invoice payment reminder
   */
  static async sendInvoiceReminder(
    to: string,
    data: {
      customerName: string;
      invoiceId: string;
      amount: string;
      currency: string;
      dueDate: string;
      description: string;
      paymentUrl: string;
      businessName: string;
      daysUntilDue: number;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('invoice_reminder', to, data);
  }

  /**
   * Send overdue invoice notification
   */
  static async sendOverdueInvoiceNotification(
    to: string,
    data: {
      customerName: string;
      invoiceId: string;
      amount: string;
      currency: string;
      dueDate: string;
      description: string;
      paymentUrl: string;
      businessName: string;
      daysOverdue: number;
    }
  ): Promise<EmailResult> {
    return await this.sendTemplatedEmail('invoice_overdue', to, data);
  }

  /**
   * Format amount and currency for display
   */
  static formatAmount(amount: number, currency: string): string {
    try {
      // Convert to number if it's a string
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numAmount)) {
        return `${amount} ${currency}`;
      }

      // Format based on currency
      const currencySymbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CHF': 'CHF',
        'CNY': '¥',
        'SEK': 'kr',
        'NOK': 'kr',
        'DKK': 'kr',
        'PLN': 'zł',
        'CZK': 'Kč',
        'HUF': 'Ft',
        'RUB': '₽',
        'BRL': 'R$',
        'MXN': '$',
        'INR': '₹',
        'KRW': '₩',
        'SGD': 'S$',
        'HKD': 'HK$',
        'NZD': 'NZ$',
        'ZAR': 'R',
        'TRY': '₺',
        'ILS': '₪',
        'AED': 'د.إ',
        'SAR': 'ر.س',
        'QAR': 'ر.ق',
        'KWD': 'د.ك',
        'BHD': 'د.ب',
        'OMR': 'ر.ع.',
        'JOD': 'د.أ',
        'LBP': 'ل.ل',
        'EGP': 'ج.م',
        'MAD': 'د.م.',
        'TND': 'د.ت',
        'DZD': 'د.ج',
        'LYD': 'ل.د',
        'SDG': 'ج.س.',
        'ETB': 'Br',
        'KES': 'KSh',
        'UGX': 'USh',
        'TZS': 'TSh',
        'ZMW': 'ZK',
        'BWP': 'P',
        'SZL': 'L',
        'LSL': 'L',
        'NAD': 'N$',
        'MUR': '₨',
        'SCR': '₨',
        'MVR': 'ރ',
        'LKR': '₨',
        'BDT': '৳',
        'NPR': '₨',
        'PKR': '₨',
        'AFN': '؋',
        'IRR': '﷼',
        'IQD': 'ع.د',
        'SYP': 'ل.س',
        'YER': '﷼',
        'JMD': 'J$',
        'BBD': 'Bds$',
        'BZD': 'BZ$',
        'TTD': 'TT$',
        'XCD': 'EC$',
        'AWG': 'ƒ',
        'BMD': 'BD$',
        'KYD': 'CI$',
        'FJD': 'FJ$',
        'PGK': 'K',
        'SBD': 'SI$',
        'TOP': 'T$',
        'VUV': 'Vt',
        'WST': 'WS$',
        'NIO': 'C$',
        'PAB': 'B/.',
        'CRC': '₡',
        'GTQ': 'Q',
        'HNL': 'L',
        'SVC': '₡',
        'DOP': 'RD$',
        'HTG': 'G',
        'CUP': '$',
        'UYU': '$U',
        'ARS': '$',
        'BOB': 'Bs',
        'CLP': '$',
        'COP': '$',
        'PEN': 'S/.',
        'VES': 'Bs.S',
        'GYD': 'G$',
        'SRD': '$',
        'UYI': 'UYI',
        'PYG': '₲',
        'BIF': 'FBu',
        'CDF': 'FC',
        'DJF': 'Fdj',
        'ERN': 'Nfk',
        'KMF': 'CF',
        'RWF': 'RF',
        'SOS': 'S',
        'XAF': 'FCFA',
        'XOF': 'CFA',
        'XPF': '₣',
        'AOA': 'Kz',
        'MGA': 'Ar',
        'MZN': 'MT',
        'ZWL': 'Z$',
        'AMD': '֏',
        'AZN': '₼',
        'BYN': 'Br',
        'GEL': '₾',
        'KZT': '₸',
        'KGS': 'с',
        'MDL': 'L',
        'TJS': 'SM',
        'TMT': 'T',
        'UAH': '₴',
        'UZS': 'сўм',
        'BGN': 'лв',
        'HRK': 'kn',
        'EEK': 'kr',
        'ISK': 'kr',
        'LVL': 'Ls',
        'LTL': 'Lt',
        'MKD': 'ден',
        'RON': 'lei',
        'RSD': 'дин',
        'SKK': 'Sk',
        'ALL': 'L',
        'BAM': 'КМ',
        'MNT': '₮',
        'BTN': 'Nu.'
      };

      const symbol = currencySymbols[currency.toUpperCase()] || currency;
      
      // Format number with proper decimal places
      let formattedAmount: string;
      
      if (currency.toUpperCase() === 'JPY' || currency.toUpperCase() === 'KRW') {
        // No decimal places for JPY and KRW
        formattedAmount = Math.round(numAmount).toLocaleString('en-US');
      } else {
        // 2 decimal places for most currencies
        formattedAmount = numAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }

      // Return formatted amount with currency symbol
      return `${symbol}${formattedAmount}`;
    } catch (error) {
      logger.error('Failed to format amount', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount,
        currency
      });
      return `${amount} ${currency}`;
    }
  }

  /**
   * Replace template variables
   */
  static replaceTemplateVariables(template: string, data: Record<string, any>): string {
    try {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (data[key] !== undefined) {
          // Special formatting for amount and currency combinations
          if (key === 'amount' && data.currency) {
            return this.formatAmount(data[key], data.currency);
          }
          return String(data[key]);
        }
        return match;
      });
    } catch (error) {
      logger.error('Failed to replace template variables', {
        error: error instanceof Error ? error.message : 'Unknown error',
        template,
        data
      });
      return template;
    }
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): string[] {
    return Object.keys(this.TEMPLATES);
  }

  /**
   * Get template
   */
  static getTemplate(templateName: string): EmailTemplate | null {
    return this.TEMPLATES[templateName] || null;
  }

  /**
   * Test SMTP connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Test amount formatting
   */
  static testAmountFormatting(): void {
    const testCases = [
      { amount: 100, currency: 'USD', expected: '$100.00' },
      { amount: 25.50, currency: 'EUR', expected: '€25.50' },
      { amount: 1000, currency: 'JPY', expected: '¥1,000' },
      { amount: 1500.75, currency: 'GBP', expected: '£1,500.75' },
      { amount: 99.99, currency: 'CAD', expected: 'C$99.99' },
      { amount: 50000, currency: 'KRW', expected: '₩50,000' },
      { amount: 2500, currency: 'INR', expected: '₹2,500.00' },
      { amount: 100, currency: 'UNKNOWN', expected: 'UNKNOWN100.00' }
    ];

    console.log('Testing amount formatting:');
    testCases.forEach(({ amount, currency, expected }) => {
      const result = this.formatAmount(amount, currency);
      const status = result === expected ? '✓' : '✗';
      console.log(`${status} ${amount} ${currency} -> ${result} (expected: ${expected})`);
    });
  }
}

export default EmailService; 