import { Request, Response } from 'express';
export declare class WebhookController {
    static handleStripeWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=webhook.controller.d.ts.map