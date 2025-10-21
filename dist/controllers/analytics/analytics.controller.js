"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const analytics_service_1 = require("../../services/analytics.service");
const models_1 = require("../../models");
class AnalyticsController {
}
exports.AnalyticsController = AnalyticsController;
_a = AnalyticsController;
// Get dashboard overview
AnalyticsController.getDashboardOverview = (0, catchAsync_1.default)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const [totalEvents, uniqueUsers, dau, topEvents, deviceStats, geoDistribution, sessionStats,] = await Promise.all([
        models_1.AnalyticsEvent.countDocuments({
            timestamp: { $gte: start, $lte: end },
        }),
        models_1.AnalyticsEvent.distinct('userId', {
            timestamp: { $gte: start, $lte: end },
            userId: { $exists: true },
        }).then((users) => users.length),
        analytics_service_1.AnalyticsService.getDailyActiveUsers(start, end),
        analytics_service_1.AnalyticsService.getTopEvents(start, end, undefined, 10),
        analytics_service_1.AnalyticsService.getDeviceStats(start, end),
        analytics_service_1.AnalyticsService.getGeographicDistribution(start, end),
        analytics_service_1.AnalyticsService.getSessionStats(start, end),
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
    apiResponse_1.ApiResponse.success(res, { overview }, 'Analytics overview retrieved successfully');
});
// Get user journey
AnalyticsController.getUserJourney = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const journey = await analytics_service_1.AnalyticsService.getUserJourney(userId, Number(limit));
    apiResponse_1.ApiResponse.success(res, { journey }, 'User journey retrieved successfully');
});
// Get conversion funnel
AnalyticsController.getConversionFunnel = (0, catchAsync_1.default)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const funnel = await analytics_service_1.AnalyticsService.getConversionFunnel(start, end);
    apiResponse_1.ApiResponse.success(res, { funnel }, 'Conversion funnel retrieved successfully');
});
// Get retention analysis
AnalyticsController.getRetentionAnalysis = (0, catchAsync_1.default)(async (req, res) => {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cohorts = await analytics_service_1.AnalyticsService.getRetentionCohorts(start);
    apiResponse_1.ApiResponse.success(res, { cohorts }, 'Retention analysis retrieved successfully');
});
// Get real-time analytics
AnalyticsController.getRealTimeAnalytics = (0, catchAsync_1.default)(async (req, res) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [activeUsers, recentEvents, topPages,] = await Promise.all([
        models_1.AnalyticsEvent.distinct('userId', {
            timestamp: { $gte: fiveMinutesAgo },
            userId: { $exists: true },
        }).then((users) => users.length),
        models_1.AnalyticsEvent.find({
            timestamp: { $gte: fiveMinutesAgo },
        })
            .sort({ timestamp: -1 })
            .limit(20)
            .select('eventCategory eventName userId timestamp'),
        models_1.AnalyticsEvent.aggregate([
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
    apiResponse_1.ApiResponse.success(res, { realTime }, 'Real-time analytics retrieved successfully');
});
// Track custom event (for client-side tracking)
AnalyticsController.trackCustomEvent = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { sessionId, eventCategory, eventName, properties } = req.body;
    await analytics_service_1.AnalyticsService.trackEvent({
        userId,
        sessionId,
        eventCategory,
        eventName,
        properties,
        req,
    });
    apiResponse_1.ApiResponse.success(res, null, 'Event tracked successfully');
});
// Get business metrics
AnalyticsController.getBusinessMetrics = (0, catchAsync_1.default)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const [newUsers, newProfiles, newMatches, revenue, activeSubscriptions,] = await Promise.all([
        models_1.User.countDocuments({
            createdAt: { $gte: start, $lte: end },
        }),
        models_1.RoommateProfile.countDocuments({
            createdAt: { $gte: start, $lte: end },
        }),
        models_1.Match.countDocuments({
            createdAt: { $gte: start, $lte: end },
            status: 'accepted',
        }),
        models_1.Payment.aggregate([
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
        models_1.Payment.countDocuments({
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
    apiResponse_1.ApiResponse.success(res, { metrics }, 'Business metrics retrieved successfully');
});
//# sourceMappingURL=analytics.controller.js.map