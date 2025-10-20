import Queue from 'bull';
import { Subscription } from '../models';
import { logger } from '../utils/logger';
import { StripeService } from '../services/stripe.service';

// Bull Queue with proper Redis auth
const subscriptionQueue = new Queue('subscription-processing', {
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
  logger.error('Subscription queue error:', error);
});

subscriptionQueue.on('failed', (job, err) => {
  logger.error(`Subscription job ${job.id} failed:`, err);
});

subscriptionQueue.on('completed', (job) => {
  logger.info(`Subscription job ${job.id} completed`);
});

// Process subscription renewal
subscriptionQueue.process('renew-subscription', async (job) => {
  try {
    const { subscriptionId } = job.data;

    const subscription = await Subscription.findById(subscriptionId).populate('user');

    if (!subscription) {
      logger.warn(`Subscription ${subscriptionId} not found`);
      return;
    }

    if (subscription.status !== 'active') {
      logger.info(`Subscription ${subscriptionId} is not active, skipping renewal`);
      return;
    }

    try {
      // Update subscription period
      subscription.currentPeriodEnd = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      await subscription.save();

      logger.info(`Successfully renewed subscription ${subscriptionId}`);

    } catch (error) {
      logger.error(`Failed to renew subscription ${subscriptionId}:`, error);
      
      // Mark subscription as expired
      subscription.status = 'expired';
      await subscription.save();
      
      throw error;
    }
  } catch (error) {
    logger.error('Error renewing subscription:', error);
    throw error;
  }
});

// Process subscription cancellation
subscriptionQueue.process('cancel-subscription', async (job) => {
  try {
    const { subscriptionId } = job.data;

    const subscription = await Subscription.findById(subscriptionId).populate('user');

    if (!subscription) {
      logger.warn(`Subscription ${subscriptionId} not found`);
      return;
    }

    // Cancel on Stripe
    if (subscription.stripeSubscriptionId) {
      await StripeService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    logger.info(`Canceled subscription ${subscriptionId}`);

  } catch (error) {
    logger.error('Error canceling subscription:', error);
    throw error;
  }
});

// Process subscription expiration check
subscriptionQueue.process('check-expirations', async (job) => {
  try {
    const now = new Date();

    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      currentPeriodEnd: { $lt: now },
    }).populate('user');

    for (const subscription of expiredSubscriptions) {
      if (subscription.cancelAtPeriodEnd) {
        // Cancel the subscription
        subscription.status = 'cancelled';
        subscription.cancelledAt = now;
        await subscription.save();

        logger.info(`Subscription ${subscription._id} expired and canceled`);

      } else {
        // Schedule renewal
        const subId = (subscription._id as any).toString();
        await scheduleSubscriptionRenewal(subId);
      }
    }

    logger.info(`Checked ${expiredSubscriptions.length} expired subscriptions`);
  } catch (error) {
    logger.error('Error checking subscription expirations:', error);
    throw error;
  }
});

// Schedule subscription renewal
export const scheduleSubscriptionRenewal = async (subscriptionId: string): Promise<void> => {
  await subscriptionQueue.add(
    'renew-subscription',
    { subscriptionId },
    {
      jobId: `renew-subscription-${subscriptionId}`,
    }
  );

  logger.info(`Scheduled renewal for subscription ${subscriptionId}`);
};

// Schedule subscription cancellation
export const scheduleSubscriptionCancellation = async (
  subscriptionId: string
): Promise<void> => {
  await subscriptionQueue.add(
    'cancel-subscription',
    { subscriptionId },
    {
      jobId: `cancel-subscription-${subscriptionId}`,
    }
  );

  logger.info(`Scheduled cancellation for subscription ${subscriptionId}`);
};

// Set up recurring expiration checks
const setupRecurringJobs = async (): Promise<void> => {
  try {
    await subscriptionQueue.add(
      'check-expirations',
      {},
      {
        repeat: {
          cron: '0 * * * *', // Every hour
        },
        jobId: 'check-subscription-expirations',
      }
    );

    logger.info('Recurring subscription jobs scheduled');
  } catch (error) {
    logger.error('Error setting up recurring subscription jobs:', error);
  }
};

// Initialize recurring jobs
setupRecurringJobs();

// Clean up old jobs
subscriptionQueue.clean(24 * 60 * 60 * 1000, 'completed');
subscriptionQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

logger.info('Subscription jobs scheduled');

export default subscriptionQueue;