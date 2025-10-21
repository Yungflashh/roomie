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
exports.SubscriptionController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const stripe_service_1 = require("../../services/stripe.service");
class SubscriptionController {
}
exports.SubscriptionController = SubscriptionController;
_a = SubscriptionController;
// Get available plans
SubscriptionController.getPlans = (0, catchAsync_1.default)(async (req, res) => {
    apiResponse_1.ApiResponse.success(res, { plans: stripe_service_1.SUBSCRIPTION_PLANS }, 'Subscription plans retrieved successfully');
});
// Get current subscription
SubscriptionController.getCurrentSubscription = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId }).populate('billingHistory');
    if (!subscription) {
        return apiResponse_1.ApiResponse.success(res, {
            subscription: {
                plan: 'basic',
                status: 'active',
                features: stripe_service_1.SUBSCRIPTION_PLANS.basic.features,
            },
        }, 'No active subscription');
    }
    apiResponse_1.ApiResponse.success(res, { subscription }, 'Subscription retrieved successfully');
});
// Create checkout session
SubscriptionController.createCheckoutSession = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { plan } = req.body;
    if (!['premium', 'pro'].includes(plan)) {
        throw new ApiError_1.default(400, 'Invalid subscription plan');
    }
    const user = await models_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        customerId = await stripe_service_1.StripeService.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`);
        user.stripeCustomerId = customerId;
        await user.save();
    }
    // TODO: Replace with actual Stripe Price IDs from your Stripe Dashboard
    const priceIds = {
        premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
        pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    };
    const successUrl = `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/subscription/cancel`;
    const checkoutUrl = await stripe_service_1.StripeService.createCheckoutSession(customerId, priceIds[plan], userId, successUrl, cancelUrl);
    apiResponse_1.ApiResponse.success(res, { checkoutUrl }, 'Checkout session created successfully');
});
// Cancel subscription
SubscriptionController.cancelSubscription = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { immediately } = req.body;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription) {
        throw new ApiError_1.default(404, 'No active subscription found');
    }
    if (subscription.status !== 'active') {
        throw new ApiError_1.default(400, 'Subscription is not active');
    }
    if (!subscription.stripeSubscriptionId) {
        throw new ApiError_1.default(400, 'Invalid subscription');
    }
    // Cancel in Stripe
    await stripe_service_1.StripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);
    // Update local subscription
    if (immediately) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
    }
    else {
        subscription.cancelAtPeriodEnd = true;
    }
    await subscription.save();
    // Send notification
    const { Notification } = await Promise.resolve().then(() => __importStar(require('../../models')));
    await Notification.create({
        recipient: userId,
        type: 'system',
        title: 'Subscription Cancelled',
        message: immediately
            ? 'Your subscription has been cancelled immediately'
            : 'Your subscription will be cancelled at the end of the billing period',
        priority: 'medium',
    });
    apiResponse_1.ApiResponse.success(res, { subscription }, 'Subscription cancelled successfully');
});
// Reactivate subscription
SubscriptionController.reactivateSubscription = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription) {
        throw new ApiError_1.default(404, 'No subscription found');
    }
    if (!subscription.cancelAtPeriodEnd) {
        throw new ApiError_1.default(400, 'Subscription is not scheduled for cancellation');
    }
    if (!subscription.stripeSubscriptionId) {
        throw new ApiError_1.default(400, 'Invalid subscription');
    }
    // Reactivate in Stripe
    await stripe_service_1.StripeService.reactivateSubscription(subscription.stripeSubscriptionId);
    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();
    apiResponse_1.ApiResponse.success(res, { subscription }, 'Subscription reactivated successfully');
});
// Upgrade/Downgrade subscription
SubscriptionController.updateSubscription = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { newPlan } = req.body;
    if (!['premium', 'pro'].includes(newPlan)) {
        throw new ApiError_1.default(400, 'Invalid subscription plan');
    }
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription) {
        throw new ApiError_1.default(404, 'No active subscription found');
    }
    if (subscription.status !== 'active') {
        throw new ApiError_1.default(400, 'Subscription is not active');
    }
    if (subscription.plan === newPlan) {
        throw new ApiError_1.default(400, 'Already subscribed to this plan');
    }
    if (!subscription.stripeSubscriptionId) {
        throw new ApiError_1.default(400, 'Invalid subscription');
    }
    // TODO: Replace with actual Stripe Price IDs
    const priceIds = {
        premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
        pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    };
    // Update in Stripe
    await stripe_service_1.StripeService.updateSubscription(subscription.stripeSubscriptionId, priceIds[newPlan]);
    // Update local subscription
    subscription.plan = newPlan;
    subscription.features = stripe_service_1.SUBSCRIPTION_PLANS[newPlan].features;
    await subscription.save();
    // Update profile premium status
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (profile) {
        profile.isPremium = true;
        await profile.save();
    }
    apiResponse_1.ApiResponse.success(res, { subscription }, 'Subscription updated successfully');
});
// Get customer portal URL
SubscriptionController.getCustomerPortal = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const user = await models_1.User.findById(userId);
    if (!user || !user.stripeCustomerId) {
        throw new ApiError_1.default(400, 'No Stripe customer found');
    }
    const returnUrl = `${process.env.CLIENT_URL}/settings/subscription`;
    const portalUrl = await stripe_service_1.StripeService.createCustomerPortalSession(user.stripeCustomerId, returnUrl);
    apiResponse_1.ApiResponse.success(res, { portalUrl }, 'Customer portal URL generated');
});
// Check feature access
SubscriptionController.checkFeatureAccess = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { feature } = req.params;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    let hasAccess = false;
    if (subscription && subscription.status === 'active') {
        hasAccess = subscription.features[feature] === true;
    }
    else {
        // Check basic plan features
        hasAccess = stripe_service_1.SUBSCRIPTION_PLANS.basic.features[feature] === true;
    }
    apiResponse_1.ApiResponse.success(res, {
        feature,
        hasAccess,
        plan: subscription?.plan || 'basic',
    }, 'Feature access checked');
});
//# sourceMappingURL=subscription.controller.js.map