import request from 'supertest';
import { app } from '../../src/server';
import { User, RoommateProfile } from '../../src/models';
import { MatchingService } from '../../src/services/matching.service';

describe('Matching Service', () => {
  let user1Id: string;
  let user2Id: string;
  let profile1: any;
  let profile2: any;

  beforeEach(async () => {
    // Create two users
    const user1 = await User.create({
      email: 'user1@example.com',
      password: 'Password@123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      isEmailVerified: true,
    });

    const user2 = await User.create({
      email: 'user2@example.com',
      password: 'Password@123',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1996-01-01'),
      gender: 'female',
      isEmailVerified: true,
    });

    user1Id = user1._id.toString();
    user2Id = user2._id.toString();

    // Create profiles
    profile1 = await RoommateProfile.create({
      user: user1Id,
      headline: 'Looking for a roommate',
      about: 'Clean, responsible, and friendly person looking for a compatible roommate.',
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
      },
      currentLiving: {
        hasPlace: false,
        lookingFor: 'room',
      },
      matchingPreferences: {
        budget: { min: 800, max: 1200 },
        moveInDate: new Date('2025-12-01'),
        leaseDuration: 12,
        preferredAreas: ['San Francisco'],
        maxDistance: 10,
        roomType: 'private',
        amenities: ['parking', 'gym'],
      },
      lifestylePreferences: {
        sleepSchedule: 'moderate',
        cleanliness: 4,
        socialLevel: 'ambivert',
        smoking: false,
        drinking: 'occasionally',
        pets: false,
        occupation: 'Software Engineer',
        guestsFrequency: 'rarely',
      },
      interests: ['coding', 'hiking', 'movies'],
      languages: ['English'],
      occupation: {
        title: 'Software Engineer',
        employmentType: 'full-time',
      },
      compatibility: {
        traits: ['responsible', 'clean', 'quiet'],
        dealBreakers: ['smoking', 'loud music'],
      },
    });

    profile2 = await RoommateProfile.create({
      user: user2Id,
      headline: 'Clean roommate needed',
      about: 'Professional looking for a clean and respectful roommate to share apartment.',
      location: {
        type: 'Point',
        coordinates: [-122.4084, 37.7849], // Also San Francisco
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
      },
      currentLiving: {
        hasPlace: true,
        lookingFor: 'roommate',
      },
      matchingPreferences: {
        budget: { min: 900, max: 1300 },
        moveInDate: new Date('2025-12-15'),
        leaseDuration: 12,
        preferredAreas: ['San Francisco'],
        maxDistance: 10,
        roomType: 'private',
        amenities: ['parking'],
      },
      lifestylePreferences: {
        sleepSchedule: 'moderate',
        cleanliness: 5,
        socialLevel: 'introvert',
        smoking: false,
        drinking: 'never',
        pets: false,
        occupation: 'Designer',
        guestsFrequency: 'never',
      },
      interests: ['reading', 'hiking', 'yoga'],
      languages: ['English'],
      occupation: {
        title: 'UX Designer',
        employmentType: 'full-time',
      },
      compatibility: {
        traits: ['quiet', 'organized', 'respectful'],
        dealBreakers: ['smoking', 'pets'],
      },
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('should calculate compatibility score between two profiles', () => {
      const result = MatchingService.calculateCompatibilityScore(profile1, profile2);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('breakdown');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('budget');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('lifestyle');
    });

    it('should give higher scores for more compatible profiles', () => {
      const result = MatchingService.calculateCompatibilityScore(profile1, profile2);
      expect(result.score).toBeGreaterThan(50); // These profiles should be fairly compatible
    });
  });

  describe('findMatches', () => {
    it('should find potential matches for a user', async () => {
      const matches = await MatchingService.findMatches(user1Id);

      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveProperty('profile');
      expect(matches[0]).toHaveProperty('compatibilityScore');
      expect(matches[0]).toHaveProperty('breakdown');
    });

    it('should filter matches by minimum score', async () => {
      const matches = await MatchingService.findMatches(user1Id, {
        minScore: 70,
      });

      matches.forEach((match) => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should sort matches by compatibility score', async () => {
      const matches = await MatchingService.findMatches(user1Id);

      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].compatibilityScore).toBeGreaterThanOrEqual(
          matches[i + 1].compatibilityScore
        );
      }
    });
  });
});