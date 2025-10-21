"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const stripe_1 = __importDefault(require("../../config/stripe"));
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const stripe_service_1 = require("../../services/stripe.service");
const types_1 = require("../../types");
class WebhookController {
}
exports.WebhookController = WebhookController;
_a = WebhookController;
WebhookController.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger_1.logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    logger_1.logger.info(`Received Stripe webhook: ${event.type}`);
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                logger_1.logger.info(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        logger_1.logger.error(`Error handling webhook: ${error.message}`);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};
// Webhook event handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
    logger_1.logger.info(`Payment succeeded: ${paymentIntent.id}`);
    const payment = await models_1.Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
    });
    if (payment) {
        payment.status = types_1.PaymentStatus.COMPLETED;
        payment.paidAt = new Date();
        payment.stripeChargeId = paymentIntent.charges?.data[0]?.id;
        await payment.save();
        // Handle post-payment actions
        if (payment.type === 'background_check') {
            await models_1.RoommateProfile.findOneAndUpdate({ user: payment.user }, {
                'backgroundCheck.completed': true,
                'backgroundCheck.passedAt': new Date(),
            });
        }
    }
}
async function handlePaymentIntentFailed(paymentIntent) {
    logger_1.logger.info(`Payment failed: ${paymentIntent.id}`);
    const payment = await models_1.Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
    });
    if (payment) {
        payment.status = types_1.PaymentStatus.FAILED;
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await payment.save();
    }
}
async function handleSubscriptionCreated(subscription) {
    logger_1.logger.info(`Subscription created: ${subscription.id}`);
    const userId = subscription.metadata.userId;
    if (!userId) {
        logger_1.logger.error('No userId in subscription metadata');
        return;
    }
    const plan = getPlanFromSubscription(subscription);
    const newSubscription = await models_1.Subscription.create({
        user: userId,
        plan,
        status: 'active',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        features: stripe_service_1.SUBSCRIPTION_PLANS[plan].features,
    });
    // Update profile premium status
    await models_1.RoommateProfile.findOneAndUpdate({ user: userId }, {
        isPremium: true,
        premiumExpiry: new Date(subscription.current_period_end * 1000),
    });
    logger_1.logger.info(`Subscription created in database: ${newSubscription._id}`);
}
async function handleSubscriptionUpdated(subscription) {
    logger_1.logger.info(`Subscription updated: ${subscription.id}`);
    const plan = getPlanFromSubscription(subscription);
    const existingSubscription = await models_1.Subscription.findOne({
        stripeSubscriptionId: subscription.id,
    });
    if (!existingSubscription) {
        logger_1.logger.error(`Subscription not found: ${subscription.id}`);
        return;
    }
    existingSubscription.plan = plan;
    existingSubscription.status = subscription.status;
    existingSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    existingSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    existingSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    existingSubscription.features = stripe_service_1.SUBSCRIPTION_PLANS[plan].features;
    if (subscription.canceled_at) {
        existingSubscription.cancelledAt = new Date(subscription.canceled_at * 1000);
    }
    await existingSubscription.save();
    // Update profile
    await models_1.RoommateProfile.findOneAndUpdate({ user: existingSubscription.user }, {
        isPremium: subscription.status === 'active',
        premiumExpiry: new Date(subscription.current_period_end * 1000),
    });
}
async function handleSubscriptionDeleted(subscription) {
    logger_1.logger.info(`Subscription deleted: ${subscription.id}`);
    const existingSubscription = await models_1.Subscription.findOne({
        stripeSubscriptionId: subscription.id,
    });
    if (!existingSubscription) {
        logger_1.logger.error(`Subscription not found: ${subscription.id}`);
        return;
    }
    existingSubscription.status = 'cancelled';
    existingSubscription.cancelledAt = new Date();
    await existingSubscription.save();
    // Remove premium status
    await models_1.RoommateProfile.findOneAndUpdate({ user: existingSubscription.user }, {
        isPremium: false,
        premiumExpiry: null,
    });
}
async function handleInvoicePaid(invoice) {
    logger_1.logger.info(`Invoice paid: ${invoice.id}`);
    const subscription = await models_1.Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
    });
    if (!subscription) {
        logger_1.logger.error(`Subscription not found for invoice: ${invoice.id}`);
        return;
    }
    // Create payment record
    const payment = await models_1.Payment.create({
        user: subscription.user,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'completed',
        paymentMethod: 'card',
        stripeChargeId: invoice.charge,
        description: `Subscription payment - ${subscription.plan}`,
        type: 'subscription',
        relatedSubscription: subscription._id,
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        receipt: invoice.hosted_invoice_url,
    });
    // Add to billing history
    subscription.billingHistory.push(payment._id);
    await subscription.save();
    // Send notification
    const { Notification } = await Promise.resolve().then(() => __importStar(require('../../models')));
    await Notification.create({
        recipient: subscription.user,
        type: 'payment',
        title: 'Subscription Payment Successful',
        message: `Your ${subscription.plan} subscription payment of $${payment.amount} was successful`,
        priority: 'medium',
    });
}
async function handleInvoicePaymentFailed(invoice) {
    logger_1.logger.info(`Invoice payment failed: ${invoice.id}`);
    const subscription = await models_1.Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
    });
    if (!subscription) {
        logger_1.logger.error(`Subscription not found for invoice: ${invoice.id}`);
        return;
    }
    // Send notification
    const { Notification } = await Promise.resolve().then(() => __importStar(require('../../models')));
    await Notification.create({
        recipient: subscription.user,
        type: 'payment',
        title: 'Subscription Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method.',
        priority: 'urgent',
    });
}
function getPlanFromSubscription(subscription) {
    // Extract plan from subscription price
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
        return 'premium';
    }
    else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        return 'pro';
    }
    return 'basic';
}
//# sourceMappingURL=webhook.controller.js.map