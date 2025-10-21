import { Response } from 'express';
export declare class NotificationController {
    static getNotifications: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markAsRead: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markAllAsRead: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteNotification: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUnreadCount: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=notification.controller.d.ts.map