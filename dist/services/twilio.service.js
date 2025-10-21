"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const logger_1 = require("../utils/logger");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class TwilioService {
    constructor() {
        this.client = null;
        this.verifyServiceSid = null;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || null;
        if (accountSid && authToken) {
            this.client = (0, twilio_1.default)(accountSid, authToken);
            logger_1.logger.info('Twilio client initialized');
        }
        else {
            logger_1.logger.warn('Twilio credentials not configured. SMS features will be disabled.');
        }
    }
    // Check if Twilio is configured
    isConfigured() {
        return this.client !== null;
    }
    // Send verification code using Twilio Verify
    async sendVerificationCode(phoneNumber) {
        if (!this.client || !this.verifyServiceSid) {
            throw new ApiError_1.default(503, 'SMS service is not configured');
        }
        try {
            await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verifications.create({
                to: phoneNumber,
                channel: 'sms',
            });
            logger_1.logger.info(`Verification code sent to ${phoneNumber}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending verification code: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to send verification code');
        }
    }
    // Verify code using Twilio Verify
    async verifyCode(phoneNumber, code) {
        if (!this.client || !this.verifyServiceSid) {
            throw new ApiError_1.default(503, 'SMS service is not configured');
        }
        try {
            const verificationCheck = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks.create({
                to: phoneNumber,
                code,
            });
            return verificationCheck.status === 'approved';
        }
        catch (error) {
            logger_1.logger.error(`Error verifying code: ${error.message}`);
            return false;
        }
    }
    // Send SMS message (for notifications)
    async sendSMS(to, message) {
        if (!this.client) {
            throw new ApiError_1.default(503, 'SMS service is not configured');
        }
        const from = process.env.TWILIO_PHONE_NUMBER;
        if (!from) {
            throw new ApiError_1.default(500, 'Twilio phone number not configured');
        }
        try {
            await this.client.messages.create({
                body: message,
                from,
                to,
            });
            logger_1.logger.info(`SMS sent to ${to}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending SMS: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to send SMS');
        }
    }
    // Send OTP via SMS (manual implementation without Verify service)
    async sendOTP(phoneNumber, code) {
        if (!this.client) {
            throw new ApiError_1.default(503, 'SMS service is not configured');
        }
        const message = `Your Roommate Finder verification code is: ${code}. This code expires in 10 minutes.`;
        await this.sendSMS(phoneNumber, message);
    }
    // Send match notification via SMS
    async sendMatchNotification(phoneNumber, matchName) {
        if (!this.client) {
            logger_1.logger.warn('SMS service not configured. Skipping match notification.');
            return;
        }
        const message = `🎉 New Match on Roommate Finder! You matched with ${matchName}. Open the app to start chatting!`;
        try {
            await this.sendSMS(phoneNumber, message);
        }
        catch (error) {
            logger_1.logger.error('Failed to send match notification SMS:', error);
            // Don't throw error - SMS is optional
        }
    }
    // Send SOS alert
    async sendSOSAlert(phoneNumber, userName, location) {
        if (!this.client) {
            throw new ApiError_1.default(503, 'SMS service is not configured');
        }
        let message = `🚨 EMERGENCY ALERT: ${userName} has triggered an SOS alert on Roommate Finder.`;
        if (location) {
            message += ` Location: ${location}`;
        }
        message += ` Please check on them immediately.`;
        await this.sendSMS(phoneNumber, message);
    }
    // Validate phone number format
    validatePhoneNumber(phoneNumber) {
        // Basic E.164 format validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    // Format phone number to E.164
    formatPhoneNumber(phoneNumber, countryCode = '+1') {
        // Remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        // If it doesn't start with country code, add it
        if (!cleaned.startsWith(countryCode.replace('+', ''))) {
            cleaned = countryCode.replace('+', '') + cleaned;
        }
        return '+' + cleaned;
    }
}
exports.twilioService = new TwilioService();
//# sourceMappingURL=twilio.service.js.map