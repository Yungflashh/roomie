import { Router } from 'express';
import { AdminController } from '../controllers/admin/admin.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/system/health', AdminController.getSystemHealth);

// User management
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserById);
router.patch(
  '/users/:userId/block',
  validate([
    param('userId').isMongoId(),
    body('reason').optional().isString(),
  ]),
  AdminController.toggleUserBlock
);
router.delete('/users/:userId', AdminController.deleteUser);

// Reports
router.get('/reports', AdminController.getReports);
router.patch(
  '/reports/:reportId',
  validate([
    param('reportId').isMongoId(),
    body('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']),
    body('actionTaken').optional().isIn(['warning', 'suspension', 'ban', 'none']),
  ]),
  AdminController.updateReport
);

// Analytics
router.get('/analytics/payments', AdminController.getPaymentStats);

export default router;