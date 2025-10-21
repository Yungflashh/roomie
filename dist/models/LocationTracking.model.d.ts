import mongoose, { Document, Model } from 'mongoose';
import { Location } from '../types';
export interface ILocationTracking extends Document {
    user: mongoose.Types.ObjectId;
    currentLocation: Location;
    isTrackingEnabled: boolean;
    sharedWith: Array<{
        user: mongoose.Types.ObjectId;
        expiresAt?: Date;
        canSeeRealtime: boolean;
    }>;
    locationHistory: Array<{
        location: Location;
        timestamp: Date;
    }>;
    safeZones: Array<{
        name: string;
        location: Location;
        radius: number;
        notifyOnExit: boolean;
        notifyOnEnter: boolean;
    }>;
    sosContacts: Array<{
        user: mongoose.Types.ObjectId;
        name: string;
        phoneNumber: string;
    }>;
    lastUpdated: Date;
    accuracy: number;
    batteryLevel?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const LocationTracking: Model<ILocationTracking>;
export default LocationTracking;
//# sourceMappingURL=LocationTracking.model.d.ts.map