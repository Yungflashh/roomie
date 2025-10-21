"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth/auth.controller");
const auth_validator_1 = require("../validators/auth.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const oauth_controller_1 = require("../controllers/auth/oauth.controller");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validator_1.AuthValidator.register()), auth_controller_1.AuthController.register);
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validator_1.AuthValidator.login()), auth_controller_1.AuthController.login);
router.post('/refresh-token', (0, validate_1.validate)(auth_validator_1.AuthValidator.refreshToken()), auth_controller_1.AuthController.refreshToken);
router.post('/forgot-password', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validator_1.AuthValidator.forgotPassword()), auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validator_1.AuthValidator.resetPassword()), auth_controller_1.AuthController.resetPassword);
router.post('/verify-email', (0, validate_1.validate)(auth_validator_1.AuthValidator.verifyEmail()), auth_controller_1.AuthController.verifyEmail);
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
router.post('/logout', auth_controller_1.AuthController.logout);
router.post('/logout-all', auth_controller_1.AuthController.logoutAll);
router.post('/resend-verification', auth_controller_1.AuthController.resendVerificationEmail);
router.post('/change-password', (0, validate_1.validate)(auth_validator_1.AuthValidator.changePassword()), auth_controller_1.AuthController.changePassword);
router.get('/me', auth_controller_1.AuthController.getMe);
router.patch('/me', auth_controller_1.AuthController.updateMe);
router.delete('/account', auth_controller_1.AuthController.deleteAccount);
// OAuth Routes - Google
router.get('/google', oauth_controller_1.OAuthController.googleAuth);
router.get('/google/callback', ...oauth_controller_1.OAuthController.googleCallback);
// OAuth Routes - Facebook
router.get('/facebook', oauth_controller_1.OAuthController.facebookAuth);
router.get('/facebook/callback', ...oauth_controller_1.OAuthController.facebookCallback);
// OAuth Routes - Apple
router.get('/apple', oauth_controller_1.OAuthController.appleAuth);
router.post('/apple/callback', ...oauth_controller_1.OAuthController.appleCallback);
// Social Account Management (Protected)
router.use(auth_middleware_1.protect);
// / OAuth Routes - Google
router.get('/google', oauth_controller_1.OAuthController.googleAuth);
router.get('/google/callback', ...oauth_controller_1.OAuthController.googleCallback);
// OAuth Routes - Facebook
router.get('/facebook', oauth_controller_1.OAuthController.facebookAuth);
router.get('/facebook/callback', ...oauth_controller_1.OAuthController.facebookCallback);
// OAuth Routes - Apple
router.get('/apple', oauth_controller_1.OAuthController.appleAuth);
router.post('/apple/callback', ...oauth_controller_1.OAuthController.appleCallback);
// Social Account Management (Protected)
router.use(auth_middleware_1.protect);
router.get('/social/accounts', oauth_controller_1.OAuthController.getSocialAccounts);
router.post('/social/link', oauth_controller_1.OAuthController.linkSocialAccount);
router.delete('/social/unlink/:provider', oauth_controller_1.OAuthController.unlinkSocialAccount);
exports.default = router;
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 */
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 */
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */ 
//# sourceMappingURL=auth.routes.js.map