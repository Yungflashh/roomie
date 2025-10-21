import { Response } from 'express';
export declare class GameSessionController {
    static createSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static joinSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static leaveSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static startSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static submitAnswer: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static completeSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    private static updateUserStats;
    static getMySessions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=gameSession.controller.d.ts.map