import { Router } from 'express';
import { NotificationController } from '../controllers/notification/notification.controller';
import { protect, requireEmailVerification } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(protect);
router.use(requireEmailVerification);

router.get('/', NotificationController.getNotifications);

router.get('/unread-count', NotificationController.getUnreadCount);

router.post(
  '/read',
  validate([
    body('notificationIds')
      .isArray({ min: 1 })
      .withMessage('Notification IDs must be an array'),
  ]),
  NotificationController.markAsRead
);

router.post('/read-all', NotificationController.markAllAsRead);

router.delete(
  '/:notificationId',
  validate([param('notificationId').isMongoId().withMessage('Invalid notification ID')]),
  NotificationController.deleteNotification
);

export default router;