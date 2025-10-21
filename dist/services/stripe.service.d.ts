export interface SubscriptionPlan {
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: {
        unlimitedMatches: boolean;
        advancedFilters: boolean;
        seeWhoLikedYou: boolean;
        prioritySupport: boolean;
        backgroundCheck: boolean;
        videoProfile: boolean;
        incognitoMode: boolean;
        readReceipts: boolean;
        profileBoost: number;
        rewindSwipes: boolean;
    };
}
export declare const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan>;
export declare class StripeService {
    static createCustomer(userId: string, email: string, name: string): Promise<string>;
    static createPaymentIntent(amount: number, currency: string, customerId: string, metadata?: any): Promise<any>;
    static createSubscription(customerId: string, priceId: string, userId: string): Promise<any>;
    static cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<any>;
    static reactivateSubscription(subscriptionId: string): Promise<any>;
    static updateSubscription(subscriptionId: string, newPriceId: string): Promise<any>;
    static createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string>;
    static createCheckoutSession(customerId: string, priceId: string, userId: string, successUrl: string, cancelUrl: string): Promise<string>;
    static retrievePaymentIntent(paymentIntentId: string): Promise<any>;
    static listPaymentMethods(customerId: string): Promise<any[]>;
    static detachPaymentMethod(paymentMethodId: string): Promise<void>;
    static getInvoices(customerId: string, limit?: number): Promise<any[]>;
    static processOneTimePayment(userId: string, amount: number, description: string, type: 'verification' | 'background_check' | 'feature'): Promise<any>;
    static handleSuccessfulPayment(paymentIntentId: string): Promise<void>;
    static handleFailedPayment(paymentIntentId: string, failureReason: string): Promise<void>;
}
//# sourceMappingURL=stripe.service.d.ts.map