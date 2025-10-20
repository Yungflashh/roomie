import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Subscription } from '../models';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { SUBSCRIPTION_PLANS } from '../services/stripe.service';

// Check if user has active subscription
export const requireSubscription = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || subscription.status !== 'active') {
      throw new ApiError(403, 'Active subscription required');
    }

    next();
  }
);

// Check if user has premium or pro subscription
export const requirePremiumOrPro = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    if (
      !subscription ||
      subscription.status !== 'active' ||
      !['premium', 'pro'].includes(subscription.plan)
    ) {
      throw new ApiError(403, 'Premium or Pro subscription required');
    }

    next();
  }
);

// Check if user has pro subscription
export const requirePro = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || subscription.status !== 'active' || subscription.plan !== 'pro') {
      throw new ApiError(403, 'Pro subscription required');
    }

    next();
  }
);

// Check if user has access to specific feature
export const requireFeature = (featureName: string) => {
  return catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    let hasAccess = false;

    if (subscription && subscription.status === 'active') {
      hasAccess = (subscription.features as any)[featureName] === true;
    } else {
      // Check basic plan
      hasAccess = (SUBSCRIPTION_PLANS.basic.features as any)[featureName] === true;
    }

    if (!hasAccess) {
      throw new ApiError(
        403,
        `This feature requires a subscription. Please upgrade your plan.`
      );
    }

    next();
  });
};

// Attach subscription to request
export const attachSubscription = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({ user: userId });

    (req as any).subscription = subscription || {
      plan: 'basic',
      status: 'active',
      features: SUBSCRIPTION_PLANS.basic.features,
    };

    next();
  }
);