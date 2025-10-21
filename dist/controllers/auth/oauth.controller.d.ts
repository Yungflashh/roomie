import { Request, Response, NextFunction } from 'express';
export declare class OAuthController {
    static googleAuth: any;
    static googleCallback: any[];
    static facebookAuth: any;
    static facebookCallback: any[];
    static appleAuth: any;
    static appleCallback: any[];
    static linkSocialAccount: (req: Request, res: Response, next: NextFunction) => void;
    static unlinkSocialAccount: (req: Request, res: Response, next: NextFunction) => void;
    static getSocialAccounts: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=oauth.controller.d.ts.map