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
const MatchSchema = new mongoose_1.Schema({
    user1: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user2: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    compatibilityScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
    },
    matchedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending',
    },
    initiatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        maxlength: 500,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: Date,
    rejectedAt: Date,
    unmatchedAt: Date,
    unmatchReason: String,
    chatRoom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChatRoom',
    },
    meetingScheduled: {
        type: Boolean,
        default: false,
    },
    meetingDetails: {
        date: Date,
        location: String,
        type: {
            type: String,
            enum: ['virtual', 'in-person'],
        },
    },
    flags: {
        isReported: { type: Boolean, default: false },
        reportedBy: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        reportReason: String,
    },
}, {
    timestamps: true,
});
// Indexes
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });
MatchSchema.index({ status: 1 });
MatchSchema.index({ matchedAt: -1 });
MatchSchema.index({ expiresAt: 1 });
// Ensure user1 ID is always less than user2 ID for consistency
MatchSchema.pre('save', function (next) {
    if (this.user1.toString() > this.user2.toString()) {
        [this.user1, this.user2] = [this.user2, this.user1];
    }
    next();
});
const Match = mongoose_1.default.model('Match', MatchSchema);
exports.default = Match;
//# sourceMappingURL=Match.model.js.map