"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.restrictTo)('admin'));
// Dashboard
router.get('/dashboard/stats', admin_controller_1.AdminController.getDashboardStats);
router.get('/system/health', admin_controller_1.AdminController.getSystemHealth);
// User management
router.get('/users', admin_controller_1.AdminController.getUsers);
router.get('/users/:userId', admin_controller_1.AdminController.getUserById);
router.patch('/users/:userId/block', (0, validate_1.validate)([
    (0, express_validator_1.param)('userId').isMongoId(),
    (0, express_validator_1.body)('reason').optional().isString(),
]), admin_controller_1.AdminController.toggleUserBlock);
router.delete('/users/:userId', admin_controller_1.AdminController.deleteUser);
// Reports
router.get('/reports', admin_controller_1.AdminController.getReports);
router.patch('/reports/:reportId', (0, validate_1.validate)([
    (0, express_validator_1.param)('reportId').isMongoId(),
    (0, express_validator_1.body)('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']),
    (0, express_validator_1.body)('actionTaken').optional().isIn(['warning', 'suspension', 'ban', 'none']),
]), admin_controller_1.AdminController.updateReport);
// Analytics
router.get('/analytics/payments', admin_controller_1.AdminController.getPaymentStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map