import mongoose, { Document, Model } from 'mongoose';
export interface IGame extends Document {
    title: string;
    description: string;
    category: 'trivia' | 'puzzle' | 'icebreaker' | 'challenge' | 'personality';
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'daily' | 'weekly' | 'multiplayer' | 'solo';
    thumbnail: string;
    duration: number;
    maxPlayers: number;
    minPlayers: number;
    rules: string;
    questions?: Array<{
        question: string;
        type: 'multiple-choice' | 'true-false' | 'open-ended';
        options?: string[];
        correctAnswer?: string;
        points: number;
        timeLimit?: number;
    }>;
    achievements: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        condition: string;
    }>;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const Game: Model<IGame>;
export default Game;
//# sourceMappingURL=Game.model.d.ts.map