import { Router } from 'express';
import { AuthController } from '../controllers/auth/auth.controller';
import { AuthValidator } from '../validators/auth.validator';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';

import { OAuthController } from '../controllers/auth/oauth.controller';
import passport from '../config/passport';


const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validate(AuthValidator.register()),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(AuthValidator.login()),
  AuthController.login
);

router.post(
  '/refresh-token',
  validate(AuthValidator.refreshToken()),
  AuthController.refreshToken
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(AuthValidator.forgotPassword()),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(AuthValidator.resetPassword()),
  AuthController.resetPassword
);

router.post(
  '/verify-email',
  validate(AuthValidator.verifyEmail()),
  AuthController.verifyEmail
);

// Protected routes (require authentication)
router.use(protect);

router.post('/logout', AuthController.logout);

router.post('/logout-all', AuthController.logoutAll);

router.post('/resend-verification', AuthController.resendVerificationEmail);

router.post(
  '/change-password',
  validate(AuthValidator.changePassword()),
  AuthController.changePassword
);

router.get('/me', AuthController.getMe);

router.patch('/me', AuthController.updateMe);

router.delete('/account', AuthController.deleteAccount);



// OAuth Routes - Google
router.get('/google', OAuthController.googleAuth);
router.get('/google/callback', ...OAuthController.googleCallback);


// OAuth Routes - Facebook
router.get('/facebook', OAuthController.facebookAuth);
router.get('/facebook/callback', ...OAuthController.facebookCallback);


// OAuth Routes - Apple
router.get('/apple', OAuthController.appleAuth);
router.post('/apple/callback', ...OAuthController.appleCallback);



// Social Account Management (Protected)
router.use(protect);
// / OAuth Routes - Google
router.get('/google', OAuthController.googleAuth);
router.get('/google/callback', ...OAuthController.googleCallback);

// OAuth Routes - Facebook
router.get('/facebook', OAuthController.facebookAuth);
router.get('/facebook/callback', ...OAuthController.facebookCallback);

// OAuth Routes - Apple
router.get('/apple', OAuthController.appleAuth);
router.post('/apple/callback', ...OAuthController.appleCallback);

// Social Account Management (Protected)
router.use(protect);

router.get('/social/accounts', OAuthController.getSocialAccounts);
router.post('/social/link', OAuthController.linkSocialAccount);
router.delete('/social/unlink/:provider', OAuthController.unlinkSocialAccount);


export default router;


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