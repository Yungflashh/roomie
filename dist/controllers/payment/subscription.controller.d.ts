import { Response } from 'express';
export declare class SubscriptionController {
    static getPlans: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getCurrentSubscription: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static createCheckoutSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static cancelSubscription: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static reactivateSubscription: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateSubscription: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getCustomerPortal: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static checkFeatureAccess: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=subscription.controller.d.ts.map