import mongoose, { Document, Model } from 'mongoose';
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
    reactions: Map<string, mongoose.Types.ObjectId[]>;
    createdAt: Date;
    updatedAt: Date;
}
declare const Message: Model<IMessage>;
export default Message;
//# sourceMappingURL=Message.model.d.ts.map