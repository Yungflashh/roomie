import { body, ValidationChain } from 'express-validator';

export class AuthValidator {
  static register(): ValidationChain[] {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      body('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
      
      body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
      
      body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
      
      body('dateOfBirth')
        .isISO8601()
        .withMessage('Please provide a valid date of birth')
        .custom((value) => {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 18) {
            throw new Error('You must be at least 18 years old to register');
          }
          return true;
        }),
      
      body('gender')
        .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
        .withMessage('Please select a valid gender'),
      
      body('phoneNumber')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    ];
  }

  static login(): ValidationChain[] {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required'),
    ];
  }

  static forgotPassword(): ValidationChain[] {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    ];
  }

  static resetPassword(): ValidationChain[] {
    return [
      body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      body('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
    ];
  }

  static changePassword(): ValidationChain[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        .custom((value, { req }) => value !== req.body.currentPassword)
        .withMessage('New password must be different from current password'),
      
      body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
    ];
  }

  static verifyEmail(): ValidationChain[] {
    return [
      body('token')
        .notEmpty()
        .withMessage('Verification token is required'),
    ];
  }

  static refreshToken(): ValidationChain[] {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
    ];
  }
}