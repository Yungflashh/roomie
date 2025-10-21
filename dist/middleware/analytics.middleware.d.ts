import { Request, Response, NextFunction } from 'express';
export declare const trackPageView: (req: Request, res: Response, next: NextFunction) => void;
export declare const trackEvent: (eventCategory: string, eventName: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=analytics.middleware.d.ts.map