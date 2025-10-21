import mongoose, { Document, Model } from 'mongoose';
import { MatchingPreferences, LifestylePreferences, RoommateStatus, Location } from '../types';
export interface IRoommateProfile extends Document {
    user: mongoose.Types.ObjectId;
    status: RoommateStatus;
    headline: string;
    about: string;
    videoIntro?: string;
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
    responseTime: number;
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
declare const RoommateProfile: Model<IRoommateProfile>;
export default RoommateProfile;
//# sourceMappingURL=RoommateProfile.model.d.ts.map