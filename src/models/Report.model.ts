import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  reported: mongoose.Types.ObjectId;
  type: 'user' | 'match' | 'message' | 'game' | 'other';
  reason: string;
  category: 'harassment' | 'inappropriate' | 'spam' | 'fake' | 'safety' | 'other';
  description: string;
  evidence?: string[]; // Screenshots, etc.
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  actionTaken?: 'warning' | 'suspension' | 'ban' | 'none';
  resolvedAt?: Date;
  relatedEntity?: {
    entityType: string;
    entityId: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reported: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['user', 'match', 'message', 'game', 'other'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['harassment', 'inappropriate', 'spam', 'fake', 'safety', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    evidence: [String],
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: String,
    actionTaken: {
      type: String,
      enum: ['warning', 'suspension', 'ban', 'none'],
    },
    resolvedAt: Date,
    relatedEntity: {
      entityType: String,
      entityId: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ reported: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

const Report: Model<IReport> = mongoose.model<IReport>('Report', ReportSchema);

export default Report;