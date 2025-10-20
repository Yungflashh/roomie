import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IChatRoom extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'direct' | 'group';
  name?: string; // For group chats
  avatar?: string; // For group chats
  lastMessage?: {
    text: string;
    sender: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  unreadCount: Map<string, number>;
  isPinned: Map<string, boolean>;
  isMuted: Map<string, boolean>;
  isArchived: boolean;
  relatedMatch?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    name: String,
    avatar: String,
    lastMessage: {
      text: String,
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isPinned: {
      type: Map,
      of: Boolean,
      default: {},
    },
    isMuted: {
      type: Map,
      of: Boolean,
      default: {},
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    relatedMatch: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ 'lastMessage.sentAt': -1 });
ChatRoomSchema.index({ type: 1 });

const ChatRoom: Model<IChatRoom> = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;