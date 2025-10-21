import mongoose, { Document, Model } from 'mongoose';
export interface IAnalyticsEvent extends Document {
    userId?: mongoose.Types.ObjectId;
    sessionId: string;
    eventType: string;
    eventCategory: 'user' | 'profile' | 'match' | 'chat' | 'game' | 'payment' | 'page_view';
    eventName: string;
    properties?: any;
    timestamp: Date;
    device?: {
        type: string;
        browser: string;
        os: string;
        userAgent: string;
    };
    location?: {
        country?: string;
        region?: string;
        city?: string;
        timezone?: string;
    };
    page?: {
        url: string;
        referrer?: string;
        title?: string;
    };
}
declare const AnalyticsEvent: Model<IAnalyticsEvent>;
export default AnalyticsEvent;
//# sourceMappingURL=Analytics.model.d.ts.map