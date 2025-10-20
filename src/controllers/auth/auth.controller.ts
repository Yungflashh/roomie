import { Response } from 'express';
import { AuthRequest } from '../../types';
import { User, RoommateProfile, UserGameStats } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { JWTUtils } from '../../utils/jwt.utils';
import { emailService } from '../../utils/email.utils';
import bcrypt from 'bcryptjs';

export class AuthController {
  // Register new user
  static register = catchAsync(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, dateOfBirth, gender, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, firstName);
    } catch (error) {
      // If email fails, still create the user but log the error
      console.error('Failed to send verification email:', error);
    }

    // Generate tokens
    const tokens = JWTUtils.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    // Remove password from output
   const userObject: any = user.toObject();
    delete userObject.password;

    ApiResponse.created(res, {
      user: userObject,
      tokens,
    }, 'Registration successful. Please check your email to verify your account.');
  });

  // Login user
  static login = catchAsync(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated. Please contact support.');
    }

    // Check if account is blocked
    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been blocked. Please contact support.');
    }

    // Generate tokens
    const tokens = JWTUtils.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    user.refreshTokens.push(tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Remove password from output
    const userObject: any = user.toObject();
    delete userObject.password;

    ApiResponse.success(res, {
      user: userObject,
      tokens,
    }, 'Login successful');
  });

  // Refresh access token
  static refreshToken = catchAsync(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Check if refresh token exists in user's tokens
    if (!user.refreshTokens.includes(refreshToken)) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new tokens
    const tokens = JWTUtils.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, { tokens }, 'Token refreshed successfully');
  });

  // Logout
  static logout = catchAsync(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (req.user && refreshToken) {
      // Remove refresh token from user
      const user = await User.findById(req.user.id);
      
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    }

    ApiResponse.success(res, null, 'Logout successful');
  });

  // Logout from all devices
  static logoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, null, 'Logged out from all devices successfully');
  });

  // Verify email
  static verifyEmail = catchAsync(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: { $exists: true },
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired verification token');
    }

    // Verify token
    const isValid = await bcrypt.compare(token, user.emailVerificationToken!);

    if (!isValid) {
      throw new ApiError(400, 'Invalid verification token');
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    ApiResponse.success(res, null, 'Email verified successfully');
  });

  // Resend verification email
  static resendVerificationEmail = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, 'Email is already verified');
    }

    // Generate new token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);

    ApiResponse.success(res, null, 'Verification email sent successfully');
  });

  // Forgot password
  static forgotPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      ApiResponse.success(res, null, 'If an account exists with this email, a password reset link has been sent.');
      return;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      
      ApiResponse.success(res, null, 'Password reset link sent to your email');
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      throw new ApiError(500, 'Error sending email. Please try again later.');
    }
  });

  // Reset password
  static resetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { token, password } = req.body;
    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: { $exists: true },
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Verify token
    const isValid = await bcrypt.compare(token, user.passwordResetToken!);

    if (!isValid) {
      throw new ApiError(400, 'Invalid reset token');
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Logout from all devices
    await user.save();

    // Generate new tokens
    const tokens = JWTUtils.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Save new refresh token
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, { tokens }, 'Password reset successful');
  });

  // Change password (authenticated user)
  static changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.refreshTokens = []; // Logout from all devices
    await user.save();

    // Generate new tokens
    const tokens = JWTUtils.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Save new refresh token
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, { tokens }, 'Password changed successfully');
  });

  // Get current user
  static getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Get roommate profile
    const profile = await RoommateProfile.findOne({ user: user._id });

    // Get game stats
    const gameStats = await UserGameStats.findOne({ user: user._id });

    ApiResponse.success(res, {
      user,
      profile,
      gameStats,
    }, 'User data retrieved successfully');
  });

  // Update current user
  static updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const {
      firstName,
      lastName,
      phoneNumber,
      bio,
      socialLinks,
      preferences,
    } = req.body;

    // Don't allow password or email update through this endpoint
    if (req.body.password || req.body.email) {
      throw new ApiError(400, 'Use appropriate endpoints to update password or email');
    }

    const user = await User.findById(req.user?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.bio = bio;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, { user }, 'Profile updated successfully');
  });

  // Delete account
  static deleteAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;

    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Password is incorrect');
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    // TODO: Clean up related data (matches, chats, etc.) in background job

    ApiResponse.success(res, null, 'Account deleted successfully');
  });
}