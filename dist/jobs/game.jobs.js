"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleLeaderboardUpdate = exports.scheduleSessionCompletion = void 0;
const bull_1 = __importDefault(require("bull"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Bull Queue with proper Redis auth
const gameQueue = new bull_1.default('game-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
// Error handling
gameQueue.on('error', (error) => {
    logger_1.logger.error('Game queue error:', error);
});
gameQueue.on('failed', (job, err) => {
    logger_1.logger.error(`Game job ${job.id} failed:`, err);
});
gameQueue.on('completed', (job) => {
    logger_1.logger.info(`Game job ${job.id} completed`);
});
// Process session completion
gameQueue.process('complete-session', async (job) => {
    try {
        const { sessionId } = job.data;
        const session = await models_1.GameSession.findById(sessionId).populate('game');
        if (!session) {
            logger_1.logger.warn(`Session ${sessionId} not found`);
            return;
        }
        // Calculate final scores and update leaderboards
        const participants = session.participants;
        for (const participant of participants) {
            // Update user stats
            let userStats = await models_1.UserGameStats.findOne({ user: participant.user });
            if (!userStats) {
                userStats = await models_1.UserGameStats.create({
                    user: participant.user,
                    totalGamesPlayed: 0,
                    totalGamesWon: 0,
                    totalScore: 0,
                    achievements: [],
                    favoriteGames: [],
                    streaks: {
                        current: 0,
                        longest: 0,
                        lastPlayedDate: new Date(),
                    },
                    level: 1,
                    experiencePoints: 0,
                });
            }
            // Update stats
            userStats.totalGamesPlayed = (userStats.totalGamesPlayed || 0) + 1;
            userStats.totalScore = (userStats.totalScore || 0) + participant.score;
            // Check if won
            const maxScore = Math.max(...participants.map((p) => p.score));
            if (participant.score === maxScore) {
                userStats.totalGamesWon = (userStats.totalGamesWon || 0) + 1;
            }
            // Update experience
            const expGained = Math.floor(participant.score / 10);
            userStats.experiencePoints = (userStats.experiencePoints || 0) + expGained;
            // Level up logic
            const levelThreshold = (userStats.level || 1) * 1000;
            if (userStats.experiencePoints >= levelThreshold) {
                userStats.level = (userStats.level || 1) + 1;
                logger_1.logger.info(`User ${participant.user} leveled up to ${userStats.level}`);
            }
            // Update streak
            if (!userStats.streaks) {
                userStats.streaks = {
                    current: 0,
                    longest: 0,
                    lastPlayedDate: new Date(),
                };
            }
            const lastPlayed = new Date(userStats.streaks.lastPlayedDate);
            const today = new Date();
            const daysDiff = Math.floor((today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
                // Consecutive day
                userStats.streaks.current = (userStats.streaks.current || 0) + 1;
                if (userStats.streaks.current > (userStats.streaks.longest || 0)) {
                    userStats.streaks.longest = userStats.streaks.current;
                }
            }
            else if (daysDiff > 1) {
                // Streak broken
                userStats.streaks.current = 1;
            }
            userStats.streaks.lastPlayedDate = today;
            await userStats.save();
            // Check for achievements
            await checkAchievements(participant.user.toString(), userStats);
        }
        logger_1.logger.info(`Completed session ${sessionId}`);
    }
    catch (error) {
        logger_1.logger.error('Error completing session:', error);
        throw error;
    }
});
// Process leaderboard updates
gameQueue.process('update-leaderboard', async (job) => {
    try {
        const { gameId, period } = job.data;
        logger_1.logger.info(`Updating ${period} leaderboard for game ${gameId || 'all'}`);
        // This is a placeholder - leaderboards are calculated on-demand
    }
    catch (error) {
        logger_1.logger.error('Error updating leaderboard:', error);
        throw error;
    }
});
// Check and award achievements
async function checkAchievements(userId, stats) {
    const achievements = [
        {
            id: 'first_game',
            name: 'First Steps',
            condition: () => (stats.totalGamesPlayed || 0) >= 1,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'first_game'),
        },
        {
            id: 'game_master',
            name: 'Game Master',
            condition: () => (stats.totalGamesPlayed || 0) >= 100,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'game_master'),
        },
        {
            id: 'winner',
            name: 'Winner',
            condition: () => (stats.totalGamesWon || 0) >= 1,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'winner'),
        },
        {
            id: 'champion',
            name: 'Champion',
            condition: () => (stats.totalGamesWon || 0) >= 50,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'champion'),
        },
        {
            id: 'streak_5',
            name: '5-Day Streak',
            condition: () => (stats.streaks?.current || 0) >= 5,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'streak_5'),
        },
        {
            id: 'level_10',
            name: 'Level 10',
            condition: () => (stats.level || 1) >= 10,
            alreadyHas: () => stats.achievements.some((a) => a.achievementId === 'level_10'),
        },
    ];
    const newAchievements = achievements.filter((achievement) => achievement.condition() && !achievement.alreadyHas());
    if (newAchievements.length > 0) {
        const achievementDetails = newAchievements.map((achievement) => ({
            achievementId: achievement.id,
            unlockedAt: new Date(),
            game: null,
        }));
        stats.achievements.push(...achievementDetails);
        await stats.save();
        logger_1.logger.info(`User ${userId} unlocked ${newAchievements.length} new achievements`);
    }
}
// Schedule session completion
const scheduleSessionCompletion = async (sessionId) => {
    await gameQueue.add('complete-session', { sessionId }, {
        jobId: `complete-session-${sessionId}`,
    });
    logger_1.logger.info(`Scheduled session completion for ${sessionId}`);
};
exports.scheduleSessionCompletion = scheduleSessionCompletion;
// Schedule leaderboard update
const scheduleLeaderboardUpdate = async (gameId, period = 'daily') => {
    await gameQueue.add('update-leaderboard', { gameId, period }, {
        jobId: `update-leaderboard-${gameId || 'global'}-${period}-${Date.now()}`,
    });
    logger_1.logger.info(`Scheduled leaderboard update for ${gameId || 'all games'} (${period})`);
};
exports.scheduleLeaderboardUpdate = scheduleLeaderboardUpdate;
// Set up recurring leaderboard updates
const setupRecurringJobs = async () => {
    try {
        // Daily leaderboard update at midnight
        await gameQueue.add('update-leaderboard', { period: 'daily' }, {
            repeat: {
                cron: '0 0 * * *',
            },
            jobId: 'daily-leaderboard-update',
        });
        // Weekly leaderboard update on Monday at midnight
        await gameQueue.add('update-leaderboard', { period: 'weekly' }, {
            repeat: {
                cron: '0 0 * * 1',
            },
            jobId: 'weekly-leaderboard-update',
        });
        logger_1.logger.info('Recurring leaderboard jobs scheduled');
    }
    catch (error) {
        logger_1.logger.error('Error setting up recurring game jobs:', error);
    }
};
// Initialize recurring jobs
setupRecurringJobs();
// Clean up old jobs
gameQueue.clean(24 * 60 * 60 * 1000, 'completed');
gameQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
logger_1.logger.info('Game jobs scheduled');
exports.default = gameQueue;
//# sourceMappingURL=game.jobs.js.map