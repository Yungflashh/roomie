"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const twilio_service_1 = require("../../services/twilio.service");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
// Store OTP codes temporarily (in production, use Redis)
const otpStore = new Map();
class PhoneController {
    // Helper: Send manual OTP (for development/fallback)
    static async sendManualOTP(phoneNumber, userId) {
        // Generate 6-digit OTP
        const code = crypto_1.default.randomInt(100000, 999999).toString();
        // Store OTP with expiration (10 minutes)
        otpStore.set(phoneNumber, {
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        logger_1.logger.info(`📱 OTP for ${phoneNumber}: ${code}`);
        // Try to send via SMS if configured
        if (twilio_service_1.twilioService.isConfigured()) {
            try {
                await twilio_service_1.twilioService.sendOTP(phoneNumber, code);
            }
            catch (error) {
                logger_1.logger.error('Failed to send SMS, code available in logs');
            }
        }
    }
    // Helper: Verify manual OTP
    static verifyManualOTP(phoneNumber, code) {
        const storedOTP = otpStore.get(phoneNumber);
        if (!storedOTP) {
            return false;
        }
        // Check if expired
        if (storedOTP.expiresAt < new Date()) {
            otpStore.delete(phoneNumber);
            return false;
        }
        // Check if code matches
        return storedOTP.code === code;
    }
}
exports.PhoneController = PhoneController;
_a = PhoneController;
// Send verification code
PhoneController.sendVerificationCode = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;
    // Validate phone number format
    if (!twilio_service_1.twilioService.validatePhoneNumber(phoneNumber)) {
        throw new ApiError_1.default(400, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
    // Check if phone number is already verified by another user
    const existingUser = await models_1.User.findOne({
        phoneNumber,
        isPhoneVerified: true,
        _id: { $ne: userId },
    });
    if (existingUser) {
        throw new ApiError_1.default(400, 'This phone number is already registered to another account');
    }
    // Update user's phone number
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    user.phoneNumber = phoneNumber;
    user.isPhoneVerified = false;
    await user.save({ validateBeforeSave: false });
    if (twilio_service_1.twilioService.isConfigured()) {
        // Use Twilio Verify Service
        try {
            await twilio_service_1.twilioService.sendVerificationCode(phoneNumber);
            apiResponse_1.ApiResponse.success(res, null, 'Verification code sent to your phone');
        }
        catch (error) {
            logger_1.logger.error('Twilio verification failed:', error);
            // Fallback to manual OTP
            await _a.sendManualOTP(phoneNumber, userId);
            apiResponse_1.ApiResponse.success(res, null, 'Verification code sent to your phone');
        }
    }
    else {
        // Manual OTP implementation for development/testing
        await _a.sendManualOTP(phoneNumber, userId);
        apiResponse_1.ApiResponse.success(res, {
            message: 'Verification code sent',
            // Only in development
            ...(process.env.NODE_ENV === 'development' && {
                devNote: 'SMS service not configured. Check server logs for OTP code.'
            })
        }, 'Verification code sent to your phone');
    }
});
// Verify phone number with code
PhoneController.verifyPhoneNumber = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { code } = req.body;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    if (!user.phoneNumber) {
        throw new ApiError_1.default(400, 'Phone number not set');
    }
    let isValid = false;
    if (twilio_service_1.twilioService.isConfigured()) {
        // Verify using Twilio Verify Service
        try {
            isValid = await twilio_service_1.twilioService.verifyCode(user.phoneNumber, code);
        }
        catch (error) {
            logger_1.logger.error('Twilio verification check failed:', error);
            // Fallback to manual verification
            isValid = _a.verifyManualOTP(user.phoneNumber, code);
        }
    }
    else {
        // Manual OTP verification
        isValid = _a.verifyManualOTP(user.phoneNumber, code);
    }
    if (!isValid) {
        throw new ApiError_1.default(400, 'Invalid or expired verification code');
    }
    // Mark phone as verified
    user.isPhoneVerified = true;
    await user.save({ validateBeforeSave: false });
    // Clean up OTP store
    otpStore.delete(user.phoneNumber);
    apiResponse_1.ApiResponse.success(res, { isPhoneVerified: true }, 'Phone number verified successfully');
});
// Resend verification code
PhoneController.resendVerificationCode = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    if (!user.phoneNumber) {
        throw new ApiError_1.default(400, 'Phone number not set');
    }
    if (user.isPhoneVerified) {
        throw new ApiError_1.default(400, 'Phone number is already verified');
    }
    if (twilio_service_1.twilioService.isConfigured()) {
        await twilio_service_1.twilioService.sendVerificationCode(user.phoneNumber);
    }
    else {
        await _a.sendManualOTP(user.phoneNumber, userId);
    }
    apiResponse_1.ApiResponse.success(res, null, 'Verification code resent');
});
// Update phone number
PhoneController.updatePhoneNumber = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;
    // Validate phone number format
    if (!twilio_service_1.twilioService.validatePhoneNumber(phoneNumber)) {
        throw new ApiError_1.default(400, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
    // Check if phone number is already used
    const existingUser = await models_1.User.findOne({
        phoneNumber,
        isPhoneVerified: true,
        _id: { $ne: userId },
    });
    if (existingUser) {
        throw new ApiError_1.default(400, 'This phone number is already registered to another account');
    }
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // If changing phone number, require re-verification
    user.phoneNumber = phoneNumber;
    user.isPhoneVerified = false;
    await user.save({ validateBeforeSave: false });
    apiResponse_1.ApiResponse.success(res, { phoneNumber, isPhoneVerified: false }, 'Phone number updated. Please verify your new number.');
});
// SMS login (send OTP)
PhoneController.sendLoginOTP = (0, catchAsync_1.default)(async (req, res) => {
    const { phoneNumber } = req.body;
    // Validate phone number
    if (!twilio_service_1.twilioService.validatePhoneNumber(phoneNumber)) {
        throw new ApiError_1.default(400, 'Invalid phone number format');
    }
    // Check if user exists
    const user = await models_1.User.findOne({ phoneNumber, isPhoneVerified: true });
    if (!user) {
        throw new ApiError_1.default(404, 'No account found with this phone number');
    }
    // Generate and send OTP
    const code = crypto_1.default.randomInt(100000, 999999).toString();
    otpStore.set(`login:${phoneNumber}`, {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    if (twilio_service_1.twilioService.isConfigured()) {
        const message = `Your Roommate Finder login code is: ${code}. This code expires in 10 minutes.`;
        await twilio_service_1.twilioService.sendSMS(phoneNumber, message);
    }
    else {
        logger_1.logger.info(`📱 Login OTP for ${phoneNumber}: ${code}`);
    }
    apiResponse_1.ApiResponse.success(res, null, 'Login code sent to your phone');
});
// Verify login OTP
PhoneController.verifyLoginOTP = (0, catchAsync_1.default)(async (req, res) => {
    const { phoneNumber, code } = req.body;
    // Verify OTP
    const storedOTP = otpStore.get(`login:${phoneNumber}`);
    if (!storedOTP || storedOTP.code !== code || storedOTP.expiresAt < new Date()) {
        throw new ApiError_1.default(400, 'Invalid or expired login code');
    }
    // Find user
    const user = await models_1.User.findOne({ phoneNumber, isPhoneVerified: true });
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Generate tokens
    const { JWTUtils } = await Promise.resolve().then(() => __importStar(require('../../utils/jwt.utils')));
    const tokens = JWTUtils.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    });
    // Save refresh token
    user.refreshTokens.push(tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    // Clean up OTP
    otpStore.delete(`login:${phoneNumber}`);
    const userObject = user.toObject();
    delete userObject.password;
    apiResponse_1.ApiResponse.success(res, { user: userObject, tokens }, 'Login successful');
});
//# sourceMappingURL=phone.controller.js.map