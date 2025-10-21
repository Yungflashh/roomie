import Queue from 'bull';
declare const subscriptionQueue: Queue.Queue<any>;
export declare const scheduleSubscriptionRenewal: (subscriptionId: string) => Promise<void>;
export declare const scheduleSubscriptionCancellation: (subscriptionId: string) => Promise<void>;
export default subscriptionQueue;
//# sourceMappingURL=subscription.jobs.d.ts.map