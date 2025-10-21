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
const AnalyticsEventSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    eventType: {
        type: String,
        required: true,
        index: true,
    },
    eventCategory: {
        type: String,
        enum: ['user', 'profile', 'match', 'chat', 'game', 'payment', 'page_view'],
        required: true,
        index: true,
    },
    eventName: {
        type: String,
        required: true,
        index: true,
    },
    properties: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    device: {
        type: {
            type: String,
        },
        browser: String,
        os: String,
        userAgent: String,
    },
    location: {
        country: String,
        region: String,
        city: String,
        timezone: String,
    },
    page: {
        url: String,
        referrer: String,
        title: String,
    },
}, {
    timestamps: true,
});
// Indexes
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventCategory: 1, eventName: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
// TTL index - automatically delete events older than 90 days
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
const AnalyticsEvent = mongoose_1.default.model('AnalyticsEvent', AnalyticsEventSchema);
exports.default = AnalyticsEvent;
//# sourceMappingURL=Analytics.model.js.map