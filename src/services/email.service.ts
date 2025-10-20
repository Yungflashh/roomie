import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

class EmailTemplateService {
  private transporter: nodemailer.Transporter;
  private baseUrl: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  }

  private compileTemplate(templateName: string, data: any): string {
    try {
      // Read base template
      const basePath = path.join(__dirname, '../templates/emails/base.mjml');
      const baseTemplate = fs.readFileSync(basePath, 'utf8');

      // Read content template
      const contentPath = path.join(__dirname, `../templates/emails/${templateName}.mjml`);
      const contentTemplate = fs.readFileSync(contentPath, 'utf8');

      // Compile content with Handlebars
      const contentCompiled = Handlebars.compile(contentTemplate);
      const contentHtml = contentCompiled(data);

      // Inject content into base
      const fullTemplate = baseTemplate.replace('{{{content}}}', contentHtml);

      // Compile full template with base data
      const baseData = {
        ...data,
        year: new Date().getFullYear(),
        baseUrl: this.baseUrl,
      };
      const fullCompiled = Handlebars.compile(fullTemplate);
      const mjmlTemplate = fullCompiled(baseData);

      // Convert MJML to HTML
      const { html } = mjml2html(mjmlTemplate, {
        validationLevel: 'soft',
      });

      return html;
    } catch (error) {
      logger.error(`Error compiling email template ${templateName}:`, error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = this.compileTemplate(options.template, options.data);

      const mailOptions = {
        from: `${process.env.APP_NAME || 'Roommate Finder'} <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    } catch (error) {
      logger.error(`Error sending email:`, error);
      throw error;
    }
  }

  // Specific email methods
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Roommate Finder! 🎉',
      template: 'welcome',
      data: {
        subject: 'Welcome to Roommate Finder',
        preview: 'Start your journey to finding the perfect roommate',
        firstName,
        profileUrl: `${this.baseUrl}/profile/edit`,
      },
    });
  }

  async sendMatchEmail(
    email: string,
    firstName: string,
    matchData: {
      matchName: string;
      compatibilityScore: number;
      budgetRange: string;
      sharedInterests: string;
      matchId: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `It's a Match with ${matchData.matchName}! 🎉`,
      template: 'match',
      data: {
        subject: "You've got a new match!",
        preview: `You matched with ${matchData.matchName}`,
        firstName,
        ...matchData,
        chatUrl: `${this.baseUrl}/matches/${matchData.matchId}/chat`,
      },
    });
  }

  async sendPaymentReceipt(
    email: string,
    firstName: string,
    paymentData: {
      description: string;
      amount: number;
      currency: string;
      transactionId: string;
      date: string;
      paymentMethod: string;
      receiptUrl: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment Receipt - Roommate Finder',
      template: 'payment-receipt',
      data: {
        subject: 'Your Payment Receipt',
        preview: `Receipt for ${paymentData.description}`,
        firstName,
        ...paymentData,
      },
    });
  }

  async sendDailyDigest(
    email: string,
    firstName: string,
    digestData: {
      newMatches: number;
      unreadMessages: number;
      profileViews: number;
      hasNewMatches: boolean;
      hasUnreadMessages: boolean;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Daily Digest 📊',
      template: 'daily-digest',
      data: {
        subject: 'Your Daily Digest',
        preview: `${digestData.newMatches} new matches, ${digestData.unreadMessages} messages`,
        firstName,
        ...digestData,
        dashboardUrl: `${this.baseUrl}/dashboard`,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;

    // Create a simple verification template inline for now
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background-color: #4F46E5; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Roommate Finder</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thanks for signing up! Please verify your email address to get started.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${verificationUrl}</p>
              <p style="color: #ef4444; font-size: 13px; margin-top: 20px;">⚠️ This link will expire in 24 hours.</p>
              <p style="color: #6b7280; font-size: 13px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Roommate Finder. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `${process.env.APP_NAME || 'Roommate Finder'} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email - Roommate Finder',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background-color: #4F46E5; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>We received a request to reset your password.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">This link will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Roommate Finder. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `${process.env.APP_NAME || 'Roommate Finder'} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Reset Your Password - Roommate Finder',
      html,
    });
  }
}

export const emailTemplateService = new EmailTemplateService();