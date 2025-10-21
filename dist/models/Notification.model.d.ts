import mongoose, { Document, Model } from 'mongoose';
import { NotificationType } from '../types';
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        matchId?: mongoose.Types.ObjectId;
        chatRoomId?: mongoose.Types.ObjectId;
        gameSessionId?: mongoose.Types.ObjectId;
        userId?: mongoose.Types.ObjectId;
        url?: string;
    };
    isRead: boolean;
    readAt?: Date;
    isSent: boolean;
    sentAt?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    imageUrl?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Notification: Model<INotification>;
export default Notification;
//# sourceMappingURL=Notification.model.d.ts.map