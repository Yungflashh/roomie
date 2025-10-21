export declare class CallService {
    static createCallNotification(callerId: string, receiverId: string, roomId: string, callType: 'audio' | 'video'): Promise<void>;
    static logCall(caller: string, receiver: string, duration: number, callType: 'audio' | 'video', status: 'completed' | 'missed' | 'rejected'): Promise<void>;
}
//# sourceMappingURL=call.service.d.ts.map