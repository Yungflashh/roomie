import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  eventType: string;
  eventCategory: 'user' | 'profile' | 'match' | 'chat' | 'game' | 'payment' | 'page_view';
  eventName: string;
  properties?: any;
  timestamp: Date;
  // Device info
  device?: {
    type: string;
    browser: string;
    os: string;
    userAgent: string;
  };
  // Location info
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  // Page info
  page?: {
    url: string;
    referrer?: string;
    title?: string;
  };
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    eventCategory: {
      type: String,
      enum: ['user', 'profile', 'match', 'chat', 'game', 'payment', 'page_view'],
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    properties: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    device: {
      type: {
        type: String,
      },
      browser: String,
      os: String,
      userAgent: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String,
    },
    page: {
      url: String,
      referrer: String,
      title: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventCategory: 1, eventName: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

// TTL index - automatically delete events older than 90 days
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AnalyticsEvent: Model<IAnalyticsEvent> = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);

export default AnalyticsEvent;