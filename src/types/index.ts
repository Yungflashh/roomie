import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
}

export interface MatchingPreferences {
  budget: {
    min: number;
    max: number;
  };
  moveInDate: Date;
  leaseDuration: number;
  preferredAreas: string[];
  maxDistance: number;
  roomType: 'private' | 'shared';
  amenities: string[];
}

export interface LifestylePreferences {
  sleepSchedule: 'early' | 'moderate' | 'late';
  cleanliness: 1 | 2 | 3 | 4 | 5;
  socialLevel: 'introvert' | 'ambivert' | 'extrovert';
  smoking: boolean;
  drinking: 'never' | 'occasionally' | 'regularly';
  pets: boolean;
  petTypes?: string[];
  occupation: string;
  hasVehicle: boolean;
  guestsFrequency: 'never' | 'rarely' | 'sometimes' | 'often';
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  achievements: string[];
  currentStreak: number;
  longestStreak: number;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum RoommateStatus {
  SEARCHING = 'searching',
  MATCHED = 'matched',
  INACTIVE = 'inactive',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum NotificationType {
  MATCH = 'match',
  MESSAGE = 'message',
  GAME_INVITE = 'game_invite',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}