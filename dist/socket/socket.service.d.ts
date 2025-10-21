import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
export declare class SocketService {
    private io;
    private userSockets;
    constructor(httpServer: HTTPServer);
    private setupMiddleware;
    private setupEventHandlers;
    private handleDisconnect;
    private handleJoinRoom;
    private handleLeaveRoom;
    private handleTypingStart;
    private handleTypingStop;
    private handleMessageRead;
    private handleMessageDelivered;
    private handleCallInitiate;
    private handleCallAccept;
    private handleCallReject;
    private handleCallEnd;
    private handleIceCandidate;
    private handleOffer;
    private handleAnswer;
    private handleLocationUpdate;
    private handleGameInvite;
    private handleGameMove;
    private handleGameJoinRoom;
    private handleGameLeaveRoom;
    private handleGameAnswerSubmit;
    private handleGamePlayerReady;
    emitToGameSession(sessionId: string, event: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
    emitToRoom(roomId: string, event: string, data: any): void;
    emitUserStatus(userId: string, status: 'online' | 'offline'): void;
    isUserOnline(userId: string): boolean;
    getIO(): SocketIOServer;
}
//# sourceMappingURL=socket.service.d.ts.map