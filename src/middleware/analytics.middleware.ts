import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { v4 as uuidv4 } from 'uuid';

// Track page views
export const trackPageView = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  const sessionId = req.cookies?.sessionId || uuidv4();

  // Set session cookie if not exists
  if (!req.cookies?.sessionId) {
    res.cookie('sessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // Track page view asynchronously (don't wait)
  AnalyticsService.trackEvent({
    userId: authReq.user?.id,
    sessionId,
    eventCategory: 'page_view',
    eventName: req.path,
    properties: {
      method: req.method,
      query: req.query,
    },
    req,
  }).catch((error) => {
    // Silent fail - analytics should never break the app
  });

  next();
};

// Track specific events
export const trackEvent = (eventCategory: string, eventName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    const sessionId = req.cookies?.sessionId || uuidv4();

    AnalyticsService.trackEvent({
      userId: authReq.user?.id,
      sessionId,
      eventCategory: eventCategory as any,
      eventName,
      properties: {
        ...req.body,
        ...req.params,
      },
      req,
    }).catch(() => {});

    next();
  };
};