"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const game_controller_1 = require("../controllers/game/game.controller");
const gameSession_controller_1 = require("../controllers/game/gameSession.controller");
const userStats_controller_1 = require("../controllers/game/userStats.controller");
const game_validator_1 = require("../validators/game.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
// ========== GAME MANAGEMENT ==========
// Public game routes
router.get('/', game_controller_1.GameController.getGames);
router.get('/:gameId', (0, validate_1.validate)(game_validator_1.GameValidator.getGameById()), game_controller_1.GameController.getGameById);
router.get('/categories/list', game_controller_1.GameController.getCategories);
router.get('/popular/list', game_controller_1.GameController.getPopularGames);
router.get('/daily/challenge', game_controller_1.GameController.getDailyChallenge);
router.get('/weekly/challenge', game_controller_1.GameController.getWeeklyChallenge);
// Admin only routes
router.post('/', (0, auth_middleware_1.restrictTo)('admin'), (0, validate_1.validate)(game_validator_1.GameValidator.createGame()), game_controller_1.GameController.createGame);
router.patch('/:gameId', (0, auth_middleware_1.restrictTo)('admin'), (0, validate_1.validate)(game_validator_1.GameValidator.updateGame()), game_controller_1.GameController.updateGame);
router.delete('/:gameId', (0, auth_middleware_1.restrictTo)('admin'), (0, validate_1.validate)(game_validator_1.GameValidator.deleteGame()), game_controller_1.GameController.deleteGame);
// ========== GAME SESSIONS ==========
router.post('/sessions/create', (0, validate_1.validate)(game_validator_1.GameSessionValidator.createSession()), gameSession_controller_1.GameSessionController.createSession);
router.get('/sessions/my', gameSession_controller_1.GameSessionController.getMySessions);
router.get('/sessions/:sessionId', (0, validate_1.validate)(game_validator_1.GameSessionValidator.joinSession()), gameSession_controller_1.GameSessionController.getSessionById);
router.post('/sessions/:sessionId/join', (0, validate_1.validate)(game_validator_1.GameSessionValidator.joinSession()), gameSession_controller_1.GameSessionController.joinSession);
router.post('/sessions/:sessionId/leave', (0, validate_1.validate)(game_validator_1.GameSessionValidator.joinSession()), gameSession_controller_1.GameSessionController.leaveSession);
router.post('/sessions/:sessionId/start', (0, validate_1.validate)(game_validator_1.GameSessionValidator.joinSession()), gameSession_controller_1.GameSessionController.startSession);
router.post('/sessions/:sessionId/answer', (0, validate_1.validate)(game_validator_1.GameSessionValidator.submitAnswer()), gameSession_controller_1.GameSessionController.submitAnswer);
router.post('/sessions/:sessionId/complete', (0, validate_1.validate)(game_validator_1.GameSessionValidator.joinSession()), gameSession_controller_1.GameSessionController.completeSession);
// ========== USER STATS & LEADERBOARDS ==========
router.get('/stats/my', userStats_controller_1.UserStatsController.getMyStats);
router.get('/stats/user/:userId', (0, validate_1.validate)(game_validator_1.UserStatsValidator.getUserStats()), userStats_controller_1.UserStatsController.getUserStats);
router.get('/leaderboard/global', userStats_controller_1.UserStatsController.getGlobalLeaderboard);
router.get('/leaderboard/weekly', userStats_controller_1.UserStatsController.getWeeklyLeaderboard);
router.get('/leaderboard/category/:category', (0, validate_1.validate)(game_validator_1.UserStatsValidator.getCategoryLeaderboard()), userStats_controller_1.UserStatsController.getCategoryLeaderboard);
router.get('/achievements/my', userStats_controller_1.UserStatsController.getAchievements);
router.post('/favorites/:gameId', (0, validate_1.validate)(game_validator_1.UserStatsValidator.manageFavorite()), userStats_controller_1.UserStatsController.addFavoriteGame);
router.delete('/favorites/:gameId', (0, validate_1.validate)(game_validator_1.UserStatsValidator.manageFavorite()), userStats_controller_1.UserStatsController.removeFavoriteGame);
exports.default = router;
//# sourceMappingURL=game.routes.js.map