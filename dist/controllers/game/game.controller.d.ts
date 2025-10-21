import { Response } from 'express';
export declare class GameController {
    static getGames: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getGameById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static createGame: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateGame: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteGame: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getDailyChallenge: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getWeeklyChallenge: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getCategories: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPopularGames: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=game.controller.d.ts.map