import { Router } from 'express';
import { PaymentController } from '../controllers/payment/payment.controller';
import { SubscriptionController } from '../controllers/payment/subscription.controller';
import { WebhookController } from '../controllers/payment/webhook.controller';
import { PaymentValidator, SubscriptionValidator } from '../validators/payment.validator';
import { validate } from '../middleware/validate';
import { protect, requireEmailVerification } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Webhook route (MUST be before express.json() middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  WebhookController.handleStripeWebhook
);

// All other routes require authentication
router.use(protect);
router.use(requireEmailVerification);

// ========== PAYMENT MANAGEMENT ==========
router.post(
  '/intent',
  validate(PaymentValidator.createPaymentIntent()),
  PaymentController.createPaymentIntent
);

router.get('/history', PaymentController.getPaymentHistory);

router.get(
  '/:paymentId',
  validate(PaymentValidator.getPaymentById()),
  PaymentController.getPaymentById
);

router.post(
  '/:paymentId/refund',
  validate(PaymentValidator.requestRefund()),
  PaymentController.requestRefund
);

router.get('/methods/list', PaymentController.getPaymentMethods);

router.delete(
  '/methods/:paymentMethodId',
  validate(PaymentValidator.removePaymentMethod()),
  PaymentController.removePaymentMethod
);

router.get('/invoices/list', PaymentController.getInvoices);

// ========== SUBSCRIPTION MANAGEMENT ==========
router.get('/subscription/plans', SubscriptionController.getPlans);

router.get('/subscription/current', SubscriptionController.getCurrentSubscription);

router.post(
  '/subscription/checkout',
  validate(SubscriptionValidator.createCheckoutSession()),
  SubscriptionController.createCheckoutSession
);

router.post(
  '/subscription/cancel',
  validate(SubscriptionValidator.cancelSubscription()),
  SubscriptionController.cancelSubscription
);

router.post('/subscription/reactivate', SubscriptionController.reactivateSubscription);

router.patch(
  '/subscription/update',
  validate(SubscriptionValidator.updateSubscription()),
  SubscriptionController.updateSubscription
);

router.get('/subscription/portal', SubscriptionController.getCustomerPortal);

router.get(
  '/subscription/feature/:feature',
  validate(SubscriptionValidator.checkFeatureAccess()),
  SubscriptionController.checkFeatureAccess
);

export default router;