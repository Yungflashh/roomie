import { Request, Response } from 'express';
import stripe from '../../config/stripe';
import { User, Subscription, Payment, RoommateProfile } from '../../models';
import { logger } from '../../utils/logger';
import { SUBSCRIPTION_PLANS } from '../../services/stripe.service';
import mongoose from 'mongoose';
import { PaymentStatus } from '../../types';


export class WebhookController {
  static handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info(`Received Stripe webhook: ${event.type}`);

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
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      logger.error(`Error handling webhook: ${error.message}`);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  };
}

// Webhook event handlers
async function handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
  logger.info(`Payment succeeded: ${paymentIntent.id}`);

  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (payment) {
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.stripeChargeId = paymentIntent.charges?.data[0]?.id;
    await payment.save();

    // Handle post-payment actions
    if (payment.type === 'background_check') {
      await RoommateProfile.findOneAndUpdate(
        { user: payment.user },
        {
          'backgroundCheck.completed': true,
          'backgroundCheck.passedAt': new Date(),
        }
      );
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
  logger.info(`Payment failed: ${paymentIntent.id}`);

  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (payment) {
payment.status = PaymentStatus.FAILED;
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.save();
  }
}

async function handleSubscriptionCreated(subscription: any): Promise<void> {
  logger.info(`Subscription created: ${subscription.id}`);

  const userId = subscription.metadata.userId;

  if (!userId) {
    logger.error('No userId in subscription metadata');
    return;
  }

const plan = getPlanFromSubscription(subscription);

  const newSubscription = await Subscription.create({
    user: userId,
    plan,
    status: 'active',
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    features: SUBSCRIPTION_PLANS[plan].features,
  });

  // Update profile premium status
  await RoommateProfile.findOneAndUpdate(
    { user: userId },
    {
      isPremium: true,
      premiumExpiry: new Date(subscription.current_period_end * 1000),
    }
  );

  logger.info(`Subscription created in database: ${newSubscription._id}`);
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  logger.info(`Subscription updated: ${subscription.id}`);

  const plan = getPlanFromSubscription(subscription);

  const existingSubscription = await Subscription.findOne({
    stripeSubscriptionId: subscription.id,
  });

  if (!existingSubscription) {
    logger.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  existingSubscription.plan = plan;
  existingSubscription.status = subscription.status;
  existingSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  existingSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  existingSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
  existingSubscription.features = SUBSCRIPTION_PLANS[plan].features;

  if (subscription.canceled_at) {
    existingSubscription.cancelledAt = new Date(subscription.canceled_at * 1000);
  }

  await existingSubscription.save();

  // Update profile
  await RoommateProfile.findOneAndUpdate(
    { user: existingSubscription.user },
    {
      isPremium: subscription.status === 'active',
      premiumExpiry: new Date(subscription.current_period_end * 1000),
    }
  );
}

async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  logger.info(`Subscription deleted: ${subscription.id}`);

  const existingSubscription = await Subscription.findOne({
    stripeSubscriptionId: subscription.id,
  });

  if (!existingSubscription) {
    logger.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  existingSubscription.status = 'cancelled';
  existingSubscription.cancelledAt = new Date();
  await existingSubscription.save();

  // Remove premium status
  await RoommateProfile.findOneAndUpdate(
    { user: existingSubscription.user },
    {
      isPremium: false,
      premiumExpiry: null,
    }
  );
}

async function handleInvoicePaid(invoice: any): Promise<void> {
  logger.info(`Invoice paid: ${invoice.id}`);

  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!subscription) {
    logger.error(`Subscription not found for invoice: ${invoice.id}`);
    return;
  }

  // Create payment record
  const payment = await Payment.create({
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
subscription.billingHistory.push(payment._id as any);
  await subscription.save();

  // Send notification
  const { Notification } = await import('../../models');
  await Notification.create({
    recipient: subscription.user,
    type: 'payment',
    title: 'Subscription Payment Successful',
    message: `Your ${subscription.plan} subscription payment of $${payment.amount} was successful`,
    priority: 'medium',
  });
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  logger.info(`Invoice payment failed: ${invoice.id}`);

  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!subscription) {
    logger.error(`Subscription not found for invoice: ${invoice.id}`);
    return;
  }

  // Send notification
  const { Notification } = await import('../../models');
  await Notification.create({
    recipient: subscription.user,
    type: 'payment',
    title: 'Subscription Payment Failed',
    message: 'Your subscription payment failed. Please update your payment method.',
    priority: 'urgent',
  });
}

function getPlanFromSubscription(subscription: any): 'basic' | 'premium' | 'pro' {
  // Extract plan from subscription price
  const priceId = subscription.items.data[0]?.price.id;

  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
    return 'premium';
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro';
  }

  return 'basic';
}