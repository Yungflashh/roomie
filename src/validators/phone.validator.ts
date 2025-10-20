import { body, ValidationChain } from 'express-validator';

export class PhoneValidator {
  static sendVerificationCode(): ValidationChain[] {
    return [
      body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
    ];
  }

  static verifyPhoneNumber(): ValidationChain[] {
    return [
      body('code')
        .trim()
        .notEmpty()
        .withMessage('Verification code is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('Verification code must be 6 digits')
        .isNumeric()
        .withMessage('Verification code must contain only numbers'),
    ];
  }

  static sendLoginOTP(): ValidationChain[] {
    return [
      body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in E.164 format'),
    ];
  }

  static verifyLoginOTP(): ValidationChain[] {
    return [
      body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in E.164 format'),

      body('code')
        .trim()
        .notEmpty()
        .withMessage('Verification code is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('Verification code must be 6 digits')
        .isNumeric()
        .withMessage('Verification code must contain only numbers'),
    ];
  }
}