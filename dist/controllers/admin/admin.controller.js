"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
class AdminController {
}
exports.AdminController = AdminController;
_a = AdminController;
// Get dashboard statistics
AdminController.getDashboardStats = (0, catchAsync_1.default)(async (req, res) => {
    const [totalUsers, activeUsers, totalProfiles, totalMatches, activeSubscriptions, totalRevenue, pendingReports, todayRegistrations,] = await Promise.all([
        models_1.User.countDocuments(),
        models_1.User.countDocuments({ isActive: true }),
        models_1.RoommateProfile.countDocuments(),
        models_1.Match.countDocuments(),
        models_1.Subscription.countDocuments({ status: 'active' }),
        models_1.Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        models_1.Report.countDocuments({ status: 'pending' }),
        models_1.User.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
        }),
    ]);
    const stats = {
        users: {
            total: totalUsers,
            active: activeUsers,
            todayRegistrations,
        },
        profiles: {
            total: totalProfiles,
            completionRate: totalProfiles > 0 ? (totalProfiles / totalUsers) * 100 : 0,
        },
        matches: {
            total: totalMatches,
        },
        subscriptions: {
            active: activeSubscriptions,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
        },
        reports: {
            pending: pendingReports,
        },
    };
    apiResponse_1.ApiResponse.success(res, { stats }, 'Dashboard statistics retrieved successfully');
});
// Get all users with filters
AdminController.getUsers = (0, catchAsync_1.default)(async (req, res) => {
    const { page = 1, limit = 20, search, status, verified, role, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
    const query = {};
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
        ];
    }
    if (status) {
        query.isActive = status === 'active';
    }
    if (verified) {
        query.isEmailVerified = verified === 'true';
    }
    if (role) {
        query.role = role;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const users = await models_1.User.find(query)
        .select('-password -refreshTokens')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.User.countDocuments(query);
    apiResponse_1.ApiResponse.paginated(res, users, Number(page), Number(limit), total, 'Users retrieved successfully');
});
// Get user by ID
AdminController.getUserById = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const user = await models_1.User.findById(userId).select('-password -refreshTokens');
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    const subscription = await models_1.Subscription.findOne({ user: userId });
    const matchCount = await models_1.Match.countDocuments({
        $or: [{ user1: userId }, { user2: userId }],
    });
    apiResponse_1.ApiResponse.success(res, {
        user,
        profile,
        subscription,
        stats: {
            totalMatches: matchCount,
        },
    }, 'User details retrieved successfully');
});
// Block/Unblock user
AdminController.toggleUserBlock = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    // Send notification
    const { Notification } = await Promise.resolve().then(() => __importStar(require('../../models')));
    await Notification.create({
        recipient: userId,
        type: 'system',
        title: user.isBlocked ? 'Account Blocked' : 'Account Unblocked',
        message: user.isBlocked
            ? `Your account has been blocked. Reason: ${reason || 'Violation of terms'}`
            : 'Your account has been unblocked',
        priority: 'urgent',
    });
    apiResponse_1.ApiResponse.success(res, { user }, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`);
});
// Delete user
AdminController.deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Soft delete
    user.isActive = false;
    await user.save();
    // TODO: Clean up related data in background job
    apiResponse_1.ApiResponse.success(res, null, 'User deleted successfully');
});
// Get all reports
AdminController.getReports = (0, catchAsync_1.default)(async (req, res) => {
    const { page = 1, limit = 20, status, type, priority } = req.query;
    const query = {};
    if (status) {
        query.status = status;
    }
    if (type) {
        query.type = type;
    }
    if (priority) {
        query.priority = priority;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const reports = await models_1.Report.find(query)
        .populate('reporter', 'firstName lastName email')
        .populate('reported', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.Report.countDocuments(query);
    apiResponse_1.ApiResponse.paginated(res, reports, Number(page), Number(limit), total, 'Reports retrieved successfully');
});
// Update report status
AdminController.updateReport = (0, catchAsync_1.default)(async (req, res) => {
    const { reportId } = req.params;
    const { status, resolution, actionTaken } = req.body;
    const adminId = req.user?.id;
    const report = await models_1.Report.findById(reportId);
    if (!report) {
        throw new ApiError_1.default(404, 'Report not found');
    }
    if (status)
        report.status = status;
    if (resolution)
        report.resolution = resolution;
    if (actionTaken)
        report.actionTaken = actionTaken;
    if (status === 'resolved')
        report.resolvedAt = new Date();
    report.assignedTo = adminId;
    await report.save();
    apiResponse_1.ApiResponse.success(res, { report }, 'Report updated successfully');
});
// Get payment statistics
AdminController.getPaymentStats = (0, catchAsync_1.default)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const matchQuery = { status: 'completed' };
    if (startDate || endDate) {
        matchQuery.paidAt = {};
        if (startDate)
            matchQuery.paidAt.$gte = new Date(startDate);
        if (endDate)
            matchQuery.paidAt.$lte = new Date(endDate);
    }
    const [revenueByType, revenueOverTime, topPayingUsers] = await Promise.all([
        models_1.Payment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]),
        models_1.Payment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$paidAt' },
                        month: { $month: '$paidAt' },
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        models_1.Payment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$user',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
        ]),
    ]);
    apiResponse_1.ApiResponse.success(res, {
        revenueByType,
        revenueOverTime,
        topPayingUsers,
    }, 'Payment statistics retrieved successfully');
});
// Get system health
AdminController.getSystemHealth = (0, catchAsync_1.default)(async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
            status: 'connected',
            collections: models_1.User.db?.db ? (await models_1.User.db.db.listCollections().toArray()).length : 0,
        },
    };
    apiResponse_1.ApiResponse.success(res, { health }, 'System health retrieved successfully');
});
//# sourceMappingURL=admin.controller.js.map