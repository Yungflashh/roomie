"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const jwt_utils_1 = require("../../utils/jwt.utils");
const passport_1 = __importDefault(require("../../config/passport"));
class OAuthController {
}
exports.OAuthController = OAuthController;
_a = OAuthController;
// Google OAuth - Initiate
OAuthController.googleAuth = passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
});
// Google OAuth - Callback
OAuthController.googleCallback = [
    passport_1.default.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
    }),
    (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
        }
        // Generate tokens
        const tokens = jwt_utils_1.JWTUtils.generateTokens({
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
OAuthController.facebookAuth = passport_1.default.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    session: false,
});
// Facebook OAuth - Callback
OAuthController.facebookCallback = [
    passport_1.default.authenticate('facebook', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=facebook_auth_failed`,
    }),
    (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
        }
        // Generate tokens
        const tokens = jwt_utils_1.JWTUtils.generateTokens({
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
OAuthController.appleAuth = passport_1.default.authenticate('apple', {
    scope: ['name', 'email'],
    session: false,
});
// Apple OAuth - Callback
OAuthController.appleCallback = [
    passport_1.default.authenticate('apple', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=apple_auth_failed`,
    }),
    (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
        }
        // Generate tokens
        const tokens = jwt_utils_1.JWTUtils.generateTokens({
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
OAuthController.linkSocialAccount = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { provider, socialId } = req.body;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Check if social account is already linked to another user
    const existingUser = await models_1.User.findOne({
        [`socialAuth.${provider}Id`]: socialId,
    });
    if (existingUser && existingUser._id.toString() !== userId) {
        throw new ApiError_1.default(400, 'This social account is already linked to another user');
    }
    // Link social account
    user.socialAuth = {
        ...user.socialAuth,
        [`${provider}Id`]: socialId,
    };
    await user.save();
    apiResponse_1.ApiResponse.success(res, { user }, 'Social account linked successfully');
});
// Unlink social account
OAuthController.unlinkSocialAccount = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { provider } = req.params;
    const user = await models_1.User.findById(userId).select('+password');
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Check if user has password set (can't remove social auth if no password)
    if (!user.password || user.password === '') {
        throw new ApiError_1.default(400, 'Please set a password before unlinking your social account');
    }
    // Unlink social account
    if (user.socialAuth) {
        delete user.socialAuth[`${provider}Id`];
        await user.save();
    }
    apiResponse_1.ApiResponse.success(res, null, 'Social account unlinked successfully');
});
// Get connected social accounts
OAuthController.getSocialAccounts = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    const connectedAccounts = {
        google: !!user.socialAuth?.googleId,
        facebook: !!user.socialAuth?.facebookId,
        apple: !!user.socialAuth?.appleId,
    };
    apiResponse_1.ApiResponse.success(res, { connectedAccounts }, 'Connected accounts retrieved successfully');
});
//# sourceMappingURL=oauth.controller.js.map