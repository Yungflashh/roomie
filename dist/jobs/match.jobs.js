"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleCompatibilityRecalculation = exports.scheduleMatchExpiration = void 0;
const bull_1 = __importDefault(require("bull"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Bull Queue with proper Redis auth
const matchQueue = new bull_1.default('match-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
// Error handling
matchQueue.on('error', (error) => {
    logger_1.logger.error('Match queue error:', error);
});
matchQueue.on('failed', (job, err) => {
    logger_1.logger.error(`Match job ${job.id} failed:`, err);
});
matchQueue.on('completed', (job) => {
    logger_1.logger.info(`Match job ${job.id} completed`);
});
// Process match expiration
matchQueue.process('expire-matches', async (job) => {
    try {
        const { matchId } = job.data;
        const match = await models_1.Match.findById(matchId);
        if (!match) {
            logger_1.logger.warn(`Match ${matchId} not found`);
            return;
        }
        if (match.status === 'pending') {
            match.status = 'expired';
            await match.save();
            logger_1.logger.info(`Match ${matchId} expired`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error expiring match:', error);
        throw error;
    }
});
// Process compatibility recalculation
matchQueue.process('recalculate-compatibility', async (job) => {
    try {
        const { profileId } = job.data;
        const profile = await models_1.RoommateProfile.findById(profileId);
        if (!profile) {
            logger_1.logger.warn(`Profile ${profileId} not found`);
            return;
        }
        // Find all matches for this profile
        const matches = await models_1.Match.find({
            $or: [{ profile1: profileId }, { profile2: profileId }],
            status: { $in: ['pending', 'accepted'] },
        });
        // Recalculate compatibility for each match
        for (const match of matches) {
            const matchDoc = match;
            const profile1 = await models_1.RoommateProfile.findById(matchDoc.profile1);
            const profile2 = await models_1.RoommateProfile.findById(matchDoc.profile2);
            if (profile1 && profile2) {
                // Simple compatibility calculation
                let score = 0;
                // Budget compatibility (30%)
                const budgetOverlap = Math.min(profile1.matchingPreferences.budget.max, profile2.matchingPreferences.budget.max) -
                    Math.max(profile1.matchingPreferences.budget.min, profile2.matchingPreferences.budget.min);
                if (budgetOverlap > 0) {
                    score += 30;
                }
                // Location compatibility (20%)
                if (profile1.location.city === profile2.location.city) {
                    score += 20;
                }
                // Lifestyle compatibility (50%)
                const lifestyleScore = calculateLifestyleCompatibility(profile1.lifestylePreferences, profile2.lifestylePreferences);
                score += lifestyleScore * 0.5;
                match.compatibilityScore = Math.round(score);
                await match.save();
                logger_1.logger.info(`Recalculated compatibility for match ${match._id}: ${score}%`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error recalculating compatibility:', error);
        throw error;
    }
});
// Helper function to calculate lifestyle compatibility
function calculateLifestyleCompatibility(lifestyle1, lifestyle2) {
    let score = 0;
    // Cleanliness (important)
    if (Math.abs(lifestyle1.cleanliness - lifestyle2.cleanliness) <= 1) {
        score += 20;
    }
    // Smoking (very important)
    if (lifestyle1.smoking === lifestyle2.smoking) {
        score += 25;
    }
    // Pets (very important)
    if (lifestyle1.pets === lifestyle2.pets) {
        score += 25;
    }
    // Drinking
    if (lifestyle1.drinking === lifestyle2.drinking) {
        score += 15;
    }
    // Social level
    if (lifestyle1.socialLevel === lifestyle2.socialLevel) {
        score += 10;
    }
    // Sleep schedule
    if (lifestyle1.sleepSchedule === lifestyle2.sleepSchedule) {
        score += 5;
    }
    return score;
}
// Add job to expire match
const scheduleMatchExpiration = async (matchId, expirationDate) => {
    const delay = expirationDate.getTime() - Date.now();
    if (delay > 0) {
        await matchQueue.add('expire-matches', { matchId }, {
            delay,
            jobId: `expire-match-${matchId}`,
        });
        logger_1.logger.info(`Scheduled match ${matchId} to expire at ${expirationDate}`);
    }
};
exports.scheduleMatchExpiration = scheduleMatchExpiration;
// Add job to recalculate compatibility
const scheduleCompatibilityRecalculation = async (profileId) => {
    await matchQueue.add('recalculate-compatibility', { profileId }, {
        jobId: `recalc-${profileId}-${Date.now()}`,
    });
    logger_1.logger.info(`Scheduled compatibility recalculation for profile ${profileId}`);
};
exports.scheduleCompatibilityRecalculation = scheduleCompatibilityRecalculation;
// Clean up old jobs on startup
matchQueue.clean(24 * 60 * 60 * 1000, 'completed');
matchQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
logger_1.logger.info('Match jobs scheduled');
exports.default = matchQueue;
//# sourceMappingURL=match.jobs.js.map