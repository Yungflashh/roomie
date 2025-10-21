import { Request } from 'express';
interface TrackEventOptions {
    userId?: string;
    sessionId: string;
    eventCategory: 'user' | 'profile' | 'match' | 'chat' | 'game' | 'payment' | 'page_view';
    eventName: string;
    properties?: any;
    req?: Request;
}
export declare class AnalyticsService {
    static trackEvent(options: TrackEventOptions): Promise<void>;
    private static getClientIP;
    static getUserJourney(userId: string, limit?: number): Promise<any[]>;
    static getConversionFunnel(startDate: Date, endDate: Date): Promise<any>;
    static getDailyActiveUsers(startDate: Date, endDate: Date): Promise<any[]>;
    static getRetentionCohorts(startDate: Date): Promise<any>;
    static getTopEvents(startDate: Date, endDate: Date, category?: string, limit?: number): Promise<any[]>;
    static getDeviceStats(startDate: Date, endDate: Date): Promise<any>;
    static getGeographicDistribution(startDate: Date, endDate: Date): Promise<any[]>;
    static getSessionStats(startDate: Date, endDate: Date): Promise<any>;
}
export {};
//# sourceMappingURL=analytics.service.d.ts.map