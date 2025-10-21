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
const UserGameStatsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        gamesWon: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        achievements: [String],
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
    },
    gameHistory: [{
            game: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Game',
            },
            session: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'GameSession',
            },
            score: Number,
            rank: Number,
            playedAt: Date,
            duration: Number,
        }],
    weeklyChallenge: {
        currentWeek: Number,
        completed: { type: Boolean, default: false },
        score: { type: Number, default: 0 },
        rank: Number,
    },
    dailyStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastPlayedDate: Date,
    },
    leaderboard: {
        globalRank: Number,
        weeklyRank: Number,
        categoryRanks: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    achievements: [{
            achievementId: String,
            unlockedAt: Date,
            game: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Game',
            },
        }],
    favoriteGames: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Game',
        }],
    level: {
        type: Number,
        default: 1,
    },
    experiencePoints: {
        type: Number,
        default: 0,
    },
    nextLevelXP: {
        type: Number,
        default: 100,
    },
}, {
    timestamps: true,
});
// Indexes
UserGameStatsSchema.index({ user: 1 });
UserGameStatsSchema.index({ 'stats.totalPoints': -1 });
UserGameStatsSchema.index({ level: -1 });
UserGameStatsSchema.index({ 'leaderboard.globalRank': 1 });
// Calculate level progression
UserGameStatsSchema.pre('save', function (next) {
    if (this.isModified('experiencePoints')) {
        // Level up formula: XP needed = 100 * (level ^ 1.5)
        while (this.experiencePoints >= this.nextLevelXP) {
            this.level++;
            this.nextLevelXP = Math.floor(100 * Math.pow(this.level, 1.5));
        }
    }
    next();
});
const UserGameStats = mongoose_1.default.model('UserGameStats', UserGameStatsSchema);
exports.default = UserGameStats;
//# sourceMappingURL=UserGameStats.model.js.map