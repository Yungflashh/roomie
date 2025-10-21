import { Response } from 'express';
export declare class PaymentController {
    static createPaymentIntent: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentHistory: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static requestRefund: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentMethods: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static removePaymentMethod: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getInvoices: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=payment.controller.d.ts.map