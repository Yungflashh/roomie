import Queue from 'bull';
declare const matchQueue: Queue.Queue<any>;
export declare const scheduleMatchExpiration: (matchId: string, expirationDate: Date) => Promise<void>;
export declare const scheduleCompatibilityRecalculation: (profileId: string) => Promise<void>;
export default matchQueue;
//# sourceMappingURL=match.jobs.d.ts.map