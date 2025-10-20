import { body, param, ValidationChain } from 'express-validator';

export class MatchValidator {
  static likeProfile(): ValidationChain[] {
    return [
      param('profileId').isMongoId().withMessage('Invalid profile ID'),

      body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Message cannot exceed 500 characters'),
    ];
  }

  static dislikeProfile(): ValidationChain[] {
    return [param('profileId').isMongoId().withMessage('Invalid profile ID')];
  }

  static getMatchById(): ValidationChain[] {
    return [param('matchId').isMongoId().withMessage('Invalid match ID')];
  }

  static reportMatch(): ValidationChain[] {
    return [
      param('matchId').isMongoId().withMessage('Invalid match ID'),

      body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters'),
    ];
  }

  static scheduleMeeting(): ValidationChain[] {
    return [
      param('matchId').isMongoId().withMessage('Invalid match ID'),

      body('date')
        .isISO8601()
        .withMessage('Valid date is required')
        .custom((value) => new Date(value) > new Date())
        .withMessage('Meeting date must be in the future'),

      body('location').trim().notEmpty().withMessage('Location is required'),

      body('type')
        .isIn(['virtual', 'in-person'])
        .withMessage('Type must be virtual or in-person'),
    ];
  }

  static unmatch(): ValidationChain[] {
    return [
      param('matchId').isMongoId().withMessage('Invalid match ID'),

      body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters'),
    ];
  }
}