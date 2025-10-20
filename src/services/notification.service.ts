import { Notification } from '../models';
import { NotificationType } from '../types';
import { logger } from '../utils/logger';

export class NotificationService {
  // Create notification
  static async create(data: {
    recipient: string;
    sender?: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    imageUrl?: string;
  }): Promise<any> {
    try {
      const notification = await Notification.create(data);
      return notification;
    } catch (error) {
      logger.error(`Error creating notification: ${error}`);
      throw error;
    }
  }

  // Send push notification (implement with FCM or similar)
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // TODO: Implement with Firebase Cloud Messaging or similar
      logger.info(`Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      logger.error(`Error sending push notification: ${error}`);
    }
  }

  // Batch create notifications
  static async createBatch(notifications: any[]): Promise<void> {
    try {
      await Notification.insertMany(notifications);
    } catch (error) {
      logger.error(`Error creating batch notifications: ${error}`);
      throw error;
    }
  }

  // Mark notifications as read
  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipient: userId,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );
    } catch (error) {
      logger.error(`Error marking notifications as read: ${error}`);
      throw error;
    }
  }

  // Delete old notifications
  static async cleanupOldNotifications(days: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true,
      });

      logger.info(`Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error(`Error cleaning up notifications: ${error}`);
      throw error;
    }
  }
}