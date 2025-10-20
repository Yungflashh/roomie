import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { JWTUtils } from '../utils/jwt.utils';
import { logger } from '../utils/logger';
import { User } from '../models';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> [socketId]

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = JWTUtils.verifyAccessToken(token);
        
        // Verify user exists
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive || user.isBlocked) {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.userId = decoded.id;
        next();
      } catch (error: any) {
        logger.error(`Socket authentication error: ${error.message}`);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`User connected: ${userId}, Socket: ${socket.id}`);

      // Track user's socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Emit user online status
      this.emitUserStatus(userId, 'online');

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Chat events
      socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('typing-start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing-stop', (data) => this.handleTypingStop(socket, data));
      socket.on('message-read', (data) => this.handleMessageRead(socket, data));
      socket.on('message-delivered', (data) => this.handleMessageDelivered(socket, data));

      // Call events
      socket.on('call-initiate', (data) => this.handleCallInitiate(socket, data));
      socket.on('call-accept', (data) => this.handleCallAccept(socket, data));
      socket.on('call-reject', (data) => this.handleCallReject(socket, data));
      socket.on('call-end', (data) => this.handleCallEnd(socket, data));
      socket.on('ice-candidate', (data) => this.handleIceCandidate(socket, data));
      socket.on('offer', (data) => this.handleOffer(socket, data));
      socket.on('answer', (data) => this.handleAnswer(socket, data));

      // Location tracking
      socket.on('location-update', (data) => this.handleLocationUpdate(socket, data));

      // Game events
      socket.on('game-invite', (data) => this.handleGameInvite(socket, data));
      socket.on('game-move', (data) => this.handleGameMove(socket, data));
      socket.on('game-join-room', (data) => this.handleGameJoinRoom(socket, data));
    socket.on('game-leave-room', (data) => this.handleGameLeaveRoom(socket, data));
    socket.on('game-answer-submit', (data) => this.handleGameAnswerSubmit(socket, data));
    socket.on('game-player-ready', (data) => this.handleGamePlayerReady(socket, data));

    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    logger.info(`User disconnected: ${userId}, Socket: ${socket.id}`);

    // Remove socket from user's connections
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const index = sockets.indexOf(socket.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }

      // If user has no more connections, mark as offline
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
        this.emitUserStatus(userId, 'offline');
      }
    }
  }

  private handleJoinRoom(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.join(`room:${data.roomId}`);
    logger.info(`User ${socket.userId} joined room ${data.roomId}`);
  }

  private handleLeaveRoom(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.leave(`room:${data.roomId}`);
    logger.info(`User ${socket.userId} left room ${data.roomId}`);
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.to(`room:${data.roomId}`).emit('user-typing', {
      userId: socket.userId,
      roomId: data.roomId,
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.to(`room:${data.roomId}`).emit('user-stopped-typing', {
      userId: socket.userId,
      roomId: data.roomId,
    });
  }

  private handleMessageRead(socket: AuthenticatedSocket, data: { messageId: string; roomId: string }) {
    socket.to(`room:${data.roomId}`).emit('message-read', {
      messageId: data.messageId,
      userId: socket.userId,
      readAt: new Date(),
    });
  }

  private handleMessageDelivered(socket: AuthenticatedSocket, data: { messageId: string; roomId: string }) {
    socket.to(`room:${data.roomId}`).emit('message-delivered', {
      messageId: data.messageId,
      userId: socket.userId,
      deliveredAt: new Date(),
    });
  }

  // WebRTC Call Handlers
  private handleCallInitiate(socket: AuthenticatedSocket, data: { to: string; roomId: string; callType: 'audio' | 'video' }) {
    this.io.to(`user:${data.to}`).emit('incoming-call', {
      from: socket.userId,
      roomId: data.roomId,
      callType: data.callType,
    });
  }

  private handleCallAccept(socket: AuthenticatedSocket, data: { to: string; roomId: string }) {
    this.io.to(`user:${data.to}`).emit('call-accepted', {
      from: socket.userId,
      roomId: data.roomId,
    });
  }

  private handleCallReject(socket: AuthenticatedSocket, data: { to: string; roomId: string }) {
    this.io.to(`user:${data.to}`).emit('call-rejected', {
      from: socket.userId,
      roomId: data.roomId,
    });
  }

  private handleCallEnd(socket: AuthenticatedSocket, data: { to: string; roomId: string }) {
    this.io.to(`user:${data.to}`).emit('call-ended', {
      from: socket.userId,
      roomId: data.roomId,
    });
  }

  private handleIceCandidate(socket: AuthenticatedSocket, data: { to: string; candidate: any }) {
    this.io.to(`user:${data.to}`).emit('ice-candidate', {
      from: socket.userId,
      candidate: data.candidate,
    });
  }

  private handleOffer(socket: AuthenticatedSocket, data: { to: string; offer: any }) {
    this.io.to(`user:${data.to}`).emit('offer', {
      from: socket.userId,
      offer: data.offer,
    });
  }

  private handleAnswer(socket: AuthenticatedSocket, data: { to: string; answer: any }) {
    this.io.to(`user:${data.to}`).emit('answer', {
      from: socket.userId,
      answer: data.answer,
    });
  }

  // Location tracking
  private async handleLocationUpdate(socket: AuthenticatedSocket, data: any) {
    const { LocationTracking } = await import('../models');
    
    await LocationTracking.findOneAndUpdate(
      { user: socket.userId },
      {
        currentLocation: data.location,
        lastUpdated: new Date(),
        accuracy: data.accuracy,
        batteryLevel: data.batteryLevel,
      },
      { upsert: true }
    );

    // Notify users who have permission to see this user's location
    const tracking = await LocationTracking.findOne({ user: socket.userId });
    if (tracking) {
      tracking.sharedWith.forEach((share) => {
        if (share.canSeeRealtime) {
          this.io.to(`user:${share.user.toString()}`).emit('location-updated', {
            userId: socket.userId,
            location: data.location,
            timestamp: new Date(),
          });
        }
      });
    }
  }

  // Game events
  private handleGameInvite(socket: AuthenticatedSocket, data: { to: string; gameId: string }) {
    this.io.to(`user:${data.to}`).emit('game-invite', {
      from: socket.userId,
      gameId: data.gameId,
    });
  }

  private handleGameMove(socket: AuthenticatedSocket, data: { sessionId: string; move: any }) {
    socket.to(`game:${data.sessionId}`).emit('game-move', {
      from: socket.userId,
      move: data.move,
    });
  }


private handleGameJoinRoom(socket: AuthenticatedSocket, data: { sessionId: string }) {
  socket.join(`game:${data.sessionId}`);
  logger.info(`User ${socket.userId} joined game room ${data.sessionId}`);
  
  // Notify other players
  socket.to(`game:${data.sessionId}`).emit('player-joined-room', {
    userId: socket.userId,
    sessionId: data.sessionId,
  });
}

private handleGameLeaveRoom(socket: AuthenticatedSocket, data: { sessionId: string }) {
  socket.leave(`game:${data.sessionId}`);
  logger.info(`User ${socket.userId} left game room ${data.sessionId}`);
  
  // Notify other players
  socket.to(`game:${data.sessionId}`).emit('player-left-room', {
    userId: socket.userId,
    sessionId: data.sessionId,
  });
}

private handleGameAnswerSubmit(
  socket: AuthenticatedSocket,
  data: { sessionId: string; questionId: string; answeredAt: Date }
) {
  // Notify other players that someone submitted an answer
  socket.to(`game:${data.sessionId}`).emit('player-answered', {
    userId: socket.userId,
    questionId: data.questionId,
    answeredAt: data.answeredAt,
  });
}

private handleGamePlayerReady(socket: AuthenticatedSocket, data: { sessionId: string }) {
  socket.to(`game:${data.sessionId}`).emit('player-ready', {
    userId: socket.userId,
    sessionId: data.sessionId,
  });
}

// Public method to emit game events
public emitToGameSession(sessionId: string, event: string, data: any) {
  this.io.to(`game:${sessionId}`).emit(event, data);
}

  // Public methods
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToRoom(roomId: string, event: string, data: any) {
    this.io.to(`room:${roomId}`).emit(event, data);
  }

  public emitUserStatus(userId: string, status: 'online' | 'offline') {
    this.io.emit('user-status', { userId, status, timestamp: new Date() });
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}