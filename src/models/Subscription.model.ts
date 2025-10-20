import mongoose, { Document, Schema, Model } from 'mongoose';

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
    profileBoost: number; // times per month
    rewindSwipes: boolean;
  };
  billingHistory: mongoose.Types.ObjectId[];
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'premium', 'pro'],
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'paused'],
      default: 'active',
    },
    stripeSubscriptionId: String,
    stripeCustomerId: String,
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: Date,
    cancelReason: String,
    pausedAt: Date,
    resumeAt: Date,
    trialEnd: Date,
    features: {
      unlimitedMatches: { type: Boolean, default: false },
      advancedFilters: { type: Boolean, default: false },
      seeWhoLikedYou: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      backgroundCheck: { type: Boolean, default: false },
      videoProfile: { type: Boolean, default: false },
      incognitoMode: { type: Boolean, default: false },
      readReceipts: { type: Boolean, default: false },
      profileBoost: { type: Number, default: 0 },
      rewindSwipes: { type: Boolean, default: false },
    },
    billingHistory: [{
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    }],
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;