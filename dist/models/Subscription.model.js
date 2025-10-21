"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SubscriptionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Payment',
        }],
    autoRenew: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
const Subscription = mongoose_1.default.model('Subscription', SubscriptionSchema);
exports.default = Subscription;
//# sourceMappingURL=Subscription.model.js.map