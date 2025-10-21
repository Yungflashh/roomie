"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatValidator = void 0;
const express_validator_1 = require("express-validator");
class ChatValidator {
    static createDirectChat() {
        return [
            (0, express_validator_1.body)('participantId')
                .isMongoId()
                .withMessage('Invalid participant ID'),
        ];
    }
    static sendMessage() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
            (0, express_validator_1.body)('content')
                .trim()
                .notEmpty()
                .withMessage('Message content is required')
                .isLength({ max: 5000 })
                .withMessage('Message cannot exceed 5000 characters'),
            (0, express_validator_1.body)('type')
                .optional()
                .isIn(['text', 'image', 'video', 'audio', 'file', 'location', 'game-invite'])
                .withMessage('Invalid message type'),
            (0, express_validator_1.body)('replyTo')
                .optional()
                .isMongoId()
                .withMessage('Invalid reply message ID'),
        ];
    }
    static getMessages() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            (0, express_validator_1.query)('before')
                .optional()
                .isISO8601()
                .withMessage('Before must be a valid date'),
        ];
    }
    static markAsRead() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
            (0, express_validator_1.body)('messageIds')
                .isArray({ min: 1 })
                .withMessage('Message IDs must be an array')
                .custom((value) => value.every((id) => /^[0-9a-fA-F]{24}$/.test(id)))
                .withMessage('All message IDs must be valid'),
        ];
    }
    static deleteMessage() {
        return [
            (0, express_validator_1.param)('messageId').isMongoId().withMessage('Invalid message ID'),
            (0, express_validator_1.body)('deleteFor')
                .isIn(['me', 'everyone'])
                .withMessage('deleteFor must be "me" or "everyone"'),
        ];
    }
    static editMessage() {
        return [
            (0, express_validator_1.param)('messageId').isMongoId().withMessage('Invalid message ID'),
            (0, express_validator_1.body)('content')
                .trim()
                .notEmpty()
                .withMessage('Message content is required')
                .isLength({ max: 5000 })
                .withMessage('Message cannot exceed 5000 characters'),
        ];
    }
    static addReaction() {
        return [
            (0, express_validator_1.param)('messageId').isMongoId().withMessage('Invalid message ID'),
            (0, express_validator_1.body)('emoji')
                .trim()
                .notEmpty()
                .withMessage('Emoji is required')
                .isLength({ min: 1, max: 10 })
                .withMessage('Invalid emoji'),
        ];
    }
    static uploadMedia() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
        ];
    }
    static searchMessages() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
            (0, express_validator_1.query)('query')
                .trim()
                .notEmpty()
                .withMessage('Search query is required')
                .isLength({ min: 2, max: 100 })
                .withMessage('Search query must be between 2 and 100 characters'),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
        ];
    }
    static getChatRoomById() {
        return [
            (0, express_validator_1.param)('roomId').isMongoId().withMessage('Invalid room ID'),
        ];
    }
}
exports.ChatValidator = ChatValidator;
//# sourceMappingURL=chat.validator.js.map