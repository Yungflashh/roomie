"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Public route for client-side tracking
router.post('/track', (0, validate_1.validate)([
    (0, express_validator_1.body)('sessionId').notEmpty().withMessage('Session ID is required'),
    (0, express_validator_1.body)('eventCategory').notEmpty().withMessage('Event category is required'),
    (0, express_validator_1.body)('eventName').notEmpty().withMessage('Event name is required'),
]), analytics_controller_1.AnalyticsController.trackCustomEvent);
// Admin routes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.restrictTo)('admin'));
router.get('/dashboard', analytics_controller_1.AnalyticsController.getDashboardOverview);
router.get('/realtime', analytics_controller_1.AnalyticsController.getRealTimeAnalytics);
router.get('/funnel', analytics_controller_1.AnalyticsController.getConversionFunnel);
router.get('/retention', analytics_controller_1.AnalyticsController.getRetentionAnalysis);
router.get('/journey/:userId', analytics_controller_1.AnalyticsController.getUserJourney);
router.get('/metrics', analytics_controller_1.AnalyticsController.getBusinessMetrics);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map