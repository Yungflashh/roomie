import mongoose, { Document, Model } from 'mongoose';
export interface IReport extends Document {
    reporter: mongoose.Types.ObjectId;
    reported: mongoose.Types.ObjectId;
    type: 'user' | 'match' | 'message' | 'game' | 'other';
    reason: string;
    category: 'harassment' | 'inappropriate' | 'spam' | 'fake' | 'safety' | 'other';
    description: string;
    evidence?: string[];
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
declare const Report: Model<IReport>;
export default Report;
//# sourceMappingURL=Report.model.d.ts.map