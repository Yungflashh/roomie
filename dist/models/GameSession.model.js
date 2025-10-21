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
const GameSessionSchema = new mongoose_1.Schema({
    game: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
    },
    participants: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            score: {
                type: Number,
                default: 0,
            },
            answers: [{
                    questionId: String,
                    answer: String,
                    isCorrect: Boolean,
                    timeTaken: Number,
                    pointsEarned: Number,
                }],
            joinedAt: {
                type: Date,
                default: Date.now,
            },
            completedAt: Date,
            rank: Number,
        }],
    host: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
        default: 'waiting',
    },
    startedAt: Date,
    completedAt: Date,
    winner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    chatRoom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChatRoom',
    },
    isRanked: {
        type: Boolean,
        default: true,
    },
    scheduledFor: Date,
    invitedUsers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    spectators: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    replay: String,
}, {
    timestamps: true,
});
// Indexes
GameSessionSchema.index({ game: 1, status: 1 });
GameSessionSchema.index({ host: 1 });
GameSessionSchema.index({ 'participants.user': 1 });
GameSessionSchema.index({ createdAt: -1 });
const GameSession = mongoose_1.default.model('GameSession', GameSessionSchema);
exports.default = GameSession;
//# sourceMappingURL=GameSession.model.js.map