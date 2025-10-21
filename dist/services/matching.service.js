"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
class MatchingService {
    // Calculate compatibility score between two profiles
    static calculateCompatibilityScore(profile1, profile2) {
        let totalScore = 0;
        const breakdown = {};
        // 1. Budget compatibility (20 points)
        const budgetScore = this.calculateBudgetScore(profile1.matchingPreferences.budget, profile2.matchingPreferences.budget);
        totalScore += budgetScore;
        breakdown.budget = budgetScore;
        // 2. Location proximity (15 points)
        const locationScore = this.calculateLocationScore(profile1.location.coordinates, profile2.location.coordinates, profile1.matchingPreferences.maxDistance);
        totalScore += locationScore;
        breakdown.location = locationScore;
        // 3. Lifestyle compatibility (30 points)
        const lifestyleScore = this.calculateLifestyleScore(profile1.lifestylePreferences, profile2.lifestylePreferences);
        totalScore += lifestyleScore;
        breakdown.lifestyle = lifestyleScore;
        // 4. Interests overlap (15 points)
        const interestsScore = this.calculateInterestsScore(profile1.interests, profile2.interests);
        totalScore += interestsScore;
        breakdown.interests = interestsScore;
        // 5. Move-in date compatibility (10 points)
        const moveInScore = this.calculateMoveInDateScore(profile1.matchingPreferences.moveInDate, profile2.matchingPreferences.moveInDate);
        totalScore += moveInScore;
        breakdown.moveInDate = moveInScore;
        // 6. Lease duration compatibility (10 points)
        const leaseDurationScore = this.calculateLeaseDurationScore(profile1.matchingPreferences.leaseDuration, profile2.matchingPreferences.leaseDuration);
        totalScore += leaseDurationScore;
        breakdown.leaseDuration = leaseDurationScore;
        return {
            score: Math.round(totalScore),
            breakdown,
        };
    }
    // Budget compatibility
    static calculateBudgetScore(budget1, budget2) {
        const overlap = Math.min(budget1.max, budget2.max) - Math.max(budget1.min, budget2.min);
        const range1 = budget1.max - budget1.min;
        const range2 = budget2.max - budget2.min;
        const avgRange = (range1 + range2) / 2;
        if (overlap <= 0)
            return 0;
        const overlapPercentage = overlap / avgRange;
        return Math.min(20, overlapPercentage * 20);
    }
    // Location proximity (Haversine formula)
    static calculateLocationScore(coords1, coords2, maxDistance) {
        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        if (distance > maxDistance)
            return 0;
        // Closer = higher score
        const proximityPercentage = 1 - distance / maxDistance;
        return proximityPercentage * 15;
    }
    static toRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
    // Lifestyle compatibility
    static calculateLifestyleScore(lifestyle1, lifestyle2) {
        let score = 0;
        // Sleep schedule (6 points)
        if (lifestyle1.sleepSchedule === lifestyle2.sleepSchedule) {
            score += 6;
        }
        else if ((lifestyle1.sleepSchedule === 'moderate' || lifestyle2.sleepSchedule === 'moderate')) {
            score += 3;
        }
        // Cleanliness (6 points)
        const cleanlinessDiff = Math.abs(lifestyle1.cleanliness - lifestyle2.cleanliness);
        score += Math.max(0, 6 - cleanlinessDiff * 1.5);
        // Social level (5 points)
        if (lifestyle1.socialLevel === lifestyle2.socialLevel) {
            score += 5;
        }
        else if (lifestyle1.socialLevel === 'ambivert' || lifestyle2.socialLevel === 'ambivert') {
            score += 2.5;
        }
        // Smoking (5 points)
        if (lifestyle1.smoking === lifestyle2.smoking) {
            score += 5;
        }
        // Drinking (4 points)
        if (lifestyle1.drinking === lifestyle2.drinking) {
            score += 4;
        }
        else if ((lifestyle1.drinking === 'occasionally' || lifestyle2.drinking === 'occasionally')) {
            score += 2;
        }
        // Pets (4 points)
        if (lifestyle1.pets === lifestyle2.pets) {
            score += 4;
        }
        return score;
    }
    // Interests overlap
    static calculateInterestsScore(interests1, interests2) {
        if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
            return 0;
        }
        const commonInterests = interests1.filter(interest => interests2.includes(interest));
        const overlapPercentage = commonInterests.length / Math.max(interests1.length, interests2.length);
        return overlapPercentage * 15;
    }
    // Move-in date compatibility
    static calculateMoveInDateScore(date1, date2) {
        const diffDays = Math.abs((new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7)
            return 10; // Within a week
        if (diffDays <= 14)
            return 8; // Within 2 weeks
        if (diffDays <= 30)
            return 5; // Within a month
        if (diffDays <= 60)
            return 2; // Within 2 months
        return 0;
    }
    // Lease duration compatibility
    static calculateLeaseDurationScore(duration1, duration2) {
        const diffMonths = Math.abs(duration1 - duration2);
        if (diffMonths === 0)
            return 10;
        if (diffMonths <= 3)
            return 7;
        if (diffMonths <= 6)
            return 4;
        return 0;
    }
    // Find potential matches for a user
    static async findMatches(userId, filters) {
        try {
            const userProfile = await models_1.RoommateProfile.findOne({ user: userId });
            if (!userProfile) {
                throw new Error('Profile not found');
            }
            // Get user's blocked users
            const user = await models_1.User.findById(userId);
            const blockedUserIds = user?.blockedUsers || [];
            // Get already matched, liked, or disliked profiles
            const excludeProfiles = [
                ...userProfile.matches,
                ...userProfile.likedProfiles,
                ...userProfile.dislikedProfiles,
            ];
            // Build query
            const query = {
                _id: { $ne: userProfile._id, $nin: excludeProfiles },
                user: { $nin: [userId, ...blockedUserIds] },
                status: 'searching',
                isProfileComplete: true,
            };
            // Location-based filtering
            if (userProfile.matchingPreferences.preferredAreas.length > 0) {
                query['location.city'] = {
                    $in: userProfile.matchingPreferences.preferredAreas,
                };
            }
            else {
                // Use geospatial query
                query['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: userProfile.location.coordinates,
                        },
                        $maxDistance: (filters?.maxDistance || userProfile.matchingPreferences.maxDistance) * 1000, // Convert km to meters
                    },
                };
            }
            // Budget overlap
            query['matchingPreferences.budget.max'] = { $gte: userProfile.matchingPreferences.budget.min };
            query['matchingPreferences.budget.min'] = { $lte: userProfile.matchingPreferences.budget.max };
            // Find potential matches
            const potentialMatches = await models_1.RoommateProfile.find(query)
                .populate('user', 'firstName lastName email profilePicture age gender')
                .limit(filters?.limit || 50);
            // Calculate compatibility scores
            const matchesWithScores = potentialMatches.map(profile => {
                const compatibility = this.calculateCompatibilityScore(userProfile, profile);
                return {
                    profile,
                    compatibilityScore: compatibility.score,
                    breakdown: compatibility.breakdown,
                };
            });
            // Filter by minimum score and sort
            const minScore = filters?.minScore || 50;
            const filteredMatches = matchesWithScores
                .filter(match => match.compatibilityScore >= minScore)
                .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
            return filteredMatches;
        }
        catch (error) {
            logger_1.logger.error(`Error finding matches: ${error}`);
            throw error;
        }
    }
    // Create a match between two users
    static async createMatch(userId1, userId2, message) {
        try {
            // Get profiles
            const profile1 = await models_1.RoommateProfile.findOne({ user: userId1 });
            const profile2 = await models_1.RoommateProfile.findOne({ user: userId2 });
            if (!profile1 || !profile2) {
                throw new Error('One or both profiles not found');
            }
            // Calculate compatibility
            const compatibility = this.calculateCompatibilityScore(profile1, profile2);
            // Check if match already exists
            const existingMatch = await models_1.Match.findOne({
                $or: [
                    { user1: userId1, user2: userId2 },
                    { user1: userId2, user2: userId1 },
                ],
            });
            if (existingMatch) {
                throw new Error('Match already exists');
            }
            // Create match
            const match = await models_1.Match.create({
                user1: userId1,
                user2: userId2,
                compatibilityScore: compatibility.score,
                initiatedBy: userId1,
                message,
                status: 'pending',
            });
            return match;
        }
        catch (error) {
            logger_1.logger.error(`Error creating match: ${error}`);
            throw error;
        }
    }
}
exports.MatchingService = MatchingService;
//# sourceMappingURL=matching.service.js.map