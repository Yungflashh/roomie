import { ValidationChain } from 'express-validator';
export declare class PaymentValidator {
    static createPaymentIntent(): ValidationChain[];
    static requestRefund(): ValidationChain[];
    static getPaymentById(): ValidationChain[];
    static removePaymentMethod(): ValidationChain[];
}
export declare class SubscriptionValidator {
    static createCheckoutSession(): ValidationChain[];
    static cancelSubscription(): ValidationChain[];
    static updateSubscription(): ValidationChain[];
    static checkFeatureAccess(): ValidationChain[];
}
//# sourceMappingURL=payment.validator.d.ts.map