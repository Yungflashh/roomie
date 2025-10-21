"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatsController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
class UserStatsController {
}
exports.UserStatsController = UserStatsController;
_a = UserStatsController;
// Get own stats
UserStatsController.getMyStats = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    let userStats = await models_1.UserGameStats.findOne({ user: userId })
        .populate('gameHistory.game')
        .populate('favoriteGames');
    if (!userStats) {
        // Create default stats
        userStats = await models_1.UserGameStats.create({
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
    apiResponse_1.ApiResponse.success(res, { stats: userStats }, 'Stats retrieved successfully');
});
// Get user stats by ID
UserStatsController.getUserStats = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const userStats = await models_1.UserGameStats.findOne({ user: userId })
        .populate('favoriteGames')
        .select('-gameHistory'); // Don't expose full history
    if (!userStats) {
        throw new ApiError_1.default(404, 'User stats not found');
    }
    apiResponse_1.ApiResponse.success(res, { stats: userStats }, 'Stats retrieved successfully');
});
// Get global leaderboard
UserStatsController.getGlobalLeaderboard = (0, catchAsync_1.default)(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const leaderboard = await models_1.UserGameStats.find()
        .populate('user', 'firstName lastName profilePicture')
        .sort({ 'stats.totalPoints': -1, 'stats.gamesWon': -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('user stats level experiencePoints');
    const total = await models_1.UserGameStats.countDocuments();
    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
        ...entry.toObject(),
        rank: skip + index + 1,
    }));
    apiResponse_1.ApiResponse.paginated(res, rankedLeaderboard, Number(page), Number(limit), total, 'Leaderboard retrieved successfully');
});
// Get weekly leaderboard
UserStatsController.getWeeklyLeaderboard = (0, catchAsync_1.default)(async (req, res) => {
    const { limit = 50 } = req.query;
    // Get current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const leaderboard = await models_1.UserGameStats.find({
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
    apiResponse_1.ApiResponse.success(res, { leaderboard: rankedLeaderboard, weekNumber }, 'Weekly leaderboard retrieved successfully');
});
// Get category leaderboard
UserStatsController.getCategoryLeaderboard = (0, catchAsync_1.default)(async (req, res) => {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    // Calculate category scores
    const leaderboard = await models_1.GameSession.aggregate([
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
    apiResponse_1.ApiResponse.success(res, { leaderboard: rankedLeaderboard, category }, 'Category leaderboard retrieved successfully');
});
// Get achievements
UserStatsController.getAchievements = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const userStats = await models_1.UserGameStats.findOne({ user: userId });
    if (!userStats) {
        throw new ApiError_1.default(404, 'User stats not found');
    }
    apiResponse_1.ApiResponse.success(res, { achievements: userStats.achievements }, 'Achievements retrieved successfully');
});
// Add game to favorites
UserStatsController.addFavoriteGame = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { gameId } = req.params;
    const userStats = await models_1.UserGameStats.findOne({ user: userId });
    if (!userStats) {
        throw new ApiError_1.default(404, 'User stats not found');
    }
    if (userStats.favoriteGames.includes(gameId)) {
        throw new ApiError_1.default(400, 'Game already in favorites');
    }
    if (userStats.favoriteGames.length >= 10) {
        throw new ApiError_1.default(400, 'Maximum 10 favorite games allowed');
    }
    userStats.favoriteGames.push(gameId);
    await userStats.save();
    await userStats.populate('favoriteGames');
    apiResponse_1.ApiResponse.success(res, { favoriteGames: userStats.favoriteGames }, 'Game added to favorites');
});
// Remove game from favorites
UserStatsController.removeFavoriteGame = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { gameId } = req.params;
    const userStats = await models_1.UserGameStats.findOne({ user: userId });
    if (!userStats) {
        throw new ApiError_1.default(404, 'User stats not found');
    }
    userStats.favoriteGames = userStats.favoriteGames.filter((id) => id.toString() !== gameId);
    await userStats.save();
    await userStats.populate('favoriteGames');
    apiResponse_1.ApiResponse.success(res, { favoriteGames: userStats.favoriteGames }, 'Game removed from favorites');
});
//# sourceMappingURL=userStats.controller.js.map