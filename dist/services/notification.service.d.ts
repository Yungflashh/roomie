import { NotificationType } from '../types';
export declare class NotificationService {
    static create(data: {
        recipient: string;
        sender?: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: any;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        actionUrl?: string;
        imageUrl?: string;
    }): Promise<any>;
    static sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void>;
    static createBatch(notifications: any[]): Promise<void>;
    static markAsRead(userId: string, notificationIds: string[]): Promise<void>;
    static cleanupOldNotifications(days?: number): Promise<void>;
}
//# sourceMappingURL=notification.service.d.ts.map