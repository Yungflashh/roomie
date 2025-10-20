import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGame extends Document {
  title: string;
  description: string;
  category: 'trivia' | 'puzzle' | 'icebreaker' | 'challenge' | 'personality';
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'daily' | 'weekly' | 'multiplayer' | 'solo';
  thumbnail: string;
  duration: number; // in minutes
  maxPlayers: number;
  minPlayers: number;
  rules: string;
  questions?: Array<{
    question: string;
    type: 'multiple-choice' | 'true-false' | 'open-ended';
    options?: string[];
    correctAnswer?: string;
    points: number;
    timeLimit?: number; // in seconds
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

const GameSchema = new Schema<IGame>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'multiplayer', 'solo'],
      required: true,
    },
    thumbnail: String,
    duration: Number,
    maxPlayers: {
      type: Number,
      default: 4,
    },
    minPlayers: {
      type: Number,
      default: 1,
    },
    rules: String,
    questions: [{
      question: String,
      type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'open-ended'],
      },
      options: [String],
      correctAnswer: String,
      points: Number,
      timeLimit: Number,
    }],
    achievements: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      condition: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
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
GameSchema.index({ category: 1, type: 1 });
GameSchema.index({ isActive: 1 });

const Game: Model<IGame> = mongoose.model<IGame>('Game', GameSchema);

export default Game;