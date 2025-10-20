import { Response } from 'express';
import { AuthRequest } from '../../types';
import { UserGameStats, GameSession } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';

export class UserStatsController {
  // Get own stats
  static getMyStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    let userStats = await UserGameStats.findOne({ user: userId })
      .populate('gameHistory.game')
      .populate('favoriteGames');

    if (!userStats) {
      // Create default stats
      userStats = await UserGameStats.create({
        user: userId,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalPoints: 0,
          achievements: [],
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    ApiResponse.success(res, { stats: userStats }, 'Stats retrieved successfully');
  });

  // Get user stats by ID
  static getUserStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    const userStats = await UserGameStats.findOne({ user: userId })
      .populate('favoriteGames')
      .select('-gameHistory'); // Don't expose full history

    if (!userStats) {
      throw new ApiError(404, 'User stats not found');
    }

    ApiResponse.success(res, { stats: userStats }, 'Stats retrieved successfully');
  });

  // Get global leaderboard
  static getGlobalLeaderboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const leaderboard = await UserGameStats.find()
      .populate('user', 'firstName lastName profilePicture')
      .sort({ 'stats.totalPoints': -1, 'stats.gamesWon': -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('user stats level experiencePoints');

    const total = await UserGameStats.countDocuments();

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: skip + index + 1,
    }));

    ApiResponse.paginated(
      res,
      rankedLeaderboard,
      Number(page),
      Number(limit),
      total,
      'Leaderboard retrieved successfully'
    );
  });

  // Get weekly leaderboard
  static getWeeklyLeaderboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { limit = 50 } = req.query;

    // Get current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    const leaderboard = await UserGameStats.find({
      'weeklyChallenge.currentWeek': weekNumber,
      'weeklyChallenge.completed': true,
    })
      .populate('user', 'firstName lastName profilePicture')
      .sort({ 'weeklyChallenge.score': -1 })
      .limit(Number(limit))
      .select('user weeklyChallenge level');

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      user: entry.user,
      score: entry.weeklyChallenge.score,
      level: entry.level,
      rank: index + 1,
    }));

    ApiResponse.success(
      res,
      { leaderboard: rankedLeaderboard, weekNumber },
      'Weekly leaderboard retrieved successfully'
    );
  });

  // Get category leaderboard
  static getCategoryLeaderboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    // Calculate category scores
    const leaderboard = await GameSession.aggregate([
      {
        $lookup: {
          from: 'games',
          localField: 'game',
          foreignField: '_id',
          as: 'gameDetails',
        },
      },
      { $unwind: '$gameDetails' },
      { $match: { 'gameDetails.category': category, status: 'completed' } },
      { $unwind: '$participants' },
      {
        $group: {
          _id: '$participants.user',
          totalScore: { $sum: '$participants.score' },
          gamesPlayed: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          user: {
            _id: '$userDetails._id',
            firstName: '$userDetails.firstName',
            lastName: '$userDetails.lastName',
            profilePicture: '$userDetails.profilePicture',
          },
          totalScore: 1,
          gamesPlayed: 1,
        },
      },
    ]);

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    ApiResponse.success(
      res,
      { leaderboard: rankedLeaderboard, category },
      'Category leaderboard retrieved successfully'
    );
  });

  // Get achievements
  static getAchievements = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const userStats = await UserGameStats.findOne({ user: userId });

    if (!userStats) {
      throw new ApiError(404, 'User stats not found');
    }

ApiResponse.success(
      res,
      { achievements: userStats.achievements },
      'Achievements retrieved successfully'
    );
  });

  // Add game to favorites
  static addFavoriteGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { gameId } = req.params;

    const userStats = await UserGameStats.findOne({ user: userId });

    if (!userStats) {
      throw new ApiError(404, 'User stats not found');
    }

    if (userStats.favoriteGames.includes(gameId as any)) {
      throw new ApiError(400, 'Game already in favorites');
    }

    if (userStats.favoriteGames.length >= 10) {
      throw new ApiError(400, 'Maximum 10 favorite games allowed');
    }

    userStats.favoriteGames.push(gameId as any);
    await userStats.save();

    await userStats.populate('favoriteGames');

    ApiResponse.success(
      res,
      { favoriteGames: userStats.favoriteGames },
      'Game added to favorites'
    );
  });

  // Remove game from favorites
  static removeFavoriteGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { gameId } = req.params;

    const userStats = await UserGameStats.findOne({ user: userId });

    if (!userStats) {
      throw new ApiError(404, 'User stats not found');
    }

    userStats.favoriteGames = userStats.favoriteGames.filter(
      (id) => id.toString() !== gameId
    );
    await userStats.save();

    await userStats.populate('favoriteGames');

    ApiResponse.success(
      res,
      { favoriteGames: userStats.favoriteGames },
      'Game removed from favorites'
    );
  });
}