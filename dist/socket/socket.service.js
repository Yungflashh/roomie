"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jwt_utils_1 = require("../utils/jwt.utils");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
class SocketService {
    constructor(httpServer) {
        this.userSockets = new Map(); // userId -> [socketId]
        this.io = new socket_io_1.Server(httpServer, {
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
    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }
                const decoded = jwt_utils_1.JWTUtils.verifyAccessToken(token);
                // Verify user exists
                const user = await models_1.User.findById(decoded.id);
                if (!user || !user.isActive || user.isBlocked) {
                    return next(new Error('Authentication error: Invalid user'));
                }
                socket.userId = decoded.id;
                next();
            }
            catch (error) {
                logger_1.logger.error(`Socket authentication error: ${error.message}`);
                next(new Error('Authentication error'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const userId = socket.userId;
            logger_1.logger.info(`User connected: ${userId}, Socket: ${socket.id}`);
            // Track user's socket connections
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId).push(socket.id);
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
    handleDisconnect(socket) {
        const userId = socket.userId;
        logger_1.logger.info(`User disconnected: ${userId}, Socket: ${socket.id}`);
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
    handleJoinRoom(socket, data) {
        socket.join(`room:${data.roomId}`);
        logger_1.logger.info(`User ${socket.userId} joined room ${data.roomId}`);
    }
    handleLeaveRoom(socket, data) {
        socket.leave(`room:${data.roomId}`);
        logger_1.logger.info(`User ${socket.userId} left room ${data.roomId}`);
    }
    handleTypingStart(socket, data) {
        socket.to(`room:${data.roomId}`).emit('user-typing', {
            userId: socket.userId,
            roomId: data.roomId,
        });
    }
    handleTypingStop(socket, data) {
        socket.to(`room:${data.roomId}`).emit('user-stopped-typing', {
            userId: socket.userId,
            roomId: data.roomId,
        });
    }
    handleMessageRead(socket, data) {
        socket.to(`room:${data.roomId}`).emit('message-read', {
            messageId: data.messageId,
            userId: socket.userId,
            readAt: new Date(),
        });
    }
    handleMessageDelivered(socket, data) {
        socket.to(`room:${data.roomId}`).emit('message-delivered', {
            messageId: data.messageId,
            userId: socket.userId,
            deliveredAt: new Date(),
        });
    }
    // WebRTC Call Handlers
    handleCallInitiate(socket, data) {
        this.io.to(`user:${data.to}`).emit('incoming-call', {
            from: socket.userId,
            roomId: data.roomId,
            callType: data.callType,
        });
    }
    handleCallAccept(socket, data) {
        this.io.to(`user:${data.to}`).emit('call-accepted', {
            from: socket.userId,
            roomId: data.roomId,
        });
    }
    handleCallReject(socket, data) {
        this.io.to(`user:${data.to}`).emit('call-rejected', {
            from: socket.userId,
            roomId: data.roomId,
        });
    }
    handleCallEnd(socket, data) {
        this.io.to(`user:${data.to}`).emit('call-ended', {
            from: socket.userId,
            roomId: data.roomId,
        });
    }
    handleIceCandidate(socket, data) {
        this.io.to(`user:${data.to}`).emit('ice-candidate', {
            from: socket.userId,
            candidate: data.candidate,
        });
    }
    handleOffer(socket, data) {
        this.io.to(`user:${data.to}`).emit('offer', {
            from: socket.userId,
            offer: data.offer,
        });
    }
    handleAnswer(socket, data) {
        this.io.to(`user:${data.to}`).emit('answer', {
            from: socket.userId,
            answer: data.answer,
        });
    }
    // Location tracking
    async handleLocationUpdate(socket, data) {
        const { LocationTracking } = await Promise.resolve().then(() => __importStar(require('../models')));
        await LocationTracking.findOneAndUpdate({ user: socket.userId }, {
            currentLocation: data.location,
            lastUpdated: new Date(),
            accuracy: data.accuracy,
            batteryLevel: data.batteryLevel,
        }, { upsert: true });
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
    handleGameInvite(socket, data) {
        this.io.to(`user:${data.to}`).emit('game-invite', {
            from: socket.userId,
            gameId: data.gameId,
        });
    }
    handleGameMove(socket, data) {
        socket.to(`game:${data.sessionId}`).emit('game-move', {
            from: socket.userId,
            move: data.move,
        });
    }
    handleGameJoinRoom(socket, data) {
        socket.join(`game:${data.sessionId}`);
        logger_1.logger.info(`User ${socket.userId} joined game room ${data.sessionId}`);
        // Notify other players
        socket.to(`game:${data.sessionId}`).emit('player-joined-room', {
            userId: socket.userId,
            sessionId: data.sessionId,
        });
    }
    handleGameLeaveRoom(socket, data) {
        socket.leave(`game:${data.sessionId}`);
        logger_1.logger.info(`User ${socket.userId} left game room ${data.sessionId}`);
        // Notify other players
        socket.to(`game:${data.sessionId}`).emit('player-left-room', {
            userId: socket.userId,
            sessionId: data.sessionId,
        });
    }
    handleGameAnswerSubmit(socket, data) {
        // Notify other players that someone submitted an answer
        socket.to(`game:${data.sessionId}`).emit('player-answered', {
            userId: socket.userId,
            questionId: data.questionId,
            answeredAt: data.answeredAt,
        });
    }
    handleGamePlayerReady(socket, data) {
        socket.to(`game:${data.sessionId}`).emit('player-ready', {
            userId: socket.userId,
            sessionId: data.sessionId,
        });
    }
    // Public method to emit game events
    emitToGameSession(sessionId, event, data) {
        this.io.to(`game:${sessionId}`).emit(event, data);
    }
    // Public methods
    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    emitToRoom(roomId, event, data) {
        this.io.to(`room:${roomId}`).emit(event, data);
    }
    emitUserStatus(userId, status) {
        this.io.emit('user-status', { userId, status, timestamp: new Date() });
    }
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
    getIO() {
        return this.io;
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socket.service.js.map