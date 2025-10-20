import { Response } from 'express';
import { AuthRequest } from '../../types';
import { User, Subscription, Payment, RoommateProfile } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { StripeService, SUBSCRIPTION_PLANS } from '../../services/stripe.service';

export class SubscriptionController {
  // Get available plans
  static getPlans = catchAsync(async (req: AuthRequest, res: Response) => {
    ApiResponse.success(
      res,
      { plans: SUBSCRIPTION_PLANS },
      'Subscription plans retrieved successfully'
    );
  });

  // Get current subscription
  static getCurrentSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId }).populate(
      'billingHistory'
    );

    if (!subscription) {
      return ApiResponse.success(
        res,
        {
          subscription: {
            plan: 'basic',
            status: 'active',
            features: SUBSCRIPTION_PLANS.basic.features,
          },
        },
        'No active subscription'
      );
    }

    ApiResponse.success(res, { subscription }, 'Subscription retrieved successfully');
  });

  // Create checkout session
  static createCheckoutSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { plan } = req.body;

    if (!['premium', 'pro'].includes(plan)) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      customerId = await StripeService.createCustomer(
        userId!,
        user.email,
        `${user.firstName} ${user.lastName}`
      );
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // TODO: Replace with actual Stripe Price IDs from your Stripe Dashboard
    const priceIds: Record<string, string> = {
      premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
      pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    };

    const successUrl = `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/subscription/cancel`;

    const checkoutUrl = await StripeService.createCheckoutSession(
      customerId,
      priceIds[plan],
      userId!,
      successUrl,
      cancelUrl
    );

    ApiResponse.success(
      res,
      { checkoutUrl },
      'Checkout session created successfully'
    );
  });

  // Cancel subscription
  static cancelSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { immediately } = req.body;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new ApiError(404, 'No active subscription found');
    }

    if (subscription.status !== 'active') {
      throw new ApiError(400, 'Subscription is not active');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new ApiError(400, 'Invalid subscription');
    }

    // Cancel in Stripe
    await StripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);

    // Update local subscription
    if (immediately) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    await subscription.save();

    // Send notification
    const { Notification } = await import('../../models');
    await Notification.create({
      recipient: userId,
      type: 'system',
      title: 'Subscription Cancelled',
      message: immediately
        ? 'Your subscription has been cancelled immediately'
        : 'Your subscription will be cancelled at the end of the billing period',
      priority: 'medium',
    });

    ApiResponse.success(res, { subscription }, 'Subscription cancelled successfully');
  });

  // Reactivate subscription
  static reactivateSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new ApiError(404, 'No subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new ApiError(400, 'Subscription is not scheduled for cancellation');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new ApiError(400, 'Invalid subscription');
    }

    // Reactivate in Stripe
    await StripeService.reactivateSubscription(subscription.stripeSubscriptionId);

    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    ApiResponse.success(res, { subscription }, 'Subscription reactivated successfully');
  });

  // Upgrade/Downgrade subscription
  static updateSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { newPlan } = req.body;

    if (!['premium', 'pro'].includes(newPlan)) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new ApiError(404, 'No active subscription found');
    }

    if (subscription.status !== 'active') {
      throw new ApiError(400, 'Subscription is not active');
    }

    if (subscription.plan === newPlan) {
      throw new ApiError(400, 'Already subscribed to this plan');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new ApiError(400, 'Invalid subscription');
    }

    // TODO: Replace with actual Stripe Price IDs
    const priceIds: Record<string, string> = {
      premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
      pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    };

    // Update in Stripe
    await StripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      priceIds[newPlan]
    );

    // Update local subscription
    subscription.plan = newPlan as 'premium' | 'pro';
    subscription.features = SUBSCRIPTION_PLANS[newPlan].features;
    await subscription.save();

    // Update profile premium status
    const profile = await RoommateProfile.findOne({ user: userId });
    if (profile) {
      profile.isPremium = true;
      await profile.save();
    }

    ApiResponse.success(res, { subscription }, 'Subscription updated successfully');
  });

  // Get customer portal URL
  static getCustomerPortal = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      throw new ApiError(400, 'No Stripe customer found');
    }

    const returnUrl = `${process.env.CLIENT_URL}/settings/subscription`;
    const portalUrl = await StripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      returnUrl
    );

    ApiResponse.success(res, { portalUrl }, 'Customer portal URL generated');
  });

  // Check feature access
  static checkFeatureAccess = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { feature } = req.params;

    const subscription = await Subscription.findOne({ user: userId });

    let hasAccess = false;

    if (subscription && subscription.status === 'active') {
      hasAccess = (subscription.features as any)[feature] === true;
    } else {
      // Check basic plan features
      hasAccess = (SUBSCRIPTION_PLANS.basic.features as any)[feature] === true;
    }

    ApiResponse.success(
      res,
      {
        feature,
        hasAccess,
        plan: subscription?.plan || 'basic',
      },
      'Feature access checked'
    );
  });
}