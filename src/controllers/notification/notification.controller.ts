import { Response } from 'express';
import { AuthRequest } from '../../types';
import { Notification } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { NotificationService } from '../../services/notification.service';

export class NotificationController {
  // Get all notifications
  static getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query: any = { recipient: userId };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    ApiResponse.paginated(
      res,
      notifications,
      Number(page),
      Number(limit),
      total,
      'Notifications retrieved successfully'
    );

    // Add unread count to response
    res.json({
      ...res.locals,
      unreadCount,
    });
  });

  // Mark notifications as read
  static markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { notificationIds } = req.body;

    await NotificationService.markAsRead(userId!, notificationIds);

    ApiResponse.success(res, null, 'Notifications marked as read');
  });

  // Mark all as read
  static markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    ApiResponse.success(res, null, 'All notifications marked as read');
  });

  // Delete notification
  static deleteNotification = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    ApiResponse.success(res, null, 'Notification deleted successfully');
  });

  // Get unread count
  static getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    ApiResponse.success(res, { count }, 'Unread count retrieved successfully');
  });
}