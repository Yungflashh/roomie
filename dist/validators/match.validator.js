"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchValidator = void 0;
const express_validator_1 = require("express-validator");
class MatchValidator {
    static likeProfile() {
        return [
            (0, express_validator_1.param)('profileId').isMongoId().withMessage('Invalid profile ID'),
            (0, express_validator_1.body)('message')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Message cannot exceed 500 characters'),
        ];
    }
    static dislikeProfile() {
        return [(0, express_validator_1.param)('profileId').isMongoId().withMessage('Invalid profile ID')];
    }
    static getMatchById() {
        return [(0, express_validator_1.param)('matchId').isMongoId().withMessage('Invalid match ID')];
    }
    static reportMatch() {
        return [
            (0, express_validator_1.param)('matchId').isMongoId().withMessage('Invalid match ID'),
            (0, express_validator_1.body)('reason')
                .trim()
                .notEmpty()
                .withMessage('Reason is required')
                .isLength({ max: 500 })
                .withMessage('Reason cannot exceed 500 characters'),
        ];
    }
    static scheduleMeeting() {
        return [
            (0, express_validator_1.param)('matchId').isMongoId().withMessage('Invalid match ID'),
            (0, express_validator_1.body)('date')
                .isISO8601()
                .withMessage('Valid date is required')
                .custom((value) => new Date(value) > new Date())
                .withMessage('Meeting date must be in the future'),
            (0, express_validator_1.body)('location').trim().notEmpty().withMessage('Location is required'),
            (0, express_validator_1.body)('type')
                .isIn(['virtual', 'in-person'])
                .withMessage('Type must be virtual or in-person'),
        ];
    }
    static unmatch() {
        return [
            (0, express_validator_1.param)('matchId').isMongoId().withMessage('Invalid match ID'),
            (0, express_validator_1.body)('reason')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Reason cannot exceed 500 characters'),
        ];
    }
}
exports.MatchValidator = MatchValidator;
//# sourceMappingURL=match.validator.js.map