import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import ApiError from '../utils/ApiError';
import { AuthRequest } from '../types';

// Protect routes - require authentication
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'You are not logged in. Please log in to get access.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: string;
    };

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'The user belonging to this token no longer exists.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated. Please contact support.');
    }

    // Grant access to protected route
    (req as AuthRequest).user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token. Please log in again.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Your token has expired. Please log in again.'));
    } else {
      next(error);
    }
  }
};

// Restrict to specific roles
export const restrictTo = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    
    next();
  };
};

// Require email verification
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  try {
    const user = await User.findById(authReq.user?.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Please verify your email to access this resource');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require phone verification
export const requirePhoneVerification = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  try {
    const user = await User.findById(authReq.user?.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.isPhoneVerified) {
      throw new ApiError(403, 'Please verify your phone number to access this resource');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require complete profile
export const requireCompleteProfile = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  try {
    const { RoommateProfile } = await import('../models');
    const profile = await RoommateProfile.findOne({ user: authReq.user?.id });
    
    if (!profile || !profile.isProfileComplete) {
      throw new ApiError(403, 'Please complete your profile to access this resource');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require subscription (Premium/Pro)
export const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  try {
    const user = await User.findById(authReq.user?.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user has premium subscription
    const { Subscription } = await import('../models');
    const subscription = await Subscription.findOne({ 
      user: user._id,
      status: 'active'
    });

    if (!subscription || subscription.plan === 'basic') {
      throw new ApiError(403, 'This feature requires a premium subscription');
    }

    next();
  } catch (error) {
    next(error);
  }
};