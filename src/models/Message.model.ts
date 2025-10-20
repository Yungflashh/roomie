import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  chatRoom: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'game-invite';
  attachments?: Array<{
    url: string;
    type: string;
    size: number;
    name: string;
  }>;
  metadata?: {
    gameId?: mongoose.Types.ObjectId;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  readBy: Array<{
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  deliveredTo: Array<{
    user: mongoose.Types.ObjectId;
    deliveredAt: Date;
  }>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedFor: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
  reactions: Map<string, mongoose.Types.ObjectId[]>; // emoji -> array of user IDs
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'game-invite'],
      default: 'text',
    },
    attachments: [{
      url: String,
      type: String,
      size: Number,
      name: String,
    }],
    metadata: {
      gameId: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
      },
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
    },
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: Date,
    }],
    deliveredTo: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      deliveredAt: Date,
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedFor: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MessageSchema.index({ chatRoom: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ 'readBy.user': 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;