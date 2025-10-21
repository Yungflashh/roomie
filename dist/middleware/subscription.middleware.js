"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSubscription = exports.requireFeature = exports.requirePro = exports.requirePremiumOrPro = exports.requireSubscription = void 0;
const models_1 = require("../models");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const stripe_service_1 = require("../services/stripe.service");
// Check if user has active subscription
exports.requireSubscription = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription || subscription.status !== 'active') {
        throw new ApiError_1.default(403, 'Active subscription required');
    }
    next();
});
// Check if user has premium or pro subscription
exports.requirePremiumOrPro = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription ||
        subscription.status !== 'active' ||
        !['premium', 'pro'].includes(subscription.plan)) {
        throw new ApiError_1.default(403, 'Premium or Pro subscription required');
    }
    next();
});
// Check if user has pro subscription
exports.requirePro = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    if (!subscription || subscription.status !== 'active' || subscription.plan !== 'pro') {
        throw new ApiError_1.default(403, 'Pro subscription required');
    }
    next();
});
// Check if user has access to specific feature
const requireFeature = (featureName) => {
    return (0, catchAsync_1.default)(async (req, res, next) => {
        const userId = req.user?.id;
        const subscription = await models_1.Subscription.findOne({ user: userId });
        let hasAccess = false;
        if (subscription && subscription.status === 'active') {
            hasAccess = subscription.features[featureName] === true;
        }
        else {
            // Check basic plan
            hasAccess = stripe_service_1.SUBSCRIPTION_PLANS.basic.features[featureName] === true;
        }
        if (!hasAccess) {
            throw new ApiError_1.default(403, `This feature requires a subscription. Please upgrade your plan.`);
        }
        next();
    });
};
exports.requireFeature = requireFeature;
// Attach subscription to request
exports.attachSubscription = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = req.user?.id;
    const subscription = await models_1.Subscription.findOne({ user: userId });
    req.subscription = subscription || {
        plan: 'basic',
        status: 'active',
        features: stripe_service_1.SUBSCRIPTION_PLANS.basic.features,
    };
    next();
});
//# sourceMappingURL=subscription.middleware.js.map