import { Response } from 'express';
export declare class ChatController {
    static getChatRooms: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getOrCreateDirectChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getChatRoomById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static sendMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMessages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markAsRead: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static editMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static addReaction: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static uploadMedia: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static togglePin: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static toggleMute: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static toggleArchive: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static searchMessages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=chat.controller.d.ts.map