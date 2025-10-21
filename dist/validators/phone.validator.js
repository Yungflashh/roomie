"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneValidator = void 0;
const express_validator_1 = require("express-validator");
class PhoneValidator {
    static sendVerificationCode() {
        return [
            (0, express_validator_1.body)('phoneNumber')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .matches(/^\+[1-9]\d{1,14}$/)
                .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
        ];
    }
    static verifyPhoneNumber() {
        return [
            (0, express_validator_1.body)('code')
                .trim()
                .notEmpty()
                .withMessage('Verification code is required')
                .isLength({ min: 6, max: 6 })
                .withMessage('Verification code must be 6 digits')
                .isNumeric()
                .withMessage('Verification code must contain only numbers'),
        ];
    }
    static sendLoginOTP() {
        return [
            (0, express_validator_1.body)('phoneNumber')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .matches(/^\+[1-9]\d{1,14}$/)
                .withMessage('Phone number must be in E.164 format'),
        ];
    }
    static verifyLoginOTP() {
        return [
            (0, express_validator_1.body)('phoneNumber')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .matches(/^\+[1-9]\d{1,14}$/)
                .withMessage('Phone number must be in E.164 format'),
            (0, express_validator_1.body)('code')
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
exports.PhoneValidator = PhoneValidator;
//# sourceMappingURL=phone.validator.js.map