"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
class GameController {
}
exports.GameController = GameController;
_a = GameController;
// Get all available games
GameController.getGames = (0, catchAsync_1.default)(async (req, res) => {
    const { category, difficulty, type } = req.query;
    const query = { isActive: true };
    if (category) {
        query.category = category;
    }
    if (difficulty) {
        query.difficulty = difficulty;
    }
    if (type) {
        query.type = type;
    }
    const games = await models_1.Game.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
    apiResponse_1.ApiResponse.success(res, { games, total: games.length }, 'Games retrieved successfully');
});
// Get game by ID
GameController.getGameById = (0, catchAsync_1.default)(async (req, res) => {
    const { gameId } = req.params;
    const game = await models_1.Game.findById(gameId).populate('createdBy', 'firstName lastName');
    if (!game) {
        throw new ApiError_1.default(404, 'Game not found');
    }
    if (!game.isActive) {
        throw new ApiError_1.default(400, 'This game is currently unavailable');
    }
    apiResponse_1.ApiResponse.success(res, { game }, 'Game retrieved successfully');
});
// Create game (Admin only)
GameController.createGame = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { title, description, category, difficulty, type, thumbnail, duration, maxPlayers, minPlayers, rules, questions, achievements, } = req.body;
    const game = await models_1.Game.create({
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
    apiResponse_1.ApiResponse.created(res, { game }, 'Game created successfully');
});
// Update game (Admin only)
GameController.updateGame = (0, catchAsync_1.default)(async (req, res) => {
    const { gameId } = req.params;
    const game = await models_1.Game.findByIdAndUpdate(gameId, req.body, {
        new: true,
        runValidators: true,
    });
    if (!game) {
        throw new ApiError_1.default(404, 'Game not found');
    }
    apiResponse_1.ApiResponse.success(res, { game }, 'Game updated successfully');
});
// Delete game (Admin only)
GameController.deleteGame = (0, catchAsync_1.default)(async (req, res) => {
    const { gameId } = req.params;
    const game = await models_1.Game.findByIdAndDelete(gameId);
    if (!game) {
        throw new ApiError_1.default(404, 'Game not found');
    }
    apiResponse_1.ApiResponse.success(res, null, 'Game deleted successfully');
});
// Get daily challenge
GameController.getDailyChallenge = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Find today's daily game
    const dailyGame = await models_1.Game.findOne({ type: 'daily', isActive: true });
    if (!dailyGame) {
        throw new ApiError_1.default(404, 'No daily challenge available');
    }
    // Check if user already played today
    const userStats = await models_1.UserGameStats.findOne({ user: userId });
    let alreadyPlayed = false;
    if (userStats && userStats.dailyStreak.lastPlayedDate) {
        const today = new Date().toDateString();
        const lastPlayed = userStats.dailyStreak.lastPlayedDate.toDateString();
        alreadyPlayed = today === lastPlayed;
    }
    apiResponse_1.ApiResponse.success(res, {
        game: dailyGame,
        alreadyPlayed,
        currentStreak: userStats?.dailyStreak.current || 0,
    }, 'Daily challenge retrieved successfully');
});
// Get weekly challenge
GameController.getWeeklyChallenge = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Find this week's challenge
    const weeklyGame = await models_1.Game.findOne({ type: 'weekly', isActive: true });
    if (!weeklyGame) {
        throw new ApiError_1.default(404, 'No weekly challenge available');
    }
    // Get current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    // Check if user already played this week
    const userStats = await models_1.UserGameStats.findOne({ user: userId });
    const alreadyPlayed = userStats?.weeklyChallenge.currentWeek === weekNumber;
    apiResponse_1.ApiResponse.success(res, {
        game: weeklyGame,
        alreadyPlayed,
        weekNumber,
        score: userStats?.weeklyChallenge.score || 0,
        rank: userStats?.weeklyChallenge.rank,
    }, 'Weekly challenge retrieved successfully');
});
// Get game categories
GameController.getCategories = (0, catchAsync_1.default)(async (req, res) => {
    const categories = await models_1.Game.distinct('category', { isActive: true });
    apiResponse_1.ApiResponse.success(res, { categories }, 'Categories retrieved successfully');
});
// Get popular games
GameController.getPopularGames = (0, catchAsync_1.default)(async (req, res) => {
    const { limit = 10 } = req.query;
    // Get games with most sessions
    const popularGames = await models_1.GameSession.aggregate([
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
    apiResponse_1.ApiResponse.success(res, { games: popularGames }, 'Popular games retrieved successfully');
});
//# sourceMappingURL=game.controller.js.map