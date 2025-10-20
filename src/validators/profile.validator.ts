import { body, ValidationChain } from 'express-validator';

export class ProfileValidator {
  static createProfile(): ValidationChain[] {
    return [
      body('headline')
        .trim()
        .notEmpty()
        .withMessage('Headline is required')
        .isLength({ max: 100 })
        .withMessage('Headline cannot exceed 100 characters'),

      body('about')
        .trim()
        .notEmpty()
        .withMessage('About section is required')
        .isLength({ min: 100, max: 1000 })
        .withMessage('About section must be between 100 and 1000 characters'),

      body('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Location coordinates must be [longitude, latitude]'),

      body('location.city').trim().notEmpty().withMessage('City is required'),

      body('location.state').trim().notEmpty().withMessage('State is required'),

      body('location.country').trim().notEmpty().withMessage('Country is required'),

      body('currentLiving.hasPlace')
        .isBoolean()
        .withMessage('hasPlace must be a boolean'),

      body('currentLiving.lookingFor')
        .isIn(['roommate', 'room', 'both'])
        .withMessage('lookingFor must be roommate, room, or both'),

      body('matchingPreferences.budget.min')
        .isNumeric()
        .withMessage('Minimum budget must be a number')
        .custom((value, { req }) => value >= 0)
        .withMessage('Minimum budget must be non-negative'),

      body('matchingPreferences.budget.max')
        .isNumeric()
        .withMessage('Maximum budget must be a number')
        .custom((value, { req }) => value > req.body.matchingPreferences.budget.min)
        .withMessage('Maximum budget must be greater than minimum budget'),

      body('matchingPreferences.moveInDate')
        .isISO8601()
        .withMessage('Move-in date must be a valid date')
        .custom((value) => new Date(value) >= new Date())
        .withMessage('Move-in date must be in the future'),

      body('matchingPreferences.leaseDuration')
        .isInt({ min: 1, max: 24 })
        .withMessage('Lease duration must be between 1 and 24 months'),

      body('matchingPreferences.roomType')
        .isIn(['private', 'shared'])
        .withMessage('Room type must be private or shared'),

      body('lifestylePreferences.sleepSchedule')
        .isIn(['early', 'moderate', 'late'])
        .withMessage('Sleep schedule must be early, moderate, or late'),

      body('lifestylePreferences.cleanliness')
        .isInt({ min: 1, max: 5 })
        .withMessage('Cleanliness must be between 1 and 5'),

      body('lifestylePreferences.socialLevel')
        .isIn(['introvert', 'ambivert', 'extrovert'])
        .withMessage('Social level must be introvert, ambivert, or extrovert'),

      body('lifestylePreferences.smoking')
        .isBoolean()
        .withMessage('Smoking must be a boolean'),

      body('lifestylePreferences.drinking')
        .isIn(['never', 'occasionally', 'regularly'])
        .withMessage('Drinking must be never, occasionally, or regularly'),

      body('lifestylePreferences.pets')
        .isBoolean()
        .withMessage('Pets must be a boolean'),

      body('interests')
        .isArray({ min: 1 })
        .withMessage('At least one interest is required'),

      body('languages')
        .isArray({ min: 1 })
        .withMessage('At least one language is required'),

      body('occupation.title')
        .trim()
        .notEmpty()
        .withMessage('Occupation title is required'),

      body('occupation.employmentType')
        .isIn(['full-time', 'part-time', 'student', 'self-employed', 'unemployed'])
        .withMessage('Invalid employment type'),
    ];
  }

  static updateProfile(): ValidationChain[] {
    return [
      body('headline')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Headline cannot exceed 100 characters'),

      body('about')
        .optional()
        .trim()
        .isLength({ min: 100, max: 1000 })
        .withMessage('About section must be between 100 and 1000 characters'),

      body('matchingPreferences.budget.max')
        .optional()
        .custom((value, { req }) => {
          if (req.body.matchingPreferences?.budget?.min) {
            return value > req.body.matchingPreferences.budget.min;
          }
          return true;
        })
        .withMessage('Maximum budget must be greater than minimum budget'),
    ];
  }

  static addReference(): ValidationChain[] {
    return [
      body('name').trim().notEmpty().withMessage('Reference name is required'),

      body('relationship')
        .trim()
        .notEmpty()
        .withMessage('Relationship is required'),

      body('phoneNumber')
        .isMobilePhone('any')
        .withMessage('Valid phone number is required'),

      body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    ];
  }

  static updateStatus(): ValidationChain[] {
    return [
      body('status')
        .isIn(['searching', 'matched', 'inactive'])
        .withMessage('Invalid status'),
    ];
  }
}