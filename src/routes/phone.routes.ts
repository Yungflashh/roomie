import { Router } from 'express';
import { PhoneController } from '../controllers/auth/phone.controller';
import { PhoneValidator } from '../validators/phone.validator';
import { validate } from '../middleware/validate';
import { protect, requireEmailVerification } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (for SMS login)
router.post(
  '/login/send-otp',
  authLimiter,
  validate(PhoneValidator.sendLoginOTP()),
  PhoneController.sendLoginOTP
);

router.post(
  '/login/verify-otp',
  authLimiter,
  validate(PhoneValidator.verifyLoginOTP()),
  PhoneController.verifyLoginOTP
);

// Protected routes (require authentication)
router.use(protect);
router.use(requireEmailVerification);

router.post(
  '/send-code',
  authLimiter,
  validate(PhoneValidator.sendVerificationCode()),
  PhoneController.sendVerificationCode
);

router.post(
  '/verify',
  authLimiter,
  validate(PhoneValidator.verifyPhoneNumber()),
  PhoneController.verifyPhoneNumber
);

router.post(
  '/resend-code',
  authLimiter,
  PhoneController.resendVerificationCode
);

router.patch(
  '/update',
  validate(PhoneValidator.sendVerificationCode()),
  PhoneController.updatePhoneNumber
);

export default router;