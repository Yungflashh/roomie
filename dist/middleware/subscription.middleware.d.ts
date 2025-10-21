import { Response, NextFunction } from 'express';
export declare const requireSubscription: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const requirePremiumOrPro: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const requirePro: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const requireFeature: (featureName: string) => (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const attachSubscription: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=subscription.middleware.d.ts.map