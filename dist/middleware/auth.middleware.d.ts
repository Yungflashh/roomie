import { Request, Response, NextFunction, RequestHandler } from 'express';
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const restrictTo: (...roles: string[]) => RequestHandler;
export declare const requireEmailVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePhoneVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireCompleteProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireSubscription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map