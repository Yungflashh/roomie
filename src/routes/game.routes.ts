import { Router } from 'express';
import { GameController } from '../controllers/game/game.controller';
import { GameSessionController } from '../controllers/game/gameSession.controller';
import { UserStatsController } from '../controllers/game/userStats.controller';
import { GameValidator, GameSessionValidator, UserStatsValidator } from '../validators/game.validator';
import { validate } from '../middleware/validate';
import { protect, requireEmailVerification, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);
router.use(requireEmailVerification);

// ========== GAME MANAGEMENT ==========
// Public game routes
router.get('/', GameController.getGames);

router.get(
  '/:gameId',
  validate(GameValidator.getGameById()),
  GameController.getGameById
);

router.get('/categories/list', GameController.getCategories);

router.get('/popular/list', GameController.getPopularGames);

router.get('/daily/challenge', GameController.getDailyChallenge);

router.get('/weekly/challenge', GameController.getWeeklyChallenge);

// Admin only routes
router.post(
  '/',
  restrictTo('admin'),
  validate(GameValidator.createGame()),
  GameController.createGame
);

router.patch(
  '/:gameId',
  restrictTo('admin'),
  validate(GameValidator.updateGame()),
  GameController.updateGame
);

router.delete(
  '/:gameId',
  restrictTo('admin'),
  validate(GameValidator.deleteGame()),
  GameController.deleteGame
);

// ========== GAME SESSIONS ==========
router.post(
  '/sessions/create',
  validate(GameSessionValidator.createSession()),
  GameSessionController.createSession
);

router.get('/sessions/my', GameSessionController.getMySessions);

router.get(
  '/sessions/:sessionId',
  validate(GameSessionValidator.joinSession()),
  GameSessionController.getSessionById
);

router.post(
  '/sessions/:sessionId/join',
  validate(GameSessionValidator.joinSession()),
  GameSessionController.joinSession
);

router.post(
  '/sessions/:sessionId/leave',
  validate(GameSessionValidator.joinSession()),
  GameSessionController.leaveSession
);

router.post(
  '/sessions/:sessionId/start',
  validate(GameSessionValidator.joinSession()),
  GameSessionController.startSession
);

router.post(
  '/sessions/:sessionId/answer',
  validate(GameSessionValidator.submitAnswer()),
  GameSessionController.submitAnswer
);

router.post(
  '/sessions/:sessionId/complete',
  validate(GameSessionValidator.joinSession()),
  GameSessionController.completeSession
);

// ========== USER STATS & LEADERBOARDS ==========
router.get('/stats/my', UserStatsController.getMyStats);

router.get(
  '/stats/user/:userId',
  validate(UserStatsValidator.getUserStats()),
  UserStatsController.getUserStats
);

router.get('/leaderboard/global', UserStatsController.getGlobalLeaderboard);

router.get('/leaderboard/weekly', UserStatsController.getWeeklyLeaderboard);

router.get(
  '/leaderboard/category/:category',
  validate(UserStatsValidator.getCategoryLeaderboard()),
  UserStatsController.getCategoryLeaderboard
);

router.get('/achievements/my', UserStatsController.getAchievements);

router.post(
  '/favorites/:gameId',
  validate(UserStatsValidator.manageFavorite()),
  UserStatsController.addFavoriteGame
);

router.delete(
  '/favorites/:gameId',
  validate(UserStatsValidator.manageFavorite()),
  UserStatsController.removeFavoriteGame
);

export default router;