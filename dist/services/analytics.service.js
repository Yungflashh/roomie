"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    // Track an event
    static async trackEvent(options) {
        try {
            const { userId, sessionId, eventCategory, eventName, properties, req, } = options;
            const event = {
                userId,
                sessionId,
                eventType: `${eventCategory}:${eventName}`,
                eventCategory,
                eventName,
                properties,
                timestamp: new Date(),
            };
            // Parse device info
            if (req) {
                const ua = new ua_parser_js_1.default(req.headers['user-agent']);
                event.device = {
                    type: ua.getDevice().type || 'desktop',
                    browser: `${ua.getBrowser().name} ${ua.getBrowser().version}`,
                    os: `${ua.getOS().name} ${ua.getOS().version}`,
                    userAgent: req.headers['user-agent'],
                };
                // Parse location from IP
                const ip = this.getClientIP(req);
                if (ip) {
                    const geo = geoip_lite_1.default.lookup(ip);
                    if (geo) {
                        event.location = {
                            country: geo.country,
                            region: geo.region,
                            city: geo.city,
                            timezone: geo.timezone,
                        };
                    }
                }
                // Page info
                if (req.headers.referer) {
                    event.page = {
                        url: req.originalUrl,
                        referrer: req.headers.referer,
                    };
                }
            }
            await models_1.AnalyticsEvent.create(event);
        }
        catch (error) {
            logger_1.logger.error('Error tracking event:', error);
            // Don't throw - analytics should never break the app
        }
    }
    // Get client IP
    static getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0];
        }
        return req.connection.remoteAddress;
    }
    // Get user journey
    static async getUserJourney(userId, limit = 50) {
        try {
            const events = await models_1.AnalyticsEvent.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .select('eventCategory eventName timestamp properties');
            return events;
        }
        catch (error) {
            logger_1.logger.error('Error getting user journey:', error);
            return [];
        }
    }
    // Get conversion funnel
    static async getConversionFunnel(startDate, endDate) {
        try {
            const funnel = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        eventCategory: 'user',
                    },
                },
                {
                    $group: {
                        _id: '$eventName',
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' },
                    },
                },
                {
                    $project: {
                        eventName: '$_id',
                        count: 1,
                        uniqueUsers: { $size: '$uniqueUsers' },
                    },
                },
            ]);
            return funnel;
        }
        catch (error) {
            logger_1.logger.error('Error getting conversion funnel:', error);
            return [];
        }
    }
    // Get daily active users
    static async getDailyActiveUsers(startDate, endDate) {
        try {
            const dau = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        userId: { $exists: true },
                    },
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        },
                        users: { $addToSet: '$userId' },
                    },
                },
                {
                    $project: {
                        date: '$_id.date',
                        count: { $size: '$users' },
                    },
                },
                { $sort: { date: 1 } },
            ]);
            return dau;
        }
        catch (error) {
            logger_1.logger.error('Error getting DAU:', error);
            return [];
        }
    }
    // Get retention cohorts
    static async getRetentionCohorts(startDate) {
        try {
            // This is a simplified version - in production, use more sophisticated cohort analysis
            const cohorts = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        eventCategory: 'user',
                        eventName: 'login',
                        timestamp: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: {
                            userId: '$userId',
                            week: { $isoWeek: '$timestamp' },
                        },
                    },
                },
                {
                    $group: {
                        _id: '$_id.week',
                        users: { $addToSet: '$_id.userId' },
                    },
                },
                {
                    $project: {
                        week: '$_id',
                        userCount: { $size: '$users' },
                    },
                },
                { $sort: { week: 1 } },
            ]);
            return cohorts;
        }
        catch (error) {
            logger_1.logger.error('Error getting retention cohorts:', error);
            return [];
        }
    }
    // Get top events
    static async getTopEvents(startDate, endDate, category, limit = 10) {
        try {
            const match = {
                timestamp: { $gte: startDate, $lte: endDate },
            };
            if (category) {
                match.eventCategory = category;
            }
            const topEvents = await models_1.AnalyticsEvent.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { category: '$eventCategory', name: '$eventName' },
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' },
                    },
                },
                {
                    $project: {
                        eventCategory: '$_id.category',
                        eventName: '$_id.name',
                        count: 1,
                        uniqueUsers: { $size: '$uniqueUsers' },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: limit },
            ]);
            return topEvents;
        }
        catch (error) {
            logger_1.logger.error('Error getting top events:', error);
            return [];
        }
    }
    // Get device statistics
    static async getDeviceStats(startDate, endDate) {
        try {
            const stats = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        'device.type': { $exists: true },
                    },
                },
                {
                    $group: {
                        _id: '$device.type',
                        count: { $sum: 1 },
                        browsers: { $addToSet: '$device.browser' },
                        os: { $addToSet: '$device.os' },
                    },
                },
            ]);
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting device stats:', error);
            return [];
        }
    }
    // Get geographic distribution
    static async getGeographicDistribution(startDate, endDate) {
        try {
            const distribution = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        'location.country': { $exists: true },
                    },
                },
                {
                    $group: {
                        _id: {
                            country: '$location.country',
                            region: '$location.region',
                        },
                        count: { $sum: 1 },
                        users: { $addToSet: '$userId' },
                    },
                },
                {
                    $project: {
                        country: '$_id.country',
                        region: '$_id.region',
                        eventCount: '$count',
                        uniqueUsers: { $size: '$users' },
                    },
                },
                { $sort: { eventCount: -1 } },
            ]);
            return distribution;
        }
        catch (error) {
            logger_1.logger.error('Error getting geographic distribution:', error);
            return [];
        }
    }
    // Get session statistics
    static async getSessionStats(startDate, endDate) {
        try {
            const sessions = await models_1.AnalyticsEvent.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$sessionId',
                        eventCount: { $sum: 1 },
                        duration: {
                            $max: '$timestamp',
                        },
                        firstEvent: {
                            $min: '$timestamp',
                        },
                    },
                },
                {
                    $project: {
                        eventCount: 1,
                        duration: {
                            $divide: [
                                { $subtract: ['$duration', '$firstEvent'] },
                                1000 * 60, // Convert to minutes
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSessions: { $sum: 1 },
                        avgEventsPerSession: { $avg: '$eventCount' },
                        avgSessionDuration: { $avg: '$duration' },
                    },
                },
            ]);
            return sessions[0] || {};
        }
        catch (error) {
            logger_1.logger.error('Error getting session stats:', error);
            return {};
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map