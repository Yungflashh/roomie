import { Application } from 'express';
import { SocketService } from './socket/socket.service';
import './jobs/match.jobs';
import './jobs/game.jobs';
import './jobs/subscription.jobs';
declare const app: Application;
declare const socketService: SocketService;
declare const io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, io, socketService };
//# sourceMappingURL=server.d.ts.map