import { ValidationChain } from 'express-validator';
export declare class AuthValidator {
    static register(): ValidationChain[];
    static login(): ValidationChain[];
    static forgotPassword(): ValidationChain[];
    static resetPassword(): ValidationChain[];
    static changePassword(): ValidationChain[];
    static verifyEmail(): ValidationChain[];
    static refreshToken(): ValidationChain[];
}
//# sourceMappingURL=auth.validator.d.ts.map