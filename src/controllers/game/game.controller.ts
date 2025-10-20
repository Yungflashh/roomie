import { Response } from 'express';
import { AuthRequest } from '../../types';
import { Game, GameSession, UserGameStats, User } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import mongoose from 'mongoose';

export class GameController {
  // Get all available games
  static getGames = catchAsync(async (req: AuthRequest, res: Response) => {
    const { category, difficulty, type } = req.query;

    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (type) {
      query.type = type;
    }

    const games = await Game.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    ApiResponse.success(res, { games, total: games.length }, 'Games retrieved successfully');
  });

  // Get game by ID
  static getGameById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.params;

    const game = await Game.findById(gameId).populate('createdBy', 'firstName lastName');

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    if (!game.isActive) {
      throw new ApiError(400, 'This game is currently unavailable');
    }

    ApiResponse.success(res, { game }, 'Game retrieved successfully');
  });

  // Create game (Admin only)
  static createGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      title,
      description,
      category,
      difficulty,
      type,
      thumbnail,
      duration,
      maxPlayers,
      minPlayers,
      rules,
      questions,
      achievements,
    } = req.body;

    const game = await Game.create({
      title,
      description,
      category,
      difficulty,
      type,
      thumbnail,
      duration,
      maxPlayers,
      minPlayers,
      rules,
      questions,
      achievements,
      createdBy: userId,
    });

    ApiResponse.created(res, { game }, 'Game created successfully');
  });

  // Update game (Admin only)
  static updateGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.params;

    const game = await Game.findByIdAndUpdate(gameId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    ApiResponse.success(res, { game }, 'Game updated successfully');
  });

  // Delete game (Admin only)
  static deleteGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.params;

    const game = await Game.findByIdAndDelete(gameId);

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    ApiResponse.success(res, null, 'Game deleted successfully');
  });

  // Get daily challenge
  static getDailyChallenge = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Find today's daily game
    const dailyGame = await Game.findOne({ type: 'daily', isActive: true });

    if (!dailyGame) {
      throw new ApiError(404, 'No daily challenge available');
    }

    // Check if user already played today
    const userStats = await UserGameStats.findOne({ user: userId });
    
    let alreadyPlayed = false;
    if (userStats && userStats.dailyStreak.lastPlayedDate) {
      const today = new Date().toDateString();
      const lastPlayed = userStats.dailyStreak.lastPlayedDate.toDateString();
      alreadyPlayed = today === lastPlayed;
    }

    ApiResponse.success(
      res,
      {
        game: dailyGame,
        alreadyPlayed,
        currentStreak: userStats?.dailyStreak.current || 0,
      },
      'Daily challenge retrieved successfully'
    );
  });

  // Get weekly challenge
  static getWeeklyChallenge = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Find this week's challenge
    const weeklyGame = await Game.findOne({ type: 'weekly', isActive: true });

    if (!weeklyGame) {
      throw new ApiError(404, 'No weekly challenge available');
    }

    // Get current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    // Check if user already played this week
    const userStats = await UserGameStats.findOne({ user: userId });
    
    const alreadyPlayed = userStats?.weeklyChallenge.currentWeek === weekNumber;

    ApiResponse.success(
      res,
      {
        game: weeklyGame,
        alreadyPlayed,
        weekNumber,
        score: userStats?.weeklyChallenge.score || 0,
        rank: userStats?.weeklyChallenge.rank,
      },
      'Weekly challenge retrieved successfully'
    );
  });

  // Get game categories
  static getCategories = catchAsync(async (req: AuthRequest, res: Response) => {
    const categories = await Game.distinct('category', { isActive: true });

    ApiResponse.success(res, { categories }, 'Categories retrieved successfully');
  });

  // Get popular games
  static getPopularGames = catchAsync(async (req: AuthRequest, res: Response) => {
    const { limit = 10 } = req.query;

    // Get games with most sessions
    const popularGames = await GameSession.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$game',
          sessionCount: { $sum: 1 },
          avgPlayers: { $avg: { $size: '$participants' } },
        },
      },
      { $sort: { sessionCount: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: '_id',
          as: 'gameDetails',
        },
      },
      { $unwind: '$gameDetails' },
    ]);

    ApiResponse.success(
      res,
      { games: popularGames },
      'Popular games retrieved successfully'
    );
  });
}