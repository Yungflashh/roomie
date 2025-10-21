import { ValidationChain } from 'express-validator';
export declare class PhoneValidator {
    static sendVerificationCode(): ValidationChain[];
    static verifyPhoneNumber(): ValidationChain[];
    static sendLoginOTP(): ValidationChain[];
    static verifyLoginOTP(): ValidationChain[];
}
//# sourceMappingURL=phone.validator.d.ts.map