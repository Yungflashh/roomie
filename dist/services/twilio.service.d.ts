declare class TwilioService {
    private client;
    private verifyServiceSid;
    constructor();
    isConfigured(): boolean;
    sendVerificationCode(phoneNumber: string): Promise<void>;
    verifyCode(phoneNumber: string, code: string): Promise<boolean>;
    sendSMS(to: string, message: string): Promise<void>;
    sendOTP(phoneNumber: string, code: string): Promise<void>;
    sendMatchNotification(phoneNumber: string, matchName: string): Promise<void>;
    sendSOSAlert(phoneNumber: string, userName: string, location?: string): Promise<void>;
    validatePhoneNumber(phoneNumber: string): boolean;
    formatPhoneNumber(phoneNumber: string, countryCode?: string): string;
}
export declare const twilioService: TwilioService;
export {};
//# sourceMappingURL=twilio.service.d.ts.map