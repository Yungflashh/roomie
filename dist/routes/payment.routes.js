"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment/payment.controller");
const subscription_controller_1 = require("../controllers/payment/subscription.controller");
const webhook_controller_1 = require("../controllers/payment/webhook.controller");
const payment_validator_1 = require("../validators/payment.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
// Webhook route (MUST be before express.json() middleware)
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), webhook_controller_1.WebhookController.handleStripeWebhook);
// All other routes require authentication
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
// ========== PAYMENT MANAGEMENT ==========
router.post('/intent', (0, validate_1.validate)(payment_validator_1.PaymentValidator.createPaymentIntent()), payment_controller_1.PaymentController.createPaymentIntent);
router.get('/history', payment_controller_1.PaymentController.getPaymentHistory);
router.get('/:paymentId', (0, validate_1.validate)(payment_validator_1.PaymentValidator.getPaymentById()), payment_controller_1.PaymentController.getPaymentById);
router.post('/:paymentId/refund', (0, validate_1.validate)(payment_validator_1.PaymentValidator.requestRefund()), payment_controller_1.PaymentController.requestRefund);
router.get('/methods/list', payment_controller_1.PaymentController.getPaymentMethods);
router.delete('/methods/:paymentMethodId', (0, validate_1.validate)(payment_validator_1.PaymentValidator.removePaymentMethod()), payment_controller_1.PaymentController.removePaymentMethod);
router.get('/invoices/list', payment_controller_1.PaymentController.getInvoices);
// ========== SUBSCRIPTION MANAGEMENT ==========
router.get('/subscription/plans', subscription_controller_1.SubscriptionController.getPlans);
router.get('/subscription/current', subscription_controller_1.SubscriptionController.getCurrentSubscription);
router.post('/subscription/checkout', (0, validate_1.validate)(payment_validator_1.SubscriptionValidator.createCheckoutSession()), subscription_controller_1.SubscriptionController.createCheckoutSession);
router.post('/subscription/cancel', (0, validate_1.validate)(payment_validator_1.SubscriptionValidator.cancelSubscription()), subscription_controller_1.SubscriptionController.cancelSubscription);
router.post('/subscription/reactivate', subscription_controller_1.SubscriptionController.reactivateSubscription);
router.patch('/subscription/update', (0, validate_1.validate)(payment_validator_1.SubscriptionValidator.updateSubscription()), subscription_controller_1.SubscriptionController.updateSubscription);
router.get('/subscription/portal', subscription_controller_1.SubscriptionController.getCustomerPortal);
router.get('/subscription/feature/:feature', (0, validate_1.validate)(payment_validator_1.SubscriptionValidator.checkFeatureAccess()), subscription_controller_1.SubscriptionController.checkFeatureAccess);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map