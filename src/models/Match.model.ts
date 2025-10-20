import mongoose, { Document, Schema, Model } from 'mongoose';

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

const MatchSchema = new Schema<IMatch>(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: Date,
    rejectedAt: Date,
    unmatchedAt: Date,
    unmatchReason: String,
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
    },
    meetingScheduled: {
      type: Boolean,
      default: false,
    },
    meetingDetails: {
      date: Date,
      location: String,
      type: {
        type: String,
        enum: ['virtual', 'in-person'],
      },
    },
    flags: {
      isReported: { type: Boolean, default: false },
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reportReason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });
MatchSchema.index({ status: 1 });
MatchSchema.index({ matchedAt: -1 });
MatchSchema.index({ expiresAt: 1 });

// Ensure user1 ID is always less than user2 ID for consistency
MatchSchema.pre('save', function(next) {
  if (this.user1.toString() > this.user2.toString()) {
    [this.user1, this.user2] = [this.user2, this.user1];
  }
  next();
});

const Match: Model<IMatch> = mongoose.model<IMatch>('Match', MatchSchema);

export default Match;