import mongoose, { Document, Schema, Model } from 'mongoose';
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
    radius: number; // in meters
    notifyOnExit: boolean;
    notifyOnEnter: boolean;
  }>;
  sosContacts: Array<{
    user: mongoose.Types.ObjectId;
    name: string;
    phoneNumber: string;
  }>;
  lastUpdated: Date;
  accuracy: number; // in meters
  batteryLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationTrackingSchema = new Schema<ILocationTracking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    isTrackingEnabled: {
      type: Boolean,
      default: false,
    },
    sharedWith: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      expiresAt: Date,
      canSeeRealtime: {
        type: Boolean,
        default: false,
      },
    }],
    locationHistory: [{
      location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        city: String,
        state: String,
        country: String,
      },
      timestamp: Date,
    }],
    safeZones: [{
      name: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: [Number],
      },
      radius: Number,
      notifyOnExit: { type: Boolean, default: true },
      notifyOnEnter: { type: Boolean, default: true },
    }],
    sosContacts: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      phoneNumber: String,
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    accuracy: Number,
    batteryLevel: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes
LocationTrackingSchema.index({ 'currentLocation.coordinates': '2dsphere' });
LocationTrackingSchema.index({ user: 1 });
LocationTrackingSchema.index({ 'sharedWith.user': 1 });
LocationTrackingSchema.index({ lastUpdated: -1 });

// Cleanup old location history (keep last 30 days)
LocationTrackingSchema.pre('save', function(next) {
  if (this.locationHistory.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.locationHistory = this.locationHistory.filter(
      (loc) => loc.timestamp > thirtyDaysAgo
    );
  }
  next();
});

const LocationTracking: Model<ILocationTracking> = mongoose.model<ILocationTracking>(
  'LocationTracking',
  LocationTrackingSchema
);

export default LocationTracking;