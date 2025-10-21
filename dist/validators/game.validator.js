"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatsValidator = exports.GameSessionValidator = exports.GameValidator = void 0;
const express_validator_1 = require("express-validator");
class GameValidator {
    static createGame() {
        return [
            (0, express_validator_1.body)('title')
                .trim()
                .notEmpty()
                .withMessage('Title is required')
                .isLength({ max: 100 })
                .withMessage('Title cannot exceed 100 characters'),
            (0, express_validator_1.body)('description')
                .trim()
                .notEmpty()
                .withMessage('Description is required')
                .isLength({ max: 500 })
                .withMessage('Description cannot exceed 500 characters'),
            (0, express_validator_1.body)('category')
                .isIn(['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'])
                .withMessage('Invalid category'),
            (0, express_validator_1.body)('difficulty')
                .isIn(['easy', 'medium', 'hard'])
                .withMessage('Invalid difficulty'),
            (0, express_validator_1.body)('type')
                .isIn(['daily', 'weekly', 'multiplayer', 'solo'])
                .withMessage('Invalid type'),
            (0, express_validator_1.body)('maxPlayers')
                .isInt({ min: 1, max: 10 })
                .withMessage('Max players must be between 1 and 10'),
            (0, express_validator_1.body)('minPlayers')
                .isInt({ min: 1 })
                .withMessage('Min players must be at least 1')
                .custom((value, { req }) => value <= req.body.maxPlayers)
                .withMessage('Min players cannot exceed max players'),
            (0, express_validator_1.body)('questions')
                .optional()
                .isArray()
                .withMessage('Questions must be an array'),
        ];
    }
    static updateGame() {
        return [
            (0, express_validator_1.param)('gameId').isMongoId().withMessage('Invalid game ID'),
            (0, express_validator_1.body)('title')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Title cannot exceed 100 characters'),
            (0, express_validator_1.body)('description')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot exceed 500 characters'),
        ];
    }
    static getGameById() {
        return [(0, express_validator_1.param)('gameId').isMongoId().withMessage('Invalid game ID')];
    }
    static deleteGame() {
        return [(0, express_validator_1.param)('gameId').isMongoId().withMessage('Invalid game ID')];
    }
}
exports.GameValidator = GameValidator;
class GameSessionValidator {
    static createSession() {
        return [
            (0, express_validator_1.body)('gameId').isMongoId().withMessage('Invalid game ID'),
            (0, express_validator_1.body)('invitedUsers')
                .optional()
                .isArray()
                .withMessage('Invited users must be an array'),
            (0, express_validator_1.body)('scheduledFor')
                .optional()
                .isISO8601()
                .withMessage('Scheduled time must be a valid date'),
        ];
    }
    static joinSession() {
        return [(0, express_validator_1.param)('sessionId').isMongoId().withMessage('Invalid session ID')];
    }
    static submitAnswer() {
        return [
            (0, express_validator_1.param)('sessionId').isMongoId().withMessage('Invalid session ID'),
            (0, express_validator_1.body)('questionId').trim().notEmpty().withMessage('Question ID is required'),
            (0, express_validator_1.body)('answer').trim().notEmpty().withMessage('Answer is required'),
            (0, express_validator_1.body)('timeTaken')
                .isInt({ min: 0 })
                .withMessage('Time taken must be a positive number'),
        ];
    }
}
exports.GameSessionValidator = GameSessionValidator;
class UserStatsValidator {
    static getUserStats() {
        return [(0, express_validator_1.param)('userId').isMongoId().withMessage('Invalid user ID')];
    }
    static getCategoryLeaderboard() {
        return [
            (0, express_validator_1.param)('category')
                .isIn(['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'])
                .withMessage('Invalid category'),
        ];
    }
    static manageFavorite() {
        return [(0, express_validator_1.param)('gameId').isMongoId().withMessage('Invalid game ID')];
    }
}
exports.UserStatsValidator = UserStatsValidator;
//# sourceMappingURL=game.validator.js.map