import { Response } from 'express';
export declare class AuthController {
    static register: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static login: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static refreshToken: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static logout: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static logoutAll: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static verifyEmail: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static resendVerificationEmail: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static forgotPassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static resetPassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static changePassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMe: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateMe: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteAccount: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=auth.controller.d.ts.map