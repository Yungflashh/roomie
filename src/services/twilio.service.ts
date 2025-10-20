import twilio from 'twilio';
import { logger } from '../utils/logger';
import ApiError from '../utils/ApiError';

class TwilioService {
  private client: twilio.Twilio | null = null;
  private verifyServiceSid: string | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || null;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      logger.info('Twilio client initialized');
    } else {
      logger.warn('Twilio credentials not configured. SMS features will be disabled.');
    }
  }

  // Check if Twilio is configured
  isConfigured(): boolean {
    return this.client !== null;
  }

  // Send verification code using Twilio Verify
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    if (!this.client || !this.verifyServiceSid) {
      throw new ApiError(503, 'SMS service is not configured');
    }

    try {
      await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      logger.info(`Verification code sent to ${phoneNumber}`);
    } catch (error: any) {
      logger.error(`Error sending verification code: ${error.message}`);
      throw new ApiError(500, 'Failed to send verification code');
    }
  }

  // Verify code using Twilio Verify
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!this.client || !this.verifyServiceSid) {
      throw new ApiError(503, 'SMS service is not configured');
    }

    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code,
        });

      return verificationCheck.status === 'approved';
    } catch (error: any) {
      logger.error(`Error verifying code: ${error.message}`);
      return false;
    }
  }

  // Send SMS message (for notifications)
  async sendSMS(to: string, message: string): Promise<void> {
    if (!this.client) {
      throw new ApiError(503, 'SMS service is not configured');
    }

    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
      throw new ApiError(500, 'Twilio phone number not configured');
    }

    try {
      await this.client.messages.create({
        body: message,
        from,
        to,
      });

      logger.info(`SMS sent to ${to}`);
    } catch (error: any) {
      logger.error(`Error sending SMS: ${error.message}`);
      throw new ApiError(500, 'Failed to send SMS');
    }
  }

  // Send OTP via SMS (manual implementation without Verify service)
  async sendOTP(phoneNumber: string, code: string): Promise<void> {
    if (!this.client) {
      throw new ApiError(503, 'SMS service is not configured');
    }

    const message = `Your Roommate Finder verification code is: ${code}. This code expires in 10 minutes.`;
    await this.sendSMS(phoneNumber, message);
  }

  // Send match notification via SMS
  async sendMatchNotification(phoneNumber: string, matchName: string): Promise<void> {
    if (!this.client) {
      logger.warn('SMS service not configured. Skipping match notification.');
      return;
    }

    const message = `🎉 New Match on Roommate Finder! You matched with ${matchName}. Open the app to start chatting!`;
    try {
      await this.sendSMS(phoneNumber, message);
    } catch (error) {
      logger.error('Failed to send match notification SMS:', error);
      // Don't throw error - SMS is optional
    }
  }

  // Send SOS alert
  async sendSOSAlert(phoneNumber: string, userName: string, location?: string): Promise<void> {
    if (!this.client) {
      throw new ApiError(503, 'SMS service is not configured');
    }

    let message = `🚨 EMERGENCY ALERT: ${userName} has triggered an SOS alert on Roommate Finder.`;
    if (location) {
      message += ` Location: ${location}`;
    }
    message += ` Please check on them immediately.`;

    await this.sendSMS(phoneNumber, message);
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Format phone number to E.164
  formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it doesn't start with country code, add it
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      cleaned = countryCode.replace('+', '') + cleaned;
    }

    return '+' + cleaned;
  }
}

export const twilioService = new TwilioService();