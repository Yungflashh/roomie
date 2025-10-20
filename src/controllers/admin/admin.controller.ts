import { Response } from 'express';
import { AuthRequest } from '../../types';
import {
  User,
  RoommateProfile,
  Match,
  GameSession,
  Payment,
  Subscription,
  Report,
} from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';

export class AdminController {
  // Get dashboard statistics
  static getDashboardStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const [
      totalUsers,
      activeUsers,
      totalProfiles,
      totalMatches,
      activeSubscriptions,
      totalRevenue,
      pendingReports,
      todayRegistrations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      RoommateProfile.countDocuments(),
      Match.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({
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

    ApiResponse.success(res, { stats }, 'Dashboard statistics retrieved successfully');
  });

  // Get all users with filters
  static getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      verified,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

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
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    ApiResponse.paginated(
      res,
      users,
      Number(page),
      Number(limit),
      total,
      'Users retrieved successfully'
    );
  });

  // Get user by ID
  static getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -refreshTokens');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const profile = await RoommateProfile.findOne({ user: userId });
    const subscription = await Subscription.findOne({ user: userId });
    const matchCount = await Match.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
    });

    ApiResponse.success(
      res,
      {
        user,
        profile,
        subscription,
        stats: {
          totalMatches: matchCount,
        },
      },
      'User details retrieved successfully'
    );
  });

  // Block/Unblock user
  static toggleUserBlock = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Send notification
    const { Notification } = await import('../../models');
    await Notification.create({
      recipient: userId,
      type: 'system',
      title: user.isBlocked ? 'Account Blocked' : 'Account Unblocked',
      message: user.isBlocked
        ? `Your account has been blocked. Reason: ${reason || 'Violation of terms'}`
        : 'Your account has been unblocked',
      priority: 'urgent',
    });

    ApiResponse.success(
      res,
      { user },
      `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
    );
  });

  // Delete user
  static deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    // TODO: Clean up related data in background job

    ApiResponse.success(res, null, 'User deleted successfully');
  });

  // Get all reports
  static getReports = catchAsync(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status, type, priority } = req.query;

    const query: any = {};

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

    const reports = await Report.find(query)
      .populate('reporter', 'firstName lastName email')
      .populate('reported', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Report.countDocuments(query);

    ApiResponse.paginated(
      res,
      reports,
      Number(page),
      Number(limit),
      total,
      'Reports retrieved successfully'
    );
  });

  // Update report status
  static updateReport = catchAsync(async (req: AuthRequest, res: Response) => {
    const { reportId } = req.params;
    const { status, resolution, actionTaken } = req.body;
    const adminId = req.user?.id;

    const report = await Report.findById(reportId);

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    if (status) report.status = status;
    if (resolution) report.resolution = resolution;
    if (actionTaken) report.actionTaken = actionTaken;
    if (status === 'resolved') report.resolvedAt = new Date();
    report.assignedTo = adminId as any;

    await report.save();

    ApiResponse.success(res, { report }, 'Report updated successfully');
  });

  // Get payment statistics
  static getPaymentStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const matchQuery: any = { status: 'completed' };

    if (startDate || endDate) {
      matchQuery.paidAt = {};
      if (startDate) matchQuery.paidAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.paidAt.$lte = new Date(endDate as string);
    }

    const [revenueByType, revenueOverTime, topPayingUsers] = await Promise.all([
      Payment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
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
      Payment.aggregate([
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

    ApiResponse.success(
      res,
      {
        revenueByType,
        revenueOverTime,
        topPayingUsers,
      },
      'Payment statistics retrieved successfully'
    );
  });

  // Get system health
  static getSystemHealth = catchAsync(async (req: AuthRequest, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
     database: {
  status: 'connected',
  collections: User.db?.db ? (await User.db.db.listCollections().toArray()).length : 0,
},
    };

    ApiResponse.success(res, { health }, 'System health retrieved successfully');
  });
}