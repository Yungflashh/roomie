import mongoose, { Document, Model } from 'mongoose';
export interface IChatRoom extends Document {
    participants: mongoose.Types.ObjectId[];
    type: 'direct' | 'group';
    name?: string;
    avatar?: string;
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
declare const ChatRoom: Model<IChatRoom>;
export default ChatRoom;
//# sourceMappingURL=ChatRoom.model.d.ts.map