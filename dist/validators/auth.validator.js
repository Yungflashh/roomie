"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidator = void 0;
const express_validator_1 = require("express-validator");
class AuthValidator {
    static register() {
        return [
            (0, express_validator_1.body)('email')
                .trim()
                .isEmail()
                .withMessage('Please provide a valid email address')
                .normalizeEmail(),
            (0, express_validator_1.body)('password')
                .isLength({ min: 8 })
                .withMessage('Password must be at least 8 characters long')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
            (0, express_validator_1.body)('confirmPassword')
                .custom((value, { req }) => value === req.body.password)
                .withMessage('Passwords do not match'),
            (0, express_validator_1.body)('firstName')
                .trim()
                .notEmpty()
                .withMessage('First name is required')
                .isLength({ min: 2, max: 50 })
                .withMessage('First name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('lastName')
                .trim()
                .notEmpty()
                .withMessage('Last name is required')
                .isLength({ min: 2, max: 50 })
                .withMessage('Last name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('dateOfBirth')
                .isISO8601()
                .withMessage('Please provide a valid date of birth')
                .custom((value) => {
                const age = new Date().getFullYear() - new Date(value).getFullYear();
                if (age < 18) {
                    throw new Error('You must be at least 18 years old to register');
                }
                return true;
            }),
            (0, express_validator_1.body)('gender')
                .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
                .withMessage('Please select a valid gender'),
            (0, express_validator_1.body)('phoneNumber')
                .optional()
                .isMobilePhone('any')
                .withMessage('Please provide a valid phone number'),
        ];
    }
    static login() {
        return [
            (0, express_validator_1.body)('email')
                .trim()
                .isEmail()
                .withMessage('Please provide a valid email address')
                .normalizeEmail(),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('Password is required'),
        ];
    }
    static forgotPassword() {
        return [
            (0, express_validator_1.body)('email')
                .trim()
                .isEmail()
                .withMessage('Please provide a valid email address')
                .normalizeEmail(),
        ];
    }
    static resetPassword() {
        return [
            (0, express_validator_1.body)('token')
                .notEmpty()
                .withMessage('Reset token is required'),
            (0, express_validator_1.body)('password')
                .isLength({ min: 8 })
                .withMessage('Password must be at least 8 characters long')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
            (0, express_validator_1.body)('confirmPassword')
                .custom((value, { req }) => value === req.body.password)
                .withMessage('Passwords do not match'),
        ];
    }
    static changePassword() {
        return [
            (0, express_validator_1.body)('currentPassword')
                .notEmpty()
                .withMessage('Current password is required'),
            (0, express_validator_1.body)('newPassword')
                .isLength({ min: 8 })
                .withMessage('New password must be at least 8 characters long')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
                .custom((value, { req }) => value !== req.body.currentPassword)
                .withMessage('New password must be different from current password'),
            (0, express_validator_1.body)('confirmPassword')
                .custom((value, { req }) => value === req.body.newPassword)
                .withMessage('Passwords do not match'),
        ];
    }
    static verifyEmail() {
        return [
            (0, express_validator_1.body)('token')
                .notEmpty()
                .withMessage('Verification token is required'),
        ];
    }
    static refreshToken() {
        return [
            (0, express_validator_1.body)('refreshToken')
                .notEmpty()
                .withMessage('Refresh token is required'),
        ];
    }
}
exports.AuthValidator = AuthValidator;
//# sourceMappingURL=auth.validator.js.map