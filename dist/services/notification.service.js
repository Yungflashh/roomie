"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
class NotificationService {
    // Create notification
    static async create(data) {
        try {
            const notification = await models_1.Notification.create(data);
            return notification;
        }
        catch (error) {
            logger_1.logger.error(`Error creating notification: ${error}`);
            throw error;
        }
    }
    // Send push notification (implement with FCM or similar)
    static async sendPushNotification(userId, title, body, data) {
        try {
            // TODO: Implement with Firebase Cloud Messaging or similar
            logger_1.logger.info(`Push notification sent to user ${userId}: ${title}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending push notification: ${error}`);
        }
    }
    // Batch create notifications
    static async createBatch(notifications) {
        try {
            await models_1.Notification.insertMany(notifications);
        }
        catch (error) {
            logger_1.logger.error(`Error creating batch notifications: ${error}`);
            throw error;
        }
    }
    // Mark notifications as read
    static async markAsRead(userId, notificationIds) {
        try {
            await models_1.Notification.updateMany({
                _id: { $in: notificationIds },
                recipient: userId,
            }, {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error marking notifications as read: ${error}`);
            throw error;
        }
    }
    // Delete old notifications
    static async cleanupOldNotifications(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const result = await models_1.Notification.deleteMany({
                createdAt: { $lt: cutoffDate },
                isRead: true,
            });
            logger_1.logger.info(`Deleted ${result.deletedCount} old notifications`);
        }
        catch (error) {
            logger_1.logger.error(`Error cleaning up notifications: ${error}`);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map