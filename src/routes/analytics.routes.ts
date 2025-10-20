import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics/analytics.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Public route for client-side tracking
router.post(
  '/track',
  validate([
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('eventCategory').notEmpty().withMessage('Event category is required'),
    body('eventName').notEmpty().withMessage('Event name is required'),
  ]),
  AnalyticsController.trackCustomEvent
);

// Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard', AnalyticsController.getDashboardOverview);
router.get('/realtime', AnalyticsController.getRealTimeAnalytics);
router.get('/funnel', AnalyticsController.getConversionFunnel);
router.get('/retention', AnalyticsController.getRetentionAnalysis);
router.get('/journey/:userId', AnalyticsController.getUserJourney);
router.get('/metrics', AnalyticsController.getBusinessMetrics);

export default router;