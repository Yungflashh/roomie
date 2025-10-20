import mongoose, { Document, Schema, Model } from 'mongoose';
import { MatchingPreferences, LifestylePreferences, RoommateStatus, Location } from '../types';

export interface IRoommateProfile extends Document {
  user: mongoose.Types.ObjectId;
  status: RoommateStatus;
  headline: string;
  about: string;
  videoIntro?: string; // 30-second video URL
  photos: string[];
  location: Location;
  currentLiving: {
    hasPlace: boolean;
    lookingFor: 'roommate' | 'room' | 'both';
    canHost: boolean;
  };
  matchingPreferences: MatchingPreferences;
  lifestylePreferences: LifestylePreferences;
  interests: string[];
  languages: string[];
  occupation: {
    title: string;
    company?: string;
    employmentType: 'full-time' | 'part-time' | 'student' | 'self-employed' | 'unemployed';
    income?: {
      range: string;
      verified: boolean;
    };
  };
  education: {
    level: string;
    institution?: string;
  };
  backgroundCheck: {
    completed: boolean;
    passedAt?: Date;
    reportUrl?: string;
  };
  references: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
    email: string;
    verified: boolean;
  }>;
  rating: {
    average: number;
    count: number;
  };
  compatibility: {
    traits: string[];
    dealBreakers: string[];
  };
  matches: mongoose.Types.ObjectId[];
  likedProfiles: mongoose.Types.ObjectId[];
  dislikedProfiles: mongoose.Types.ObjectId[];
  viewedProfiles: mongoose.Types.ObjectId[];
  profileViews: number;
  responseRate: number;
  responseTime: number; // in minutes
  lastActive: Date;
  isPremium: boolean;
  premiumExpiry?: Date;
  featured: boolean;
  featuredExpiry?: Date;
  isProfileComplete: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoommateProfileSchema = new Schema<IRoommateProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(RoommateStatus),
      default: RoommateStatus.SEARCHING,
    },
    headline: {
      type: String,
      required: [true, 'Headline is required'],
      maxlength: [100, 'Headline cannot exceed 100 characters'],
    },
    about: {
      type: String,
      required: [true, 'About section is required'],
      maxlength: [1000, 'About section cannot exceed 1000 characters'],
    },
    videoIntro: String,
    photos: [{
      type: String,
      validate: {
        validator: function(arr: string[]) {
          return arr.length <= 6;
        },
        message: 'Maximum 6 photos allowed',
      },
    }],
    location: {
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
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: String,
    },
    currentLiving: {
      hasPlace: { type: Boolean, required: true },
      lookingFor: {
        type: String,
        enum: ['roommate', 'room', 'both'],
        required: true,
      },
      canHost: Boolean,
    },
    matchingPreferences: {
      budget: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      moveInDate: { type: Date, required: true },
      leaseDuration: { type: Number, required: true }, // in months
      preferredAreas: [String],
      maxDistance: { type: Number, default: 10 }, // in km
      roomType: {
        type: String,
        enum: ['private', 'shared'],
        required: true,
      },
      amenities: [String],
    },
    lifestylePreferences: {
      sleepSchedule: {
        type: String,
        enum: ['early', 'moderate', 'late'],
        required: true,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      socialLevel: {
        type: String,
        enum: ['introvert', 'ambivert', 'extrovert'],
        required: true,
      },
      smoking: { type: Boolean, required: true },
      drinking: {
        type: String,
        enum: ['never', 'occasionally', 'regularly'],
        required: true,
      },
      pets: { type: Boolean, required: true },
      petTypes: [String],
      occupation: { type: String, required: true },
      hasVehicle: Boolean,
      guestsFrequency: {
        type: String,
        enum: ['never', 'rarely', 'sometimes', 'often'],
        required: true,
      },
    },
    interests: [String],
    languages: [String],
    occupation: {
      title: { type: String, required: true },
      company: String,
      employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'student', 'self-employed', 'unemployed'],
        required: true,
      },
      income: {
        range: String,
        verified: { type: Boolean, default: false },
      },
    },
    education: {
      level: String,
      institution: String,
    },
    backgroundCheck: {
      completed: { type: Boolean, default: false },
      passedAt: Date,
      reportUrl: String,
    },
    references: [{
      name: String,
      relationship: String,
      phoneNumber: String,
      email: String,
      verified: { type: Boolean, default: false },
    }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    compatibility: {
      traits: [String],
      dealBreakers: [String],
    },
    matches: [{
      type: Schema.Types.ObjectId,
      ref: 'RoommateProfile',
    }],
    likedProfiles: [{
      type: Schema.Types.ObjectId,
      ref: 'RoommateProfile',
    }],
    dislikedProfiles: [{
      type: Schema.Types.ObjectId,
      ref: 'RoommateProfile',
    }],
    viewedProfiles: [{
      type: Schema.Types.ObjectId,
      ref: 'RoommateProfile',
    }],
    profileViews: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    responseTime: { type: Number, default: 0 }, // in minutes
    lastActive: { type: Date, default: Date.now },
    isPremium: { type: Boolean, default: false },
    premiumExpiry: Date,
    featured: { type: Boolean, default: false },
    featuredExpiry: Date,
    isProfileComplete: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
RoommateProfileSchema.index({ 'location.coordinates': '2dsphere' });
RoommateProfileSchema.index({ status: 1 });
RoommateProfileSchema.index({ 'matchingPreferences.budget.min': 1, 'matchingPreferences.budget.max': 1 });
RoommateProfileSchema.index({ lastActive: -1 });
RoommateProfileSchema.index({ featured: -1, isPremium: -1 });

// Calculate profile completion percentage
RoommateProfileSchema.pre('save', function(next) {
  let completionScore = 0;
  const totalFields = 15;

  if (this.headline) completionScore++;
  if (this.about && this.about.length >= 100) completionScore++;
  if (this.photos && this.photos.length >= 3) completionScore++;
  if (this.videoIntro) completionScore++;
  if (this.interests && this.interests.length >= 3) completionScore++;
  if (this.languages && this.languages.length >= 1) completionScore++;
  if (this.occupation.title) completionScore++;
  if (this.education.level) completionScore++;
  if (this.references && this.references.length >= 1) completionScore++;
  if (this.matchingPreferences.budget.min > 0) completionScore++;
  if (this.matchingPreferences.preferredAreas.length > 0) completionScore++;
//   if (this.lifestylePreferences.interests) completionScore++;
  if (this.compatibility.traits.length > 0) completionScore++;
  if (this.compatibility.dealBreakers.length > 0) completionScore++;
  if (this.location.coordinates.length === 2) completionScore++;

  this.completionPercentage = Math.round((completionScore / totalFields) * 100);
  this.isProfileComplete = this.completionPercentage >= 80;

  next();
});

// Elasticsearch indexing hooks
RoommateProfileSchema.post('save', async function(this: any) {
  if (this.isProfileComplete) {
    try {
      const { elasticsearchService } = await import('../services/elasticsearch.service');
      if (elasticsearchService.isAvailable()) {
        await elasticsearchService.indexProfile(this._id.toString());
      }
    } catch (error) {
      // Silent fail for elasticsearch
    }
  }
});

RoommateProfileSchema.post('findOneAndDelete', async function(doc: any) {
  if (doc) {
    try {
      const { elasticsearchService } = await import('../services/elasticsearch.service');
      if (elasticsearchService.isAvailable()) {
        await elasticsearchService.deleteProfile(doc._id.toString());
      }
    } catch (error) {
      // Silent fail for elasticsearch
    }
  }
});
const RoommateProfile: Model<IRoommateProfile> = mongoose.model<IRoommateProfile>(
  'RoommateProfile',
  RoommateProfileSchema
);

export default RoommateProfile;