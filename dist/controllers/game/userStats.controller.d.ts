import { Response } from 'express';
export declare class UserStatsController {
    static getMyStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUserStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getGlobalLeaderboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getWeeklyLeaderboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getCategoryLeaderboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getAchievements: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static addFavoriteGame: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static removeFavoriteGame: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=userStats.controller.d.ts.map