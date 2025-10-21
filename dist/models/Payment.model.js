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
const types_1 = require("../types");
const PaymentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(types_1.PaymentStatus),
        default: types_1.PaymentStatus.PENDING,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Indexes
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
const Payment = mongoose_1.default.model('Payment', PaymentSchema);
exports.default = Payment;
//# sourceMappingURL=Payment.model.js.map