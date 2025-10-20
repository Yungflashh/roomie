import { Notification } from '../models';
import { logger } from '../utils/logger';

export class CallService {
  // Create call notification
  static async createCallNotification(
    callerId: string,
    receiverId: string,
    roomId: string,
    callType: 'audio' | 'video'
  ): Promise<void> {
    try {
      await Notification.create({
        recipient: receiverId,
        sender: callerId,
        type: 'system',
        title: `Incoming ${callType} call`,
        message: `You have an incoming ${callType} call`,
        data: {
          chatRoomId: roomId,
        },
        priority: 'urgent',
      });
    } catch (error) {
      logger.error(`Error creating call notification: ${error}`);
    }
  }

  // Log call history (optional - create CallLog model if needed)
  static async logCall(
    caller: string,
    receiver: string,
    duration: number,
    callType: 'audio' | 'video',
    status: 'completed' | 'missed' | 'rejected'
  ): Promise<void> {
    // TODO: Create CallLog model and implement
    logger.info(`Call logged: ${caller} -> ${receiver}, ${duration}s, ${status}`);
  }
}