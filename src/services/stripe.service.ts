import stripe from '../config/stripe';
import { User, Subscription, Payment } from '../models';
import { logger } from '../utils/logger';
import ApiError from '../utils/ApiError';
import { PaymentStatus } from '../types';


export interface SubscriptionPlan {
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    unlimitedMatches: boolean;
    advancedFilters: boolean;
    seeWhoLikedYou: boolean;
    prioritySupport: boolean;
    backgroundCheck: boolean;
    videoProfile: boolean;
    incognitoMode: boolean;
    readReceipts: boolean;
    profileBoost: number;
    rewindSwipes: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
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

export class StripeService {
  // Create Stripe customer
  static async createCustomer(userId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      logger.info(`Stripe customer created: ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error: any) {
      logger.error(`Error creating Stripe customer: ${error.message}`);
      throw new ApiError(500, 'Failed to create customer');
    }
  }

  // Create payment intent
  static async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata?: any
  ): Promise<any> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error(`Error creating payment intent: ${error.message}`);
      throw new ApiError(500, 'Failed to create payment intent');
    }
  }

  // Create subscription
  static async createSubscription(
    customerId: string,
    priceId: string,
    userId: string
  ): Promise<any> {
    try {
      const subscription = await stripe.subscriptions.create({
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
    } catch (error: any) {
      logger.error(`Error creating subscription: ${error.message}`);
      throw new ApiError(500, 'Failed to create subscription');
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<any> {
    try {
      if (immediately) {
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return subscription;
      } else {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return subscription;
      }
    } catch (error: any) {
      logger.error(`Error canceling subscription: ${error.message}`);
      throw new ApiError(500, 'Failed to cancel subscription');
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error: any) {
      logger.error(`Error reactivating subscription: ${error.message}`);
      throw new ApiError(500, 'Failed to reactivate subscription');
    }
  }

  // Update subscription
  static async updateSubscription(subscriptionId: string, newPriceId: string): Promise<any> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });

      return updatedSubscription;
    } catch (error: any) {
      logger.error(`Error updating subscription: ${error.message}`);
      throw new ApiError(500, 'Failed to update subscription');
    }
  }

  // Get customer portal session
  static async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error: any) {
      logger.error(`Error creating customer portal session: ${error.message}`);
      throw new ApiError(500, 'Failed to create portal session');
    }
  }

  // Create checkout session
  static async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const session = await stripe.checkout.sessions.create({
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

      return session.url!;
    } catch (error: any) {
      logger.error(`Error creating checkout session: ${error.message}`);
      throw new ApiError(500, 'Failed to create checkout session');
    }
  }

  // Retrieve payment intent
  static async retrievePaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      logger.error(`Error retrieving payment intent: ${error.message}`);
      throw new ApiError(500, 'Failed to retrieve payment intent');
    }
  }

  // List customer payment methods
  static async listPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error: any) {
      logger.error(`Error listing payment methods: ${error.message}`);
      throw new ApiError(500, 'Failed to list payment methods');
    }
  }

  // Detach payment method
  static async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error: any) {
      logger.error(`Error detaching payment method: ${error.message}`);
      throw new ApiError(500, 'Failed to detach payment method');
    }
  }

  // Get invoices
  static async getInvoices(customerId: string, limit: number = 10): Promise<any[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data;
    } catch (error: any) {
      logger.error(`Error retrieving invoices: ${error.message}`);
      throw new ApiError(500, 'Failed to retrieve invoices');
    }
  }

  // Process one-time payment
  static async processOneTimePayment(
    userId: string,
    amount: number,
    description: string,
    type: 'verification' | 'background_check' | 'feature'
  ): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        customerId = await this.createCustomer(
          userId,
          user.email,
          `${user.firstName} ${user.lastName}`
        );
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
      await Payment.create({
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
    } catch (error: any) {
      logger.error(`Error processing one-time payment: ${error.message}`);
      throw error;
    }
  }

  // Handle successful payment
  static async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

      if (!payment) {
        logger.error(`Payment not found for payment intent: ${paymentIntentId}`);
        return;
      }

        payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      await payment.save();

      logger.info(`Payment completed: ${payment._id}`);

      // Handle specific payment types
      if (payment.type === 'background_check') {
        const { RoommateProfile } = await import('../models');
        await RoommateProfile.findOneAndUpdate(
          { user: payment.user },
          {
            'backgroundCheck.completed': true,
            'backgroundCheck.passedAt': new Date(),
          }
        );
      }

      // Send notification
      const { Notification } = await import('../models');
      await Notification.create({
        recipient: payment.user,
        type: 'payment',
        title: 'Payment Successful',
        message: `Your payment of $${payment.amount} was successful`,
        priority: 'medium',
      });
    } catch (error: any) {
      logger.error(`Error handling successful payment: ${error.message}`);
    }
  }

  // Handle failed payment
  static async handleFailedPayment(paymentIntentId: string, failureReason: string): Promise<void> {
    try {
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

      if (!payment) {
        logger.error(`Payment not found for payment intent: ${paymentIntentId}`);
        return;
      }

        payment.status = PaymentStatus.FAILED;
        payment.failureReason = failureReason;
      await payment.save();

      logger.info(`Payment failed: ${payment._id}`);

      // Send notification
      const { Notification } = await import('../models');
      await Notification.create({
        recipient: payment.user,
        type: 'payment',
        title: 'Payment Failed',
        message: `Your payment failed: ${failureReason}`,
        priority: 'high',
      });
    } catch (error: any) {
      logger.error(`Error handling failed payment: ${error.message}`);
    }
  }
}