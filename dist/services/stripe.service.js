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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = exports.SUBSCRIPTION_PLANS = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const types_1 = require("../types");
exports.SUBSCRIPTION_PLANS = {
    basic: {
        name: 'Basic',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
            unlimitedMatches: false,
            advancedFilters: false,
            seeWhoLikedYou: false,
            prioritySupport: false,
            backgroundCheck: false,
            videoProfile: false,
            incognitoMode: false,
            readReceipts: false,
            profileBoost: 0,
            rewindSwipes: false,
        },
    },
    premium: {
        name: 'Premium',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: {
            unlimitedMatches: true,
            advancedFilters: true,
            seeWhoLikedYou: true,
            prioritySupport: false,
            backgroundCheck: false,
            videoProfile: true,
            incognitoMode: false,
            readReceipts: true,
            profileBoost: 3,
            rewindSwipes: true,
        },
    },
    pro: {
        name: 'Pro',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: {
            unlimitedMatches: true,
            advancedFilters: true,
            seeWhoLikedYou: true,
            prioritySupport: true,
            backgroundCheck: true,
            videoProfile: true,
            incognitoMode: true,
            readReceipts: true,
            profileBoost: 10,
            rewindSwipes: true,
        },
    },
};
class StripeService {
    // Create Stripe customer
    static async createCustomer(userId, email, name) {
        try {
            const customer = await stripe_1.default.customers.create({
                email,
                name,
                metadata: {
                    userId,
                },
            });
            logger_1.logger.info(`Stripe customer created: ${customer.id} for user ${userId}`);
            return customer.id;
        }
        catch (error) {
            logger_1.logger.error(`Error creating Stripe customer: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to create customer');
        }
    }
    // Create payment intent
    static async createPaymentIntent(amount, currency, customerId, metadata) {
        try {
            const paymentIntent = await stripe_1.default.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                customer: customerId,
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error(`Error creating payment intent: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to create payment intent');
        }
    }
    // Create subscription
    static async createSubscription(customerId, priceId, userId) {
        try {
            const subscription = await stripe_1.default.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId,
                },
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error(`Error creating subscription: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to create subscription');
        }
    }
    // Cancel subscription
    static async cancelSubscription(subscriptionId, immediately = false) {
        try {
            if (immediately) {
                const subscription = await stripe_1.default.subscriptions.cancel(subscriptionId);
                return subscription;
            }
            else {
                const subscription = await stripe_1.default.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
                return subscription;
            }
        }
        catch (error) {
            logger_1.logger.error(`Error canceling subscription: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to cancel subscription');
        }
    }
    // Reactivate subscription
    static async reactivateSubscription(subscriptionId) {
        try {
            const subscription = await stripe_1.default.subscriptions.update(subscriptionId, {
                cancel_at_period_end: false,
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error(`Error reactivating subscription: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to reactivate subscription');
        }
    }
    // Update subscription
    static async updateSubscription(subscriptionId, newPriceId) {
        try {
            const subscription = await stripe_1.default.subscriptions.retrieve(subscriptionId);
            const updatedSubscription = await stripe_1.default.subscriptions.update(subscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: newPriceId,
                    },
                ],
                proration_behavior: 'create_prorations',
            });
            return updatedSubscription;
        }
        catch (error) {
            logger_1.logger.error(`Error updating subscription: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to update subscription');
        }
    }
    // Get customer portal session
    static async createCustomerPortalSession(customerId, returnUrl) {
        try {
            const session = await stripe_1.default.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
            return session.url;
        }
        catch (error) {
            logger_1.logger.error(`Error creating customer portal session: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to create portal session');
        }
    }
    // Create checkout session
    static async createCheckoutSession(customerId, priceId, userId, successUrl, cancelUrl) {
        try {
            const session = await stripe_1.default.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId,
                },
            });
            return session.url;
        }
        catch (error) {
            logger_1.logger.error(`Error creating checkout session: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to create checkout session');
        }
    }
    // Retrieve payment intent
    static async retrievePaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await stripe_1.default.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving payment intent: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to retrieve payment intent');
        }
    }
    // List customer payment methods
    static async listPaymentMethods(customerId) {
        try {
            const paymentMethods = await stripe_1.default.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            logger_1.logger.error(`Error listing payment methods: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to list payment methods');
        }
    }
    // Detach payment method
    static async detachPaymentMethod(paymentMethodId) {
        try {
            await stripe_1.default.paymentMethods.detach(paymentMethodId);
        }
        catch (error) {
            logger_1.logger.error(`Error detaching payment method: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to detach payment method');
        }
    }
    // Get invoices
    static async getInvoices(customerId, limit = 10) {
        try {
            const invoices = await stripe_1.default.invoices.list({
                customer: customerId,
                limit,
            });
            return invoices.data;
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving invoices: ${error.message}`);
            throw new ApiError_1.default(500, 'Failed to retrieve invoices');
        }
    }
    // Process one-time payment
    static async processOneTimePayment(userId, amount, description, type) {
        try {
            const user = await models_1.User.findById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Get or create Stripe customer
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                customerId = await this.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`);
                user.stripeCustomerId = customerId;
                await user.save();
            }
            // Create payment intent
            const paymentIntent = await this.createPaymentIntent(amount, 'USD', customerId, {
                userId,
                description,
                type,
            });
            // Create payment record
            await models_1.Payment.create({
                user: userId,
                amount,
                currency: 'USD',
                status: 'pending',
                paymentMethod: 'card',
                stripePaymentIntentId: paymentIntent.id,
                description,
                type,
            });
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error(`Error processing one-time payment: ${error.message}`);
            throw error;
        }
    }
    // Handle successful payment
    static async handleSuccessfulPayment(paymentIntentId) {
        try {
            const payment = await models_1.Payment.findOne({ stripePaymentIntentId: paymentIntentId });
            if (!payment) {
                logger_1.logger.error(`Payment not found for payment intent: ${paymentIntentId}`);
                return;
            }
            payment.status = types_1.PaymentStatus.COMPLETED;
            payment.paidAt = new Date();
            await payment.save();
            logger_1.logger.info(`Payment completed: ${payment._id}`);
            // Handle specific payment types
            if (payment.type === 'background_check') {
                const { RoommateProfile } = await Promise.resolve().then(() => __importStar(require('../models')));
                await RoommateProfile.findOneAndUpdate({ user: payment.user }, {
                    'backgroundCheck.completed': true,
                    'backgroundCheck.passedAt': new Date(),
                });
            }
            // Send notification
            const { Notification } = await Promise.resolve().then(() => __importStar(require('../models')));
            await Notification.create({
                recipient: payment.user,
                type: 'payment',
                title: 'Payment Successful',
                message: `Your payment of $${payment.amount} was successful`,
                priority: 'medium',
            });
        }
        catch (error) {
            logger_1.logger.error(`Error handling successful payment: ${error.message}`);
        }
    }
    // Handle failed payment
    static async handleFailedPayment(paymentIntentId, failureReason) {
        try {
            const payment = await models_1.Payment.findOne({ stripePaymentIntentId: paymentIntentId });
            if (!payment) {
                logger_1.logger.error(`Payment not found for payment intent: ${paymentIntentId}`);
                return;
            }
            payment.status = types_1.PaymentStatus.FAILED;
            payment.failureReason = failureReason;
            await payment.save();
            logger_1.logger.info(`Payment failed: ${payment._id}`);
            // Send notification
            const { Notification } = await Promise.resolve().then(() => __importStar(require('../models')));
            await Notification.create({
                recipient: payment.user,
                type: 'payment',
                title: 'Payment Failed',
                message: `Your payment failed: ${failureReason}`,
                priority: 'high',
            });
        }
        catch (error) {
            logger_1.logger.error(`Error handling failed payment: ${error.message}`);
        }
    }
}
exports.StripeService = StripeService;
//# sourceMappingURL=stripe.service.js.map