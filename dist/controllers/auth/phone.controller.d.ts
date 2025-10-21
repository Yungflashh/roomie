import { Response } from 'express';
export declare class PhoneController {
    static sendVerificationCode: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static verifyPhoneNumber: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static resendVerificationCode: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updatePhoneNumber: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    private static sendManualOTP;
    private static verifyManualOTP;
    static sendLoginOTP: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static verifyLoginOTP: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=phone.controller.d.ts.map