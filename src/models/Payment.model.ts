import mongoose, { Document, Schema, Model } from 'mongoose';
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

const PaymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet'],
      required: true,
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['subscription', 'verification', 'background_check', 'feature', 'premium'],
      required: true,
    },
    relatedSubscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    metadata: {
      feature: String,
      duration: Number,
    },
    receipt: String,
    refundedAmount: Number,
    refundedAt: Date,
    refundReason: String,
    failureReason: String,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;