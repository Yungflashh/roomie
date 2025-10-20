import mongoose, { Document, Schema, Model } from 'mongoose';

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
  replay?: string; // URL to replay data
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      score: {
        type: Number,
        default: 0,
      },
      answers: [{
        questionId: String,
        answer: String,
        isCorrect: Boolean,
        timeTaken: Number,
        pointsEarned: Number,
      }],
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
      rank: Number,
    }],
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
      default: 'waiting',
    },
    startedAt: Date,
    completedAt: Date,
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
    },
    isRanked: {
      type: Boolean,
      default: true,
    },
    scheduledFor: Date,
    invitedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    spectators: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    replay: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
GameSessionSchema.index({ game: 1, status: 1 });
GameSessionSchema.index({ host: 1 });
GameSessionSchema.index({ 'participants.user': 1 });
GameSessionSchema.index({ createdAt: -1 });

const GameSession: Model<IGameSession> = mongoose.model<IGameSession>('GameSession', GameSessionSchema);

export default GameSession;