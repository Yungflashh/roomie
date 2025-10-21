import mongoose, { Document, Model } from 'mongoose';
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
declare const UserGameStats: Model<IUserGameStats>;
export default UserGameStats;
//# sourceMappingURL=UserGameStats.model.d.ts.map