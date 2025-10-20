import { body, param, query, ValidationChain } from 'express-validator';

export class GameValidator {
  static createGame(): ValidationChain[] {
    return [
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),

      body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

      body('category')
        .isIn(['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'])
        .withMessage('Invalid category'),

      body('difficulty')
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Invalid difficulty'),

      body('type')
        .isIn(['daily', 'weekly', 'multiplayer', 'solo'])
        .withMessage('Invalid type'),

      body('maxPlayers')
        .isInt({ min: 1, max: 10 })
        .withMessage('Max players must be between 1 and 10'),

      body('minPlayers')
        .isInt({ min: 1 })
        .withMessage('Min players must be at least 1')
        .custom((value, { req }) => value <= req.body.maxPlayers)
        .withMessage('Min players cannot exceed max players'),

      body('questions')
        .optional()
        .isArray()
        .withMessage('Questions must be an array'),
    ];
  }

  static updateGame(): ValidationChain[] {
    return [
      param('gameId').isMongoId().withMessage('Invalid game ID'),

      body('title')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),

      body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    ];
  }

  static getGameById(): ValidationChain[] {
    return [param('gameId').isMongoId().withMessage('Invalid game ID')];
  }

  static deleteGame(): ValidationChain[] {
    return [param('gameId').isMongoId().withMessage('Invalid game ID')];
  }
}

export class GameSessionValidator {
  static createSession(): ValidationChain[] {
    return [
      body('gameId').isMongoId().withMessage('Invalid game ID'),

      body('invitedUsers')
        .optional()
        .isArray()
        .withMessage('Invited users must be an array'),

      body('scheduledFor')
        .optional()
        .isISO8601()
        .withMessage('Scheduled time must be a valid date'),
    ];
  }

  static joinSession(): ValidationChain[] {
    return [param('sessionId').isMongoId().withMessage('Invalid session ID')];
  }

  static submitAnswer(): ValidationChain[] {
    return [
      param('sessionId').isMongoId().withMessage('Invalid session ID'),

      body('questionId').trim().notEmpty().withMessage('Question ID is required'),

      body('answer').trim().notEmpty().withMessage('Answer is required'),

      body('timeTaken')
        .isInt({ min: 0 })
        .withMessage('Time taken must be a positive number'),
    ];
  }
}

export class UserStatsValidator {
  static getUserStats(): ValidationChain[] {
    return [param('userId').isMongoId().withMessage('Invalid user ID')];
  }

  static getCategoryLeaderboard(): ValidationChain[] {
    return [
      param('category')
        .isIn(['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'])
        .withMessage('Invalid category'),
    ];
  }

  static manageFavorite(): ValidationChain[] {
    return [param('gameId').isMongoId().withMessage('Invalid game ID')];
  }
}