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
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@transactlab.com';
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
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
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
              Your payment of <strong>{{amount}} {{currency}}</strong> has been processed successfully.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Transaction Details:</h3>
              <ul style="color: #555; line-height: 1.6; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong>Reference:</strong> {{reference}}</li>
                <li style="margin-bottom: 10px;"><strong>Amount:</strong> {{amount}} {{currency}}</li>
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
        
        Your payment of {{amount}} {{currency}} has been processed successfully.
        
        Transaction Details:
        - Reference: {{reference}}
        - Amount: {{amount}} {{currency}}
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
            <p style="font-size: 15px; color: #555; line-height: 1.6;">We’re confirming your payment of <strong>{{amount}} {{currency}}</strong>. Below are the details of your transaction.</p>
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
        We’re confirming your payment of {{amount}} {{currency}}.\n
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
              <li><strong>Amount:</strong> {{amount}} {{currency}}</li>
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
        Amount: {{amount}} {{currency}}\n
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
   * Replace template variables
   */
  static replaceTemplateVariables(template: string, data: Record<string, any>): string {
    try {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
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
}

export default EmailService; 