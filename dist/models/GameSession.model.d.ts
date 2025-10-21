import mongoose, { Document, Model } from 'mongoose';
export interface IGameSession extends Document {
    game: mongoose.Types.ObjectId;
    participants: Array<{
        user: mongoose.Types.ObjectId;
        score: number;
        answers: Array<{
            questionId: string;
            answer: string;
            isCorrect: boolean;
            timeTaken: number;
            pointsEarned: number;
        }>;
        joinedAt: Date;
        completedAt?: Date;
        rank?: number;
    }>;
    host: mongoose.Types.ObjectId;
    status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
    startedAt?: Date;
    completedAt?: Date;
    winner?: mongoose.Types.ObjectId;
    chatRoom?: mongoose.Types.ObjectId;
    isRanked: boolean;
    scheduledFor?: Date;
    invitedUsers: mongoose.Types.ObjectId[];
    spectators: mongoose.Types.ObjectId[];
    replay?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const GameSession: Model<IGameSession>;
export default GameSession;
//# sourceMappingURL=GameSession.model.d.ts.map