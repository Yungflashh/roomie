import { Response } from 'express';
import { AuthRequest } from '../../types';
import { User } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { twilioService } from '../../services/twilio.service';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

// Store OTP codes temporarily (in production, use Redis)
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

export class PhoneController {
  // Send verification code
  static sendVerificationCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;

    // Validate phone number format
    if (!twilioService.validatePhoneNumber(phoneNumber)) {
      throw new ApiError(400, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({
      phoneNumber,
      isPhoneVerified: true,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(400, 'This phone number is already registered to another account');
    }

    // Update user's phone number
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.phoneNumber = phoneNumber;
    user.isPhoneVerified = false;
    await user.save({ validateBeforeSave: false });

    if (twilioService.isConfigured()) {
      // Use Twilio Verify Service
      try {
        await twilioService.sendVerificationCode(phoneNumber);
        
        ApiResponse.success(
          res,
          null,
          'Verification code sent to your phone'
        );
      } catch (error) {
        logger.error('Twilio verification failed:', error);
        // Fallback to manual OTP
        await this.sendManualOTP(phoneNumber, userId!);
        ApiResponse.success(res, null, 'Verification code sent to your phone');
      }
    } else {
      // Manual OTP implementation for development/testing
      await this.sendManualOTP(phoneNumber, userId!);
      ApiResponse.success(
        res,
        { 
          message: 'Verification code sent',
          // Only in development
          ...(process.env.NODE_ENV === 'development' && {
            devNote: 'SMS service not configured. Check server logs for OTP code.'
          })
        },
        'Verification code sent to your phone'
      );
    }
  });

  // Verify phone number with code
  static verifyPhoneNumber = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { code } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.phoneNumber) {
      throw new ApiError(400, 'Phone number not set');
    }

    let isValid = false;

    if (twilioService.isConfigured()) {
      // Verify using Twilio Verify Service
      try {
        isValid = await twilioService.verifyCode(user.phoneNumber, code);
      } catch (error) {
        logger.error('Twilio verification check failed:', error);
        // Fallback to manual verification
        isValid = this.verifyManualOTP(user.phoneNumber, code);
      }
    } else {
      // Manual OTP verification
      isValid = this.verifyManualOTP(user.phoneNumber, code);
    }

    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired verification code');
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    await user.save({ validateBeforeSave: false });

    // Clean up OTP store
    otpStore.delete(user.phoneNumber);

    ApiResponse.success(
      res,
      { isPhoneVerified: true },
      'Phone number verified successfully'
    );
  });

  // Resend verification code
  static resendVerificationCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.phoneNumber) {
      throw new ApiError(400, 'Phone number not set');
    }

    if (user.isPhoneVerified) {
      throw new ApiError(400, 'Phone number is already verified');
    }

    if (twilioService.isConfigured()) {
      await twilioService.sendVerificationCode(user.phoneNumber);
    } else {
      await this.sendManualOTP(user.phoneNumber, userId!);
    }

    ApiResponse.success(res, null, 'Verification code resent');
  });

  // Update phone number
  static updatePhoneNumber = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;

    // Validate phone number format
    if (!twilioService.validatePhoneNumber(phoneNumber)) {
      throw new ApiError(400, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }

    // Check if phone number is already used
    const existingUser = await User.findOne({
      phoneNumber,
      isPhoneVerified: true,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(400, 'This phone number is already registered to another account');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // If changing phone number, require re-verification
    user.phoneNumber = phoneNumber;
    user.isPhoneVerified = false;
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(
      res,
      { phoneNumber, isPhoneVerified: false },
      'Phone number updated. Please verify your new number.'
    );
  });

  // Helper: Send manual OTP (for development/fallback)
  private static async sendManualOTP(phoneNumber: string, userId: string): Promise<void> {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiration (10 minutes)
    otpStore.set(phoneNumber, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    logger.info(`📱 OTP for ${phoneNumber}: ${code}`);

    // Try to send via SMS if configured
    if (twilioService.isConfigured()) {
      try {
        await twilioService.sendOTP(phoneNumber, code);
      } catch (error) {
        logger.error('Failed to send SMS, code available in logs');
      }
    }
  }

  // Helper: Verify manual OTP
  private static verifyManualOTP(phoneNumber: string, code: string): boolean {
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

  // SMS login (send OTP)
  static sendLoginOTP = catchAsync(async (req: AuthRequest, res: Response) => {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!twilioService.validatePhoneNumber(phoneNumber)) {
      throw new ApiError(400, 'Invalid phone number format');
    }

    // Check if user exists
    const user = await User.findOne({ phoneNumber, isPhoneVerified: true });
    if (!user) {
      throw new ApiError(404, 'No account found with this phone number');
    }

    // Generate and send OTP
    const code = crypto.randomInt(100000, 999999).toString();
    
    otpStore.set(`login:${phoneNumber}`, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (twilioService.isConfigured()) {
      const message = `Your Roommate Finder login code is: ${code}. This code expires in 10 minutes.`;
      await twilioService.sendSMS(phoneNumber, message);
    } else {
      logger.info(`📱 Login OTP for ${phoneNumber}: ${code}`);
    }

    ApiResponse.success(res, null, 'Login code sent to your phone');
  });

  // Verify login OTP
  static verifyLoginOTP = catchAsync(async (req: AuthRequest, res: Response) => {
    const { phoneNumber, code } = req.body;

    // Verify OTP
    const storedOTP = otpStore.get(`login:${phoneNumber}`);

    if (!storedOTP || storedOTP.code !== code || storedOTP.expiresAt < new Date()) {
      throw new ApiError(400, 'Invalid or expired login code');
    }

    // Find user
    const user = await User.findOne({ phoneNumber, isPhoneVerified: true });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate tokens
    const { JWTUtils } = await import('../../utils/jwt.utils');
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

    const userObject: any = user.toObject();
    delete userObject.password;

    ApiResponse.success(
      res,
      { user: userObject, tokens },
      'Login successful'
    );
  });
}