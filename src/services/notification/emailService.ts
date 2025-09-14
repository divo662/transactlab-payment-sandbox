import nodemailer from 'nodemailer';
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
 * Handles email notifications and templating using SMTP
 */
export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'support@portlybuilder.com';
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize SMTP transporter
   */
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailgun.org',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'support@portlybuilder.com',
          pass: process.env.SMTP_PASS || 'Sendemail135790!'
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('SMTP connection established successfully');

      return this.transporter;
    } catch (error) {
      logger.error('Failed to create SMTP transporter', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
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
              <a href="{{securityUrl}}" style="background: #0a164d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin-right: 10px;">
                View Security Settings
              </a>
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
    }
  };

  /**
   * Send email using SMTP
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const transporter = await this.getTransporter();
      
      const emailData = {
        from: options.from || this.DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments
      };

      const info = await transporter.sendMail(emailData);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: emailData.to,
        subject: emailData.subject
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };

    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      });

      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error'
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