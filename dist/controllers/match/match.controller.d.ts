import { Response } from 'express';
export declare class MatchController {
    static getPotentialMatches: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static likeProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static dislikeProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMatches: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMatchById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static acceptMatch: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static rejectMatch: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static unmatch: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static reportMatch: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static scheduleMeeting: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getWhoLikedMe: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMatchStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=match.controller.d.ts.map