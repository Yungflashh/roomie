"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const phone_controller_1 = require("../controllers/auth/phone.controller");
const phone_validator_1 = require("../validators/phone.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes (for SMS login)
router.post('/login/send-otp', rateLimiter_1.authLimiter, (0, validate_1.validate)(phone_validator_1.PhoneValidator.sendLoginOTP()), phone_controller_1.PhoneController.sendLoginOTP);
router.post('/login/verify-otp', rateLimiter_1.authLimiter, (0, validate_1.validate)(phone_validator_1.PhoneValidator.verifyLoginOTP()), phone_controller_1.PhoneController.verifyLoginOTP);
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
router.post('/send-code', rateLimiter_1.authLimiter, (0, validate_1.validate)(phone_validator_1.PhoneValidator.sendVerificationCode()), phone_controller_1.PhoneController.sendVerificationCode);
router.post('/verify', rateLimiter_1.authLimiter, (0, validate_1.validate)(phone_validator_1.PhoneValidator.verifyPhoneNumber()), phone_controller_1.PhoneController.verifyPhoneNumber);
router.post('/resend-code', rateLimiter_1.authLimiter, phone_controller_1.PhoneController.resendVerificationCode);
router.patch('/update', (0, validate_1.validate)(phone_validator_1.PhoneValidator.sendVerificationCode()), phone_controller_1.PhoneController.updatePhoneNumber);
exports.default = router;
//# sourceMappingURL=phone.routes.js.map