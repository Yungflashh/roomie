import mongoose, { Document, Model } from 'mongoose';
export interface ISubscription extends Document {
    user: mongoose.Types.ObjectId;
    plan: 'basic' | 'premium' | 'pro';
    status: 'active' | 'cancelled' | 'expired' | 'paused';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: Date;
    cancelReason?: string;
    pausedAt?: Date;
    resumeAt?: Date;
    trialEnd?: Date;
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
    billingHistory: mongoose.Types.ObjectId[];
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Subscription: Model<ISubscription>;
export default Subscription;
//# sourceMappingURL=Subscription.model.d.ts.map