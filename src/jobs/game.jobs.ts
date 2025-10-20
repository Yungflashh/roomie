import Queue from 'bull';
import { GameSession, UserGameStats } from '../models';
import { logger } from '../utils/logger';

// Bull Queue with proper Redis auth
const gameQueue = new Queue('game-processing', {
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
  logger.error('Game queue error:', error);
});

gameQueue.on('failed', (job, err) => {
  logger.error(`Game job ${job.id} failed:`, err);
});

gameQueue.on('completed', (job) => {
  logger.info(`Game job ${job.id} completed`);
});

// Process session completion
gameQueue.process('complete-session', async (job) => {
  try {
    const { sessionId } = job.data;

    const session = await GameSession.findById(sessionId).populate('game');

    if (!session) {
      logger.warn(`Session ${sessionId} not found`);
      return;
    }

    // Calculate final scores and update leaderboards
    const participants = session.participants;

    for (const participant of participants) {
      // Update user stats
      let userStats: any = await UserGameStats.findOne({ user: participant.user });

      if (!userStats) {
        userStats = await UserGameStats.create({
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
        logger.info(`User ${participant.user} leveled up to ${userStats.level}`);
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
      const daysDiff = Math.floor(
        (today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day
        userStats.streaks.current = (userStats.streaks.current || 0) + 1;
        if (userStats.streaks.current > (userStats.streaks.longest || 0)) {
          userStats.streaks.longest = userStats.streaks.current;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        userStats.streaks.current = 1;
      }

      userStats.streaks.lastPlayedDate = today;

      await userStats.save();

      // Check for achievements
      await checkAchievements(participant.user.toString(), userStats);
    }

    logger.info(`Completed session ${sessionId}`);
  } catch (error) {
    logger.error('Error completing session:', error);
    throw error;
  }
});

// Process leaderboard updates
gameQueue.process('update-leaderboard', async (job) => {
  try {
    const { gameId, period } = job.data;

    logger.info(`Updating ${period} leaderboard for game ${gameId || 'all'}`);

    // This is a placeholder - leaderboards are calculated on-demand

  } catch (error) {
    logger.error('Error updating leaderboard:', error);
    throw error;
  }
});

// Check and award achievements
async function checkAchievements(userId: string, stats: any): Promise<void> {
  const achievements = [
    {
      id: 'first_game',
      name: 'First Steps',
      condition: () => (stats.totalGamesPlayed || 0) >= 1,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'first_game'),
    },
    {
      id: 'game_master',
      name: 'Game Master',
      condition: () => (stats.totalGamesPlayed || 0) >= 100,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'game_master'),
    },
    {
      id: 'winner',
      name: 'Winner',
      condition: () => (stats.totalGamesWon || 0) >= 1,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'winner'),
    },
    {
      id: 'champion',
      name: 'Champion',
      condition: () => (stats.totalGamesWon || 0) >= 50,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'champion'),
    },
    {
      id: 'streak_5',
      name: '5-Day Streak',
      condition: () => (stats.streaks?.current || 0) >= 5,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'streak_5'),
    },
    {
      id: 'level_10',
      name: 'Level 10',
      condition: () => (stats.level || 1) >= 10,
      alreadyHas: () => stats.achievements.some((a: any) => a.achievementId === 'level_10'),
    },
  ];

  const newAchievements = achievements.filter(
    (achievement) => achievement.condition() && !achievement.alreadyHas()
  );

  if (newAchievements.length > 0) {
    const achievementDetails = newAchievements.map((achievement) => ({
      achievementId: achievement.id,
      unlockedAt: new Date(),
      game: null,
    }));

    stats.achievements.push(...achievementDetails);
    await stats.save();

    logger.info(`User ${userId} unlocked ${newAchievements.length} new achievements`);
  }
}

// Schedule session completion
export const scheduleSessionCompletion = async (sessionId: string): Promise<void> => {
  await gameQueue.add(
    'complete-session',
    { sessionId },
    {
      jobId: `complete-session-${sessionId}`,
    }
  );

  logger.info(`Scheduled session completion for ${sessionId}`);
};

// Schedule leaderboard update
export const scheduleLeaderboardUpdate = async (
  gameId?: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<void> => {
  await gameQueue.add(
    'update-leaderboard',
    { gameId, period },
    {
      jobId: `update-leaderboard-${gameId || 'global'}-${period}-${Date.now()}`,
    }
  );

  logger.info(`Scheduled leaderboard update for ${gameId || 'all games'} (${period})`);
};

// Set up recurring leaderboard updates
const setupRecurringJobs = async (): Promise<void> => {
  try {
    // Daily leaderboard update at midnight
    await gameQueue.add(
      'update-leaderboard',
      { period: 'daily' },
      {
        repeat: {
          cron: '0 0 * * *',
        },
        jobId: 'daily-leaderboard-update',
      }
    );

    // Weekly leaderboard update on Monday at midnight
    await gameQueue.add(
      'update-leaderboard',
      { period: 'weekly' },
      {
        repeat: {
          cron: '0 0 * * 1',
        },
        jobId: 'weekly-leaderboard-update',
      }
    );

    logger.info('Recurring leaderboard jobs scheduled');
  } catch (error) {
    logger.error('Error setting up recurring game jobs:', error);
  }
};

// Initialize recurring jobs
setupRecurringJobs();

// Clean up old jobs
gameQueue.clean(24 * 60 * 60 * 1000, 'completed');
gameQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

logger.info('Game jobs scheduled');

export default gameQueue;