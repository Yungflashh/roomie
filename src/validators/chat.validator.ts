import { body, param, query, ValidationChain } from 'express-validator';

export class ChatValidator {
  static createDirectChat(): ValidationChain[] {
    return [
      body('participantId')
        .isMongoId()
        .withMessage('Invalid participant ID'),
    ];
  }

  static sendMessage(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),

      body('content')
        .trim()
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ max: 5000 })
        .withMessage('Message cannot exceed 5000 characters'),

      body('type')
        .optional()
        .isIn(['text', 'image', 'video', 'audio', 'file', 'location', 'game-invite'])
        .withMessage('Invalid message type'),

      body('replyTo')
        .optional()
        .isMongoId()
        .withMessage('Invalid reply message ID'),
    ];
  }

  static getMessages(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

      query('before')
        .optional()
        .isISO8601()
        .withMessage('Before must be a valid date'),
    ];
  }

  static markAsRead(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),

      body('messageIds')
        .isArray({ min: 1 })
        .withMessage('Message IDs must be an array')
        .custom((value) => value.every((id: string) => /^[0-9a-fA-F]{24}$/.test(id)))
        .withMessage('All message IDs must be valid'),
    ];
  }

  static deleteMessage(): ValidationChain[] {
    return [
      param('messageId').isMongoId().withMessage('Invalid message ID'),

      body('deleteFor')
        .isIn(['me', 'everyone'])
        .withMessage('deleteFor must be "me" or "everyone"'),
    ];
  }

  static editMessage(): ValidationChain[] {
    return [
      param('messageId').isMongoId().withMessage('Invalid message ID'),

      body('content')
        .trim()
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ max: 5000 })
        .withMessage('Message cannot exceed 5000 characters'),
    ];
  }

  static addReaction(): ValidationChain[] {
    return [
      param('messageId').isMongoId().withMessage('Invalid message ID'),

      body('emoji')
        .trim()
        .notEmpty()
        .withMessage('Emoji is required')
        .isLength({ min: 1, max: 10 })
        .withMessage('Invalid emoji'),
    ];
  }

  static uploadMedia(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),
    ];
  }

  static searchMessages(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),

      query('query')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    ];
  }

  static getChatRoomById(): ValidationChain[] {
    return [
      param('roomId').isMongoId().withMessage('Invalid room ID'),
    ];
  }
}