import mongoose, { Document, Model } from 'mongoose';
import { PaymentStatus } from '../types';
export interface IPayment extends Document {
    user: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: 'card' | 'bank_transfer' | 'wallet';
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    description: string;
    type: 'subscription' | 'verification' | 'background_check' | 'feature' | 'premium';
    relatedSubscription?: mongoose.Types.ObjectId;
    metadata?: {
        feature?: string;
        duration?: number;
    };
    receipt?: string;
    refundedAmount?: number;
    refundedAt?: Date;
    refundReason?: string;
    failureReason?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Payment: Model<IPayment>;
export default Payment;
//# sourceMappingURL=Payment.model.d.ts.map