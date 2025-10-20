import { Response } from 'express';
import { AuthRequest } from '../../types';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsEvent, User, RoommateProfile, Match, Payment } from '../../models';

export class AnalyticsController {
  // Get dashboard overview
  static getDashboardOverview = catchAsync(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [
      totalEvents,
      uniqueUsers,
      dau,
      topEvents,
      deviceStats,
      geoDistribution,
      sessionStats,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({
        timestamp: { $gte: start, $lte: end },
      }),
      AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: start, $lte: end },
        userId: { $exists: true },
      }).then((users) => users.length),
      AnalyticsService.getDailyActiveUsers(start, end),
      AnalyticsService.getTopEvents(start, end, undefined, 10),
      AnalyticsService.getDeviceStats(start, end),
      AnalyticsService.getGeographicDistribution(start, end),
      AnalyticsService.getSessionStats(start, end),
    ]);

    const overview = {
      period: { start, end },
      totalEvents,
      uniqueUsers,
      dailyActiveUsers: dau,
      topEvents,
      deviceStats,
      geoDistribution,
      sessionStats,
    };

    ApiResponse.success(res, { overview }, 'Analytics overview retrieved successfully');
  });

  // Get user journey
  static getUserJourney = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const journey = await AnalyticsService.getUserJourney(userId, Number(limit));

    ApiResponse.success(res, { journey }, 'User journey retrieved successfully');
  });

  // Get conversion funnel
  static getConversionFunnel = catchAsync(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const funnel = await AnalyticsService.getConversionFunnel(start, end);

    ApiResponse.success(res, { funnel }, 'Conversion funnel retrieved successfully');
  });

  // Get retention analysis
  static getRetentionAnalysis = catchAsync(async (req: AuthRequest, res: Response) => {
    const { startDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const cohorts = await AnalyticsService.getRetentionCohorts(start);

    ApiResponse.success(res, { cohorts }, 'Retention analysis retrieved successfully');
  });

  // Get real-time analytics
  static getRealTimeAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      activeUsers,
      recentEvents,
      topPages,
    ] = await Promise.all([
      AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: fiveMinutesAgo },
        userId: { $exists: true },
      }).then((users) => users.length),
      AnalyticsEvent.find({
        timestamp: { $gte: fiveMinutesAgo },
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('eventCategory eventName userId timestamp'),
      AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: fiveMinutesAgo },
            eventCategory: 'page_view',
          },
        },
        {
          $group: {
            _id: '$eventName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const realTime = {
      activeUsers,
      recentEvents,
      topPages,
      timestamp: new Date(),
    };

    ApiResponse.success(res, { realTime }, 'Real-time analytics retrieved successfully');
  });

  // Track custom event (for client-side tracking)
  static trackCustomEvent = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId, eventCategory, eventName, properties } = req.body;

    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventCategory,
      eventName,
      properties,
      req,
    });

    ApiResponse.success(res, null, 'Event tracked successfully');
  });

  // Get business metrics
  static getBusinessMetrics = catchAsync(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [
      newUsers,
      newProfiles,
      newMatches,
      revenue,
      activeSubscriptions,
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: start, $lte: end },
      }),
      RoommateProfile.countDocuments({
        createdAt: { $gte: start, $lte: end },
      }),
      Match.countDocuments({
        createdAt: { $gte: start, $lte: end },
        status: 'accepted',
      }),
      Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Payment.countDocuments({
        type: 'subscription',
        status: 'completed',
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    const metrics = {
      period: { start, end },
      newUsers,
      newProfiles,
      newMatches,
      revenue: revenue[0]?.total || 0,
      activeSubscriptions,
    };

    ApiResponse.success(res, { metrics }, 'Business metrics retrieved successfully');
  });
}