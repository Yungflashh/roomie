import mongoose, { Document, Schema, Model } from 'mongoose';
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

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      matchId: {
        type: Schema.Types.ObjectId,
        ref: 'Match',
      },
      chatRoomId: {
        type: Schema.Types.ObjectId,
        ref: 'ChatRoom',
      },
      gameSessionId: {
        type: Schema.Types.ObjectId,
        ref: 'GameSession',
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      url: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    actionUrl: String,
    imageUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;