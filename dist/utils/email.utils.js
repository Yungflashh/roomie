"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./logger");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `${process.env.APP_NAME || 'Roommate Finder'} <${process.env.EMAIL_FROM}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            };
            const info = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info(`Email sent: ${info.messageId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending email: ${error}`);
            throw error;
        }
    }
    async sendVerificationEmail(email, token, firstName) {
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Roommate Finder!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thanks for signing up! Please verify your email address to get started.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Roommate Finder. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Verify Your Email - Roommate Finder',
            html,
        });
    }
    async sendPasswordResetEmail(email, token, firstName) {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>We received a request to reset your password.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Roommate Finder. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Roommate Finder',
            html,
        });
    }
    async sendWelcomeEmail(email, firstName) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .feature { margin: 15px 0; padding: 15px; background-color: white; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Roommate Finder!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Your email has been verified! You're all set to find your perfect roommate.</p>
              
              <h3>Get Started:</h3>
              <div class="feature">
                <strong>1. Complete Your Profile</strong>
                <p>Add photos, interests, and preferences to help find compatible roommates.</p>
              </div>
              <div class="feature">
                <strong>2. Browse Matches</strong>
                <p>Discover roommates based on lifestyle compatibility and location.</p>
              </div>
              <div class="feature">
                <strong>3. Play Games & Bond</strong>
                <p>Break the ice with fun games and weekly challenges!</p>
              </div>
              
              <p>Happy roommate hunting! 🏠</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Roommate Finder. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Welcome to Roommate Finder! 🎉',
            html,
        });
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=email.utils.js.map