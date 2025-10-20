import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import { AnalyticsEvent } from '../models';
import { logger } from '../utils/logger';
import { Request } from 'express';

interface TrackEventOptions {
  userId?: string;
  sessionId: string;
  eventCategory: 'user' | 'profile' | 'match' | 'chat' | 'game' | 'payment' | 'page_view';
  eventName: string;
  properties?: any;
  req?: Request;
}

export class AnalyticsService {
  // Track an event
  static async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
      const {
        userId,
        sessionId,
        eventCategory,
        eventName,
        properties,
        req,
      } = options;

      const event: any = {
        userId,
        sessionId,
        eventType: `${eventCategory}:${eventName}`,
        eventCategory,
        eventName,
        properties,
        timestamp: new Date(),
      };

      // Parse device info
      if (req) {
        const ua = new UAParser(req.headers['user-agent']);
        event.device = {
          type: ua.getDevice().type || 'desktop',
          browser: `${ua.getBrowser().name} ${ua.getBrowser().version}`,
          os: `${ua.getOS().name} ${ua.getOS().version}`,
          userAgent: req.headers['user-agent'],
        };

        // Parse location from IP
        const ip = this.getClientIP(req);
        if (ip) {
          const geo = geoip.lookup(ip);
          if (geo) {
            event.location = {
              country: geo.country,
              region: geo.region,
              city: geo.city,
              timezone: geo.timezone,
            };
          }
        }

        // Page info
        if (req.headers.referer) {
          event.page = {
            url: req.originalUrl,
            referrer: req.headers.referer,
          };
        }
      }

      await AnalyticsEvent.create(event);
    } catch (error) {
      logger.error('Error tracking event:', error);
      // Don't throw - analytics should never break the app
    }
  }

  // Get client IP
  private static getClientIP(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0];
    }
    return req.connection.remoteAddress;
  }

  // Get user journey
  static async getUserJourney(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const events = await AnalyticsEvent.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('eventCategory eventName timestamp properties');

      return events;
    } catch (error) {
      logger.error('Error getting user journey:', error);
      return [];
    }
  }

  // Get conversion funnel
  static async getConversionFunnel(startDate: Date, endDate: Date): Promise<any> {
    try {
      const funnel = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            eventCategory: 'user',
          },
        },
        {
          $group: {
            _id: '$eventName',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            eventName: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
      ]);

      return funnel;
    } catch (error) {
      logger.error('Error getting conversion funnel:', error);
      return [];
    }
  }

  // Get daily active users
  static async getDailyActiveUsers(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const dau = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            userId: { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            },
            users: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            date: '$_id.date',
            count: { $size: '$users' },
          },
        },
        { $sort: { date: 1 } },
      ]);

      return dau;
    } catch (error) {
      logger.error('Error getting DAU:', error);
      return [];
    }
  }

  // Get retention cohorts
  static async getRetentionCohorts(startDate: Date): Promise<any> {
    try {
      // This is a simplified version - in production, use more sophisticated cohort analysis
      const cohorts = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventCategory: 'user',
            eventName: 'login',
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              userId: '$userId',
              week: { $isoWeek: '$timestamp' },
            },
          },
        },
        {
          $group: {
            _id: '$_id.week',
            users: { $addToSet: '$_id.userId' },
          },
        },
        {
          $project: {
            week: '$_id',
            userCount: { $size: '$users' },
          },
        },
        { $sort: { week: 1 } },
      ]);

      return cohorts;
    } catch (error) {
      logger.error('Error getting retention cohorts:', error);
      return [];
    }
  }

  // Get top events
  static async getTopEvents(
    startDate: Date,
    endDate: Date,
    category?: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const match: any = {
        timestamp: { $gte: startDate, $lte: endDate },
      };

      if (category) {
        match.eventCategory = category;
      }

      const topEvents = await AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: { category: '$eventCategory', name: '$eventName' },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            eventCategory: '$_id.category',
            eventName: '$_id.name',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

      return topEvents;
    } catch (error) {
      logger.error('Error getting top events:', error);
      return [];
    }
  }

  // Get device statistics
  static async getDeviceStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const stats = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            'device.type': { $exists: true },
          },
        },
        {
          $group: {
            _id: '$device.type',
            count: { $sum: 1 },
            browsers: { $addToSet: '$device.browser' },
            os: { $addToSet: '$device.os' },
          },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error('Error getting device stats:', error);
      return [];
    }
  }

  // Get geographic distribution
  static async getGeographicDistribution(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const distribution = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            'location.country': { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              country: '$location.country',
              region: '$location.region',
            },
            count: { $sum: 1 },
            users: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            country: '$_id.country',
            region: '$_id.region',
            eventCount: '$count',
            uniqueUsers: { $size: '$users' },
          },
        },
        { $sort: { eventCount: -1 } },
      ]);

      return distribution;
    } catch (error) {
      logger.error('Error getting geographic distribution:', error);
      return [];
    }
  }

  // Get session statistics
  static async getSessionStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const sessions = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$sessionId',
            eventCount: { $sum: 1 },
            duration: {
              $max: '$timestamp',
            },
            firstEvent: {
              $min: '$timestamp',
            },
          },
        },
        {
          $project: {
            eventCount: 1,
            duration: {
              $divide: [
                { $subtract: ['$duration', '$firstEvent'] },
                1000 * 60, // Convert to minutes
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgEventsPerSession: { $avg: '$eventCount' },
            avgSessionDuration: { $avg: '$duration' },
          },
        },
      ]);

      return sessions[0] || {};
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {};
    }
  }
}