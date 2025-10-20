import mongoose, { Document, Schema, Model } from 'mongoose';
import { GameStats } from '../types';

export interface IUserGameStats extends Document {
  user: mongoose.Types.ObjectId;
  stats: GameStats;
  gameHistory: Array<{
    game: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    score: number;
    rank: number;
    playedAt: Date;
    duration: number;
  }>;
  weeklyChallenge: {
    currentWeek: number;
    completed: boolean;
    score: number;
    rank?: number;
  };
  dailyStreak: {
    current: number;
    longest: number;
    lastPlayedDate: Date;
  };
  leaderboard: {
    globalRank?: number;
    weeklyRank?: number;
    categoryRanks: Map<string, number>;
  };
  achievements: Array<{
    achievementId: string;
    unlockedAt: Date;
    game: mongoose.Types.ObjectId;
  }>;
  favoriteGames: mongoose.Types.ObjectId[];
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserGameStatsSchema = new Schema<IUserGameStats>(
  {
    user: {
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'Game',
      },
      session: {
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'Game',
      },
    }],
    favoriteGames: [{
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
UserGameStatsSchema.index({ user: 1 });
UserGameStatsSchema.index({ 'stats.totalPoints': -1 });
UserGameStatsSchema.index({ level: -1 });
UserGameStatsSchema.index({ 'leaderboard.globalRank': 1 });

// Calculate level progression
UserGameStatsSchema.pre('save', function(next) {
  if (this.isModified('experiencePoints')) {
    // Level up formula: XP needed = 100 * (level ^ 1.5)
    while (this.experiencePoints >= this.nextLevelXP) {
      this.level++;
      this.nextLevelXP = Math.floor(100 * Math.pow(this.level, 1.5));
    }
  }
  next();
});

const UserGameStats: Model<IUserGameStats> = mongoose.model<IUserGameStats>('UserGameStats', UserGameStatsSchema);

export default UserGameStats;