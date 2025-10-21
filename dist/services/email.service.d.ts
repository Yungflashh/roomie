interface EmailOptions {
    to: string;
    subject: string;
    template: string;
    data: any;
}
declare class EmailTemplateService {
    private transporter;
    private baseUrl;
    constructor();
    private compileTemplate;
    sendEmail(options: EmailOptions): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendMatchEmail(email: string, firstName: string, matchData: {
        matchName: string;
        compatibilityScore: number;
        budgetRange: string;
        sharedInterests: string;
        matchId: string;
    }): Promise<void>;
    sendPaymentReceipt(email: string, firstName: string, paymentData: {
        description: string;
        amount: number;
        currency: string;
        transactionId: string;
        date: string;
        paymentMethod: string;
        receiptUrl: string;
    }): Promise<void>;
    sendDailyDigest(email: string, firstName: string, digestData: {
        newMatches: number;
        unreadMessages: number;
        profileViews: number;
        hasNewMatches: boolean;
        hasUnreadMessages: boolean;
    }): Promise<void>;
    sendVerificationEmail(email: string, token: string, firstName: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void>;
}
export declare const emailTemplateService: EmailTemplateService;
export {};
//# sourceMappingURL=email.service.d.ts.map