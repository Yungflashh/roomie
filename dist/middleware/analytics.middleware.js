"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = exports.trackPageView = void 0;
const analytics_service_1 = require("../services/analytics.service");
const uuid_1 = require("uuid");
// Track page views
const trackPageView = (req, res, next) => {
    const authReq = req;
    const sessionId = req.cookies?.sessionId || (0, uuid_1.v4)();
    // Set session cookie if not exists
    if (!req.cookies?.sessionId) {
        res.cookie('sessionId', sessionId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
    }
    // Track page view asynchronously (don't wait)
    analytics_service_1.AnalyticsService.trackEvent({
        userId: authReq.user?.id,
        sessionId,
        eventCategory: 'page_view',
        eventName: req.path,
        properties: {
            method: req.method,
            query: req.query,
        },
        req,
    }).catch((error) => {
        // Silent fail - analytics should never break the app
    });
    next();
};
exports.trackPageView = trackPageView;
// Track specific events
const trackEvent = (eventCategory, eventName) => {
    return (req, res, next) => {
        const authReq = req;
        const sessionId = req.cookies?.sessionId || (0, uuid_1.v4)();
        analytics_service_1.AnalyticsService.trackEvent({
            userId: authReq.user?.id,
            sessionId,
            eventCategory: eventCategory,
            eventName,
            properties: {
                ...req.body,
                ...req.params,
            },
            req,
        }).catch(() => { });
        next();
    };
};
exports.trackEvent = trackEvent;
//# sourceMappingURL=analytics.middleware.js.map