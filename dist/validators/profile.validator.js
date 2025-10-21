"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileValidator = void 0;
const express_validator_1 = require("express-validator");
class ProfileValidator {
    static createProfile() {
        return [
            (0, express_validator_1.body)('headline')
                .trim()
                .notEmpty()
                .withMessage('Headline is required')
                .isLength({ max: 100 })
                .withMessage('Headline cannot exceed 100 characters'),
            (0, express_validator_1.body)('about')
                .trim()
                .notEmpty()
                .withMessage('About section is required')
                .isLength({ min: 100, max: 1000 })
                .withMessage('About section must be between 100 and 1000 characters'),
            (0, express_validator_1.body)('location.coordinates')
                .isArray({ min: 2, max: 2 })
                .withMessage('Location coordinates must be [longitude, latitude]'),
            (0, express_validator_1.body)('location.city').trim().notEmpty().withMessage('City is required'),
            (0, express_validator_1.body)('location.state').trim().notEmpty().withMessage('State is required'),
            (0, express_validator_1.body)('location.country').trim().notEmpty().withMessage('Country is required'),
            (0, express_validator_1.body)('currentLiving.hasPlace')
                .isBoolean()
                .withMessage('hasPlace must be a boolean'),
            (0, express_validator_1.body)('currentLiving.lookingFor')
                .isIn(['roommate', 'room', 'both'])
                .withMessage('lookingFor must be roommate, room, or both'),
            (0, express_validator_1.body)('matchingPreferences.budget.min')
                .isNumeric()
                .withMessage('Minimum budget must be a number')
                .custom((value, { req }) => value >= 0)
                .withMessage('Minimum budget must be non-negative'),
            (0, express_validator_1.body)('matchingPreferences.budget.max')
                .isNumeric()
                .withMessage('Maximum budget must be a number')
                .custom((value, { req }) => value > req.body.matchingPreferences.budget.min)
                .withMessage('Maximum budget must be greater than minimum budget'),
            (0, express_validator_1.body)('matchingPreferences.moveInDate')
                .isISO8601()
                .withMessage('Move-in date must be a valid date')
                .custom((value) => new Date(value) >= new Date())
                .withMessage('Move-in date must be in the future'),
            (0, express_validator_1.body)('matchingPreferences.leaseDuration')
                .isInt({ min: 1, max: 24 })
                .withMessage('Lease duration must be between 1 and 24 months'),
            (0, express_validator_1.body)('matchingPreferences.roomType')
                .isIn(['private', 'shared'])
                .withMessage('Room type must be private or shared'),
            (0, express_validator_1.body)('lifestylePreferences.sleepSchedule')
                .isIn(['early', 'moderate', 'late'])
                .withMessage('Sleep schedule must be early, moderate, or late'),
            (0, express_validator_1.body)('lifestylePreferences.cleanliness')
                .isInt({ min: 1, max: 5 })
                .withMessage('Cleanliness must be between 1 and 5'),
            (0, express_validator_1.body)('lifestylePreferences.socialLevel')
                .isIn(['introvert', 'ambivert', 'extrovert'])
                .withMessage('Social level must be introvert, ambivert, or extrovert'),
            (0, express_validator_1.body)('lifestylePreferences.smoking')
                .isBoolean()
                .withMessage('Smoking must be a boolean'),
            (0, express_validator_1.body)('lifestylePreferences.drinking')
                .isIn(['never', 'occasionally', 'regularly'])
                .withMessage('Drinking must be never, occasionally, or regularly'),
            (0, express_validator_1.body)('lifestylePreferences.pets')
                .isBoolean()
                .withMessage('Pets must be a boolean'),
            (0, express_validator_1.body)('interests')
                .isArray({ min: 1 })
                .withMessage('At least one interest is required'),
            (0, express_validator_1.body)('languages')
                .isArray({ min: 1 })
                .withMessage('At least one language is required'),
            (0, express_validator_1.body)('occupation.title')
                .trim()
                .notEmpty()
                .withMessage('Occupation title is required'),
            (0, express_validator_1.body)('occupation.employmentType')
                .isIn(['full-time', 'part-time', 'student', 'self-employed', 'unemployed'])
                .withMessage('Invalid employment type'),
        ];
    }
    static updateProfile() {
        return [
            (0, express_validator_1.body)('headline')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Headline cannot exceed 100 characters'),
            (0, express_validator_1.body)('about')
                .optional()
                .trim()
                .isLength({ min: 100, max: 1000 })
                .withMessage('About section must be between 100 and 1000 characters'),
            (0, express_validator_1.body)('matchingPreferences.budget.max')
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
    static addReference() {
        return [
            (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Reference name is required'),
            (0, express_validator_1.body)('relationship')
                .trim()
                .notEmpty()
                .withMessage('Relationship is required'),
            (0, express_validator_1.body)('phoneNumber')
                .isMobilePhone('any')
                .withMessage('Valid phone number is required'),
            (0, express_validator_1.body)('email')
                .trim()
                .isEmail()
                .withMessage('Valid email is required')
                .normalizeEmail(),
        ];
    }
    static updateStatus() {
        return [
            (0, express_validator_1.body)('status')
                .isIn(['searching', 'matched', 'inactive'])
                .withMessage('Invalid status'),
        ];
    }
}
exports.ProfileValidator = ProfileValidator;
//# sourceMappingURL=profile.validator.js.map