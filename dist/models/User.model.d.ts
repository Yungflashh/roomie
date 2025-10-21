import mongoose, { Document, Model } from 'mongoose';
import { UserRole, VerificationStatus } from '../types';
export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    profilePicture?: string;
    stripeCustomerId?: string;
    bio?: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    verificationStatus: VerificationStatus;
    verificationDocuments?: string[];
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
    };
    socialAuth?: {
        googleId?: string;
        facebookId?: string;
        appleId?: string;
        provider?: 'google' | 'facebook' | 'apple';
    };
    preferences: {
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        privacy: {
            showProfile: boolean;
            showLocation: boolean;
            allowTracking: boolean;
        };
    };
    deviceTokens: string[];
    lastLogin?: Date;
    isActive: boolean;
    isBlocked: boolean;
    blockedUsers: mongoose.Types.ObjectId[];
    refreshTokens: string[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    twoFactorSecret?: string;
    twoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generatePasswordResetToken(): string;
    generateEmailVerificationToken(): string;
}
declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.model.d.ts.map