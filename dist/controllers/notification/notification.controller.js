"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const notification_service_1 = require("../../services/notification.service");
class NotificationController {
}
exports.NotificationController = NotificationController;
_a = NotificationController;
// Get all notifications
NotificationController.getNotifications = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
        query.isRead = false;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await models_1.Notification.find(query)
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.Notification.countDocuments(query);
    const unreadCount = await models_1.Notification.countDocuments({
        recipient: userId,
        isRead: false,
    });
    apiResponse_1.ApiResponse.paginated(res, notifications, Number(page), Number(limit), total, 'Notifications retrieved successfully');
    // Add unread count to response
    res.json({
        ...res.locals,
        unreadCount,
    });
});
// Mark notifications as read
NotificationController.markAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { notificationIds } = req.body;
    await notification_service_1.NotificationService.markAsRead(userId, notificationIds);
    apiResponse_1.ApiResponse.success(res, null, 'Notifications marked as read');
});
// Mark all as read
NotificationController.markAllAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    await models_1.Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    apiResponse_1.ApiResponse.success(res, null, 'All notifications marked as read');
});
// Delete notification
NotificationController.deleteNotification = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { notificationId } = req.params;
    const notification = await models_1.Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
    });
    if (!notification) {
        throw new ApiError_1.default(404, 'Notification not found');
    }
    apiResponse_1.ApiResponse.success(res, null, 'Notification deleted successfully');
});
// Get unread count
NotificationController.getUnreadCount = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const count = await models_1.Notification.countDocuments({
        recipient: userId,
        isRead: false,
    });
    apiResponse_1.ApiResponse.success(res, { count }, 'Unread count retrieved successfully');
});
//# sourceMappingURL=notification.controller.js.map