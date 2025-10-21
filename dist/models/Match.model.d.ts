import mongoose, { Document, Model } from 'mongoose';
export interface IMatch extends Document {
    user1: mongoose.Types.ObjectId;
    user2: mongoose.Types.ObjectId;
    compatibilityScore: number;
    matchedAt: Date;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    initiatedBy: mongoose.Types.ObjectId;
    message?: string;
    expiresAt: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    unmatchedAt?: Date;
    unmatchReason?: string;
    chatRoom?: mongoose.Types.ObjectId;
    meetingScheduled: boolean;
    meetingDetails?: {
        date: Date;
        location: string;
        type: 'virtual' | 'in-person';
    };
    flags: {
        isReported: boolean;
        reportedBy?: mongoose.Types.ObjectId;
        reportReason?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const Match: Model<IMatch>;
export default Match;
//# sourceMappingURL=Match.model.d.ts.map