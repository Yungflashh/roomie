import { Router } from 'express';
import { ChatController } from '../controllers/chat/chat.controller';
import { ChatValidator } from '../validators/chat.validator';
import { validate } from '../middleware/validate';
import { protect, requireEmailVerification } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication and email verification
router.use(protect);
router.use(requireEmailVerification);

// Chat room management
router.get('/rooms', ChatController.getChatRooms);

router.post(
  '/rooms/direct',
  validate(ChatValidator.createDirectChat()),
  ChatController.getOrCreateDirectChat
);

router.get(
  '/rooms/:roomId',
  validate(ChatValidator.getChatRoomById()),
  ChatController.getChatRoomById
);

router.patch(
  '/rooms/:roomId/pin',
  validate(ChatValidator.getChatRoomById()),
  ChatController.togglePin
);

router.patch(
  '/rooms/:roomId/mute',
  validate(ChatValidator.getChatRoomById()),
  ChatController.toggleMute
);

router.patch(
  '/rooms/:roomId/archive',
  validate(ChatValidator.getChatRoomById()),
  ChatController.toggleArchive
);

// Messages
router.post(
  '/rooms/:roomId/messages',
  validate(ChatValidator.sendMessage()),
  ChatController.sendMessage
);

router.get(
  '/rooms/:roomId/messages',
  validate(ChatValidator.getMessages()),
  ChatController.getMessages
);

router.post(
  '/rooms/:roomId/messages/read',
  validate(ChatValidator.markAsRead()),
  ChatController.markAsRead
);

router.get(
  '/rooms/:roomId/search',
  validate(ChatValidator.searchMessages()),
  ChatController.searchMessages
);

// Message actions
router.patch(
  '/messages/:messageId',
  validate(ChatValidator.editMessage()),
  ChatController.editMessage
);

router.delete(
  '/messages/:messageId',
  validate(ChatValidator.deleteMessage()),
  ChatController.deleteMessage
);

router.post(
  '/messages/:messageId/reaction',
  validate(ChatValidator.addReaction()),
  ChatController.addReaction
);

// Media upload
router.post(
  '/rooms/:roomId/upload',
  uploadLimiter,
  uploadMultiple('files', 5),
  validate(ChatValidator.uploadMedia()),
  ChatController.uploadMedia
);

export default router;