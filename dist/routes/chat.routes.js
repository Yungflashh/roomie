"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat/chat.controller");
const chat_validator_1 = require("../validators/chat.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// All routes require authentication and email verification
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
// Chat room management
router.get('/rooms', chat_controller_1.ChatController.getChatRooms);
router.post('/rooms/direct', (0, validate_1.validate)(chat_validator_1.ChatValidator.createDirectChat()), chat_controller_1.ChatController.getOrCreateDirectChat);
router.get('/rooms/:roomId', (0, validate_1.validate)(chat_validator_1.ChatValidator.getChatRoomById()), chat_controller_1.ChatController.getChatRoomById);
router.patch('/rooms/:roomId/pin', (0, validate_1.validate)(chat_validator_1.ChatValidator.getChatRoomById()), chat_controller_1.ChatController.togglePin);
router.patch('/rooms/:roomId/mute', (0, validate_1.validate)(chat_validator_1.ChatValidator.getChatRoomById()), chat_controller_1.ChatController.toggleMute);
router.patch('/rooms/:roomId/archive', (0, validate_1.validate)(chat_validator_1.ChatValidator.getChatRoomById()), chat_controller_1.ChatController.toggleArchive);
// Messages
router.post('/rooms/:roomId/messages', (0, validate_1.validate)(chat_validator_1.ChatValidator.sendMessage()), chat_controller_1.ChatController.sendMessage);
router.get('/rooms/:roomId/messages', (0, validate_1.validate)(chat_validator_1.ChatValidator.getMessages()), chat_controller_1.ChatController.getMessages);
router.post('/rooms/:roomId/messages/read', (0, validate_1.validate)(chat_validator_1.ChatValidator.markAsRead()), chat_controller_1.ChatController.markAsRead);
router.get('/rooms/:roomId/search', (0, validate_1.validate)(chat_validator_1.ChatValidator.searchMessages()), chat_controller_1.ChatController.searchMessages);
// Message actions
router.patch('/messages/:messageId', (0, validate_1.validate)(chat_validator_1.ChatValidator.editMessage()), chat_controller_1.ChatController.editMessage);
router.delete('/messages/:messageId', (0, validate_1.validate)(chat_validator_1.ChatValidator.deleteMessage()), chat_controller_1.ChatController.deleteMessage);
router.post('/messages/:messageId/reaction', (0, validate_1.validate)(chat_validator_1.ChatValidator.addReaction()), chat_controller_1.ChatController.addReaction);
// Media upload
router.post('/rooms/:roomId/upload', rateLimiter_1.uploadLimiter, (0, upload_middleware_1.uploadMultiple)('files', 5), (0, validate_1.validate)(chat_validator_1.ChatValidator.uploadMedia()), chat_controller_1.ChatController.uploadMedia);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map