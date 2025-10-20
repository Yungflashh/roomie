import { Response } from 'express';
import { AuthRequest } from '../../types';
import { GameSession, Game, UserGameStats, User, Notification } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import mongoose from 'mongoose';

export class GameSessionController {
  // Create game session
  static createSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { gameId, invitedUsers, scheduledFor } = req.body;

    const game = await Game.findById(gameId);

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    if (!game.isActive) {
      throw new ApiError(400, 'This game is currently unavailable');
    }

    // Create session
    const session = await GameSession.create({
      game: gameId,
      host: userId,
      participants: [
        {
          user: userId,
          score: 0,
          answers: [],
          joinedAt: new Date(),
        },
      ],
      invitedUsers: invitedUsers || [],
      scheduledFor: scheduledFor || null,
      status: 'waiting',
    });

    await session.populate('game');
    await session.populate('participants.user', 'firstName lastName profilePicture');

    // Send invitations
    if (invitedUsers && invitedUsers.length > 0) {
      const invitePromises = invitedUsers.map(async (invitedUserId: string) => {
        await Notification.create({
          recipient: invitedUserId,
          sender: userId,
          type: 'game_invite',
          title: 'Game Invitation',
          message: `You've been invited to play ${game.title}!`,
          data: {
            gameSessionId: session._id,
          },
          priority: 'medium',
        });

        // Emit socket event
        const socketService = req.app.get('socketService');
        socketService.emitToUser(invitedUserId, 'game-invite', {
          session,
          game,
          host: await User.findById(userId).select('firstName lastName profilePicture'),
        });
      });

      await Promise.all(invitePromises);
    }

    ApiResponse.created(res, { session }, 'Game session created successfully');
  });

  // Join game session
  static joinSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    if (session.status !== 'waiting') {
      throw new ApiError(400, 'Cannot join session that has already started or completed');
    }

    const game = await Game.findById(session.game);

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    // Check if already joined
    const alreadyJoined = session.participants.some((p) => p.user.toString() === userId);

    if (alreadyJoined) {
      throw new ApiError(400, 'You have already joined this session');
    }

    // Check max players
    if (session.participants.length >= game.maxPlayers) {
      throw new ApiError(400, 'This game session is full');
    }

    // Add participant
    session.participants.push({
      user: new mongoose.Types.ObjectId(userId),
      score: 0,
      answers: [],
      joinedAt: new Date(),
    });

    await session.save();
    await session.populate('participants.user', 'firstName lastName profilePicture');
    await session.populate('game');

    // Notify other participants
    const socketService = req.app.get('socketService');
    const io = req.app.get('io');
    io.to(`game:${sessionId}`).emit('player-joined', {
      sessionId,
      participant: await User.findById(userId).select('firstName lastName profilePicture'),
    });

    ApiResponse.success(res, { session }, 'Joined game session successfully');
  });

  // Leave game session
  static leaveSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    if (session.status !== 'waiting') {
      throw new ApiError(400, 'Cannot leave session that has already started');
    }

    // Remove participant
    session.participants = session.participants.filter(
      (p) => p.user.toString() !== userId
    );

    // If host leaves and there are other participants, transfer host
    if (session.host.toString() === userId && session.participants.length > 0) {
      session.host = session.participants[0].user;
    }

    // If no participants left, cancel session
    if (session.participants.length === 0) {
      session.status = 'cancelled';
    }

    await session.save();

    // Notify other participants
    const io = req.app.get('io');
    io.to(`game:${sessionId}`).emit('player-left', {
      sessionId,
      userId,
    });

    ApiResponse.success(res, null, 'Left game session successfully');
  });

  // Start game session
  static startSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    // Only host can start
    if (session.host.toString() !== userId) {
      throw new ApiError(403, 'Only the host can start the game');
    }

    if (session.status !== 'waiting') {
      throw new ApiError(400, 'Game has already started or completed');
    }

    const game = await Game.findById(session.game);

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    // Check minimum players
    if (session.participants.length < game.minPlayers) {
      throw new ApiError(
        400,
        `Need at least ${game.minPlayers} players to start this game`
      );
    }

    // Start session
    session.status = 'in-progress';
    session.startedAt = new Date();
    await session.save();

    await session.populate('game');
    await session.populate('participants.user', 'firstName lastName profilePicture');

    // Notify all participants
    const io = req.app.get('io');
    io.to(`game:${sessionId}`).emit('game-started', {
      session,
      game,
    });

    ApiResponse.success(res, { session }, 'Game started successfully');
  });

  // Submit answer
  static submitAnswer = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { questionId, answer, timeTaken } = req.body;

    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    if (session.status !== 'in-progress') {
      throw new ApiError(400, 'Game is not in progress');
    }

    const game = await Game.findById(session.game);

    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    // Find participant
    const participantIndex = session.participants.findIndex(
      (p) => p.user.toString() === userId
    );

    if (participantIndex === -1) {
      throw new ApiError(403, 'You are not a participant in this game');
    }

    // Find question
    const question = game.questions?.find((q) => q.question === questionId);

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    // Check if already answered
    const alreadyAnswered = session.participants[participantIndex].answers.some(
      (a) => a.questionId === questionId
    );

    if (alreadyAnswered) {
      throw new ApiError(400, 'You have already answered this question');
    }

    // Calculate score
    let isCorrect = false;
    let pointsEarned = 0;

    if (question.correctAnswer) {
      isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
      if (isCorrect) {
        // Base points plus time bonus
        const timeBonus = question.timeLimit
          ? Math.max(0, (question.timeLimit - timeTaken) / question.timeLimit) * question.points * 0.5
          : 0;
        pointsEarned = question.points + Math.floor(timeBonus);
      }
    }

    // Add answer
    session.participants[participantIndex].answers.push({
      questionId,
      answer,
      isCorrect,
      timeTaken,
      pointsEarned,
    });

    session.participants[participantIndex].score += pointsEarned;

    await session.save();

    // Notify other participants
    const io = req.app.get('io');
    io.to(`game:${sessionId}`).emit('answer-submitted', {
      sessionId,
      userId,
      questionId,
      score: session.participants[participantIndex].score,
    });

    ApiResponse.success(
      res,
      {
        isCorrect,
        pointsEarned,
        totalScore: session.participants[participantIndex].score,
      },
      'Answer submitted successfully'
    );
  });

  // Complete game session
  static completeSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    // Can be completed by host or automatically
    if (session.host.toString() !== userId && session.status !== 'in-progress') {
      throw new ApiError(403, 'Only the host can complete the game');
    }

    if (session.status === 'completed') {
      throw new ApiError(400, 'Game has already been completed');
    }

    // Calculate rankings
    const sortedParticipants = [...session.participants].sort(
      (a, b) => b.score - a.score
    );

    sortedParticipants.forEach((participant, index) => {
      const participantIndex = session.participants.findIndex(
        (p) => p.user.toString() === participant.user.toString()
      );
      session.participants[participantIndex].rank = index + 1;
      session.participants[participantIndex].completedAt = new Date();
    });

    // Set winner
    if (sortedParticipants.length > 0) {
      session.winner = sortedParticipants[0].user;
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Update user stats
    await this.updateUserStats(session);

    await session.populate('game');
    await session.populate('participants.user', 'firstName lastName profilePicture');
    await session.populate('winner', 'firstName lastName profilePicture');

    // Notify all participants
    const io = req.app.get('io');
    io.to(`game:${sessionId}`).emit('game-completed', {
      session,
      results: sortedParticipants,
    });

    ApiResponse.success(res, { session, results: sortedParticipants }, 'Game completed successfully');
  });

  // Helper: Update user statistics
  private static async updateUserStats(session: any): Promise<void> {
    const game = await Game.findById(session.game);

    if (!game) return;

    for (const participant of session.participants) {
      let userStats = await UserGameStats.findOne({ user: participant.user });

      if (!userStats) {
        userStats = await UserGameStats.create({
          user: participant.user,
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalPoints: 0,
            achievements: [],
            currentStreak: 0,
            longestStreak: 0,
          },
          gameHistory: [],
          dailyStreak: {
            current: 0,
            longest: 0,
            lastPlayedDate: new Date(),
          },
          weeklyChallenge: {
            currentWeek: 0,
            completed: false,
            score: 0,
          },
          leaderboard: {
            categoryRanks: new Map(),
          },
          achievements: [],
          favoriteGames: [],
          level: 1,
          experiencePoints: 0,
          nextLevelXP: 100,
        });
      }

      // Update stats
      userStats.stats.gamesPlayed += 1;
      userStats.stats.totalPoints += participant.score;

      if (session.winner?.toString() === participant.user.toString()) {
        userStats.stats.gamesWon += 1;
      }

      // Add XP
      userStats.experiencePoints += participant.score;

      // Update daily streak
      const today = new Date().toDateString();
      const lastPlayed = userStats.dailyStreak.lastPlayedDate?.toDateString();

      if (game.type === 'daily') {
        if (today !== lastPlayed) {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
          
          if (lastPlayed === yesterday) {
            userStats.dailyStreak.current += 1;
          } else {
            userStats.dailyStreak.current = 1;
          }

          if (userStats.dailyStreak.current > userStats.dailyStreak.longest) {
            userStats.dailyStreak.longest = userStats.dailyStreak.current;
          }

          userStats.dailyStreak.lastPlayedDate = new Date();
        }
      }

      // Update weekly challenge
      if (game.type === 'weekly') {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
          ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
        );

        userStats.weeklyChallenge.currentWeek = weekNumber;
        userStats.weeklyChallenge.completed = true;
        userStats.weeklyChallenge.score = participant.score;
      }

      // Add to game history
      userStats.gameHistory.push({
        game: session.game,
        session: session._id,
        score: participant.score,
        rank: participant.rank || 0,
        playedAt: new Date(),
        duration: session.completedAt
          ? (session.completedAt.getTime() - session.startedAt!.getTime()) / 1000
          : 0,
      });

      // Keep only last 100 games
      if (userStats.gameHistory.length > 100) {
        userStats.gameHistory = userStats.gameHistory.slice(-100);
      }

      await userStats.save();

    }
  }

  

  // Get user's game sessions
  static getMySessions = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {
      'participants.user': userId,
    };

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sessions = await GameSession.find(query)
      .populate('game')
      .populate('host', 'firstName lastName profilePicture')
      .populate('participants.user', 'firstName lastName profilePicture')
      .populate('winner', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await GameSession.countDocuments(query);

    ApiResponse.paginated(
      res,
      sessions,
      Number(page),
      Number(limit),
      total,
      'Game sessions retrieved successfully'
    );
  });

  // Get session by ID
  static getSessionById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('host', 'firstName lastName profilePicture')
      .populate('participants.user', 'firstName lastName profilePicture')
      .populate('winner', 'firstName lastName profilePicture')
      .populate('invitedUsers', 'firstName lastName profilePicture');

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    // Check if user is participant or invited
    const isParticipant = session.participants.some((p: any) => p.user._id.toString() === userId);
    const isInvited = session.invitedUsers.some((u: any) => u._id.toString() === userId);
    const isHost = session.host._id.toString() === userId;

    if (!isParticipant && !isInvited && !isHost) {
      throw new ApiError(403, 'You do not have access to this game session');
    }

    ApiResponse.success(res, { session }, 'Game session retrieved successfully');
  });
}