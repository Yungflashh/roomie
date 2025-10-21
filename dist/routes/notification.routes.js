"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
router.get('/', notification_controller_1.NotificationController.getNotifications);
router.get('/unread-count', notification_controller_1.NotificationController.getUnreadCount);
router.post('/read', (0, validate_1.validate)([
    (0, express_validator_1.body)('notificationIds')
        .isArray({ min: 1 })
        .withMessage('Notification IDs must be an array'),
]), notification_controller_1.NotificationController.markAsRead);
router.post('/read-all', notification_controller_1.NotificationController.markAllAsRead);
router.delete('/:notificationId', (0, validate_1.validate)([(0, express_validator_1.param)('notificationId').isMongoId().withMessage('Invalid notification ID')]), notification_controller_1.NotificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map