"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleSubscriptionCancellation = exports.scheduleSubscriptionRenewal = void 0;
const bull_1 = __importDefault(require("bull"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const stripe_service_1 = require("../services/stripe.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Bull Queue with proper Redis auth
const subscriptionQueue = new bull_1.default('subscription-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
// Error handling
subscriptionQueue.on('error', (error) => {
    logger_1.logger.error('Subscription queue error:', error);
});
subscriptionQueue.on('failed', (job, err) => {
    logger_1.logger.error(`Subscription job ${job.id} failed:`, err);
});
subscriptionQueue.on('completed', (job) => {
    logger_1.logger.info(`Subscription job ${job.id} completed`);
});
// Process subscription renewal
subscriptionQueue.process('renew-subscription', async (job) => {
    try {
        const { subscriptionId } = job.data;
        const subscription = await models_1.Subscription.findById(subscriptionId).populate('user');
        if (!subscription) {
            logger_1.logger.warn(`Subscription ${subscriptionId} not found`);
            return;
        }
        if (subscription.status !== 'active') {
            logger_1.logger.info(`Subscription ${subscriptionId} is not active, skipping renewal`);
            return;
        }
        try {
            // Update subscription period
            subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await subscription.save();
            logger_1.logger.info(`Successfully renewed subscription ${subscriptionId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to renew subscription ${subscriptionId}:`, error);
            // Mark subscription as expired
            subscription.status = 'expired';
            await subscription.save();
            throw error;
        }
    }
    catch (error) {
        logger_1.logger.error('Error renewing subscription:', error);
        throw error;
    }
});
// Process subscription cancellation
subscriptionQueue.process('cancel-subscription', async (job) => {
    try {
        const { subscriptionId } = job.data;
        const subscription = await models_1.Subscription.findById(subscriptionId).populate('user');
        if (!subscription) {
            logger_1.logger.warn(`Subscription ${subscriptionId} not found`);
            return;
        }
        // Cancel on Stripe
        if (subscription.stripeSubscriptionId) {
            await stripe_service_1.StripeService.cancelSubscription(subscription.stripeSubscriptionId);
        }
        // Update subscription status
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();
        logger_1.logger.info(`Canceled subscription ${subscriptionId}`);
    }
    catch (error) {
        logger_1.logger.error('Error canceling subscription:', error);
        throw error;
    }
});
// Process subscription expiration check
subscriptionQueue.process('check-expirations', async (job) => {
    try {
        const now = new Date();
        const expiredSubscriptions = await models_1.Subscription.find({
            status: 'active',
            currentPeriodEnd: { $lt: now },
        }).populate('user');
        for (const subscription of expiredSubscriptions) {
            if (subscription.cancelAtPeriodEnd) {
                // Cancel the subscription
                subscription.status = 'cancelled';
                subscription.cancelledAt = now;
                await subscription.save();
                logger_1.logger.info(`Subscription ${subscription._id} expired and canceled`);
            }
            else {
                // Schedule renewal
                const subId = subscription._id.toString();
                await (0, exports.scheduleSubscriptionRenewal)(subId);
            }
        }
        logger_1.logger.info(`Checked ${expiredSubscriptions.length} expired subscriptions`);
    }
    catch (error) {
        logger_1.logger.error('Error checking subscription expirations:', error);
        throw error;
    }
});
// Schedule subscription renewal
const scheduleSubscriptionRenewal = async (subscriptionId) => {
    await subscriptionQueue.add('renew-subscription', { subscriptionId }, {
        jobId: `renew-subscription-${subscriptionId}`,
    });
    logger_1.logger.info(`Scheduled renewal for subscription ${subscriptionId}`);
};
exports.scheduleSubscriptionRenewal = scheduleSubscriptionRenewal;
// Schedule subscription cancellation
const scheduleSubscriptionCancellation = async (subscriptionId) => {
    await subscriptionQueue.add('cancel-subscription', { subscriptionId }, {
        jobId: `cancel-subscription-${subscriptionId}`,
    });
    logger_1.logger.info(`Scheduled cancellation for subscription ${subscriptionId}`);
};
exports.scheduleSubscriptionCancellation = scheduleSubscriptionCancellation;
// Set up recurring expiration checks
const setupRecurringJobs = async () => {
    try {
        await subscriptionQueue.add('check-expirations', {}, {
            repeat: {
                cron: '0 * * * *', // Every hour
            },
            jobId: 'check-subscription-expirations',
        });
        logger_1.logger.info('Recurring subscription jobs scheduled');
    }
    catch (error) {
        logger_1.logger.error('Error setting up recurring subscription jobs:', error);
    }
};
// Initialize recurring jobs
setupRecurringJobs();
// Clean up old jobs
subscriptionQueue.clean(24 * 60 * 60 * 1000, 'completed');
subscriptionQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
logger_1.logger.info('Subscription jobs scheduled');
exports.default = subscriptionQueue;
//# sourceMappingURL=subscription.jobs.js.map