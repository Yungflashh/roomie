import Queue from 'bull';
declare const gameQueue: Queue.Queue<any>;
export declare const scheduleSessionCompletion: (sessionId: string) => Promise<void>;
export declare const scheduleLeaderboardUpdate: (gameId?: string, period?: "daily" | "weekly" | "monthly") => Promise<void>;
export default gameQueue;
//# sourceMappingURL=game.jobs.d.ts.map