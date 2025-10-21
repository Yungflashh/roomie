import { Response } from 'express';
export declare class AdminController {
    static getDashboardStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUsers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUserById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static toggleUserBlock: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getReports: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getSystemHealth: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=admin.controller.d.ts.map