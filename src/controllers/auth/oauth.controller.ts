import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { User } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { JWTUtils } from '../../utils/jwt.utils';
import passport from '../../config/passport';

export class OAuthController {
  // Google OAuth - Initiate
  static googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  });

  // Google OAuth - Callback
  static googleCallback = [
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
    }),
    catchAsync(async (req: Request, res: Response) => {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      user.refreshTokens.push(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Redirect to client with tokens
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}&` +
        `isNewUser=${user.createdAt > new Date(Date.now() - 60000)}`;

      res.redirect(redirectUrl);
    }),
  ];

  // Facebook OAuth - Initiate
  static facebookAuth = passport.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    session: false,
  });

  // Facebook OAuth - Callback
  static facebookCallback = [
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=facebook_auth_failed`,
    }),
    catchAsync(async (req: Request, res: Response) => {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      user.refreshTokens.push(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Redirect to client with tokens
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}&` +
        `isNewUser=${user.createdAt > new Date(Date.now() - 60000)}`;

      res.redirect(redirectUrl);
    }),
  ];

  // Apple OAuth - Initiate
  static appleAuth = passport.authenticate('apple', {
    scope: ['name', 'email'],
    session: false,
  });

  // Apple OAuth - Callback
  static appleCallback = [
    passport.authenticate('apple', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=apple_auth_failed`,
    }),
    catchAsync(async (req: Request, res: Response) => {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      user.refreshTokens.push(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Redirect to client with tokens
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}&` +
        `isNewUser=${user.createdAt > new Date(Date.now() - 60000)}`;

      res.redirect(redirectUrl);
    }),
  ];

  // Link social account to existing account
  static linkSocialAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { provider, socialId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if social account is already linked to another user
    const existingUser = await User.findOne({
      [`socialAuth.${provider}Id`]: socialId,
    });

    if (existingUser && existingUser._id.toString() !== userId) {
      throw new ApiError(400, 'This social account is already linked to another user');
    }

    // Link social account
    user.socialAuth = {
      ...user.socialAuth,
      [`${provider}Id`]: socialId,
    } as any;

    await user.save();

    ApiResponse.success(res, { user }, 'Social account linked successfully');
  });

  // Unlink social account
  static unlinkSocialAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { provider } = req.params;

    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user has password set (can't remove social auth if no password)
    if (!user.password || user.password === '') {
      throw new ApiError(400, 'Please set a password before unlinking your social account');
    }

    // Unlink social account
    if (user.socialAuth) {
      delete (user.socialAuth as any)[`${provider}Id`];
      await user.save();
    }

    ApiResponse.success(res, null, 'Social account unlinked successfully');
  });

  // Get connected social accounts
  static getSocialAccounts = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const connectedAccounts = {
      google: !!user.socialAuth?.googleId,
      facebook: !!user.socialAuth?.facebookId,
      apple: !!user.socialAuth?.appleId,
    };

    ApiResponse.success(
      res,
      { connectedAccounts },
      'Connected accounts retrieved successfully'
    );
  });
}