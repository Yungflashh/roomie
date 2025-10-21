"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
// @ts-ignore
const passport_apple_1 = __importDefault(require("passport-apple"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
// Serialize user for session
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
// Deserialize user from session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await models_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await models_1.User.findOne({
                $or: [
                    { 'socialAuth.googleId': profile.id },
                    { email: profile.emails?.[0]?.value },
                ],
            });
            if (user) {
                // Update Google ID if not set
                if (!user.socialAuth?.googleId) {
                    user.socialAuth = {
                        ...user.socialAuth,
                        googleId: profile.id,
                    };
                    await user.save();
                }
                return done(null, user);
            }
            // Create new user
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email found in Google profile'), undefined);
            }
            user = await models_1.User.create({
                email,
                firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
                lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                profilePicture: profile.photos?.[0]?.value,
                isEmailVerified: true, // Google emails are verified
                socialAuth: {
                    googleId: profile.id,
                    provider: 'google',
                },
                dateOfBirth: new Date('2000-01-01'), // Default, user should update
                gender: 'prefer_not_to_say',
                password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random password
            });
            done(null, user);
        }
        catch (error) {
            logger_1.logger.error('Google OAuth error:', error);
            done(error, undefined);
        }
    }));
}
// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await models_1.User.findOne({
                $or: [
                    { 'socialAuth.facebookId': profile.id },
                    { email: profile.emails?.[0]?.value },
                ],
            });
            if (user) {
                // Update Facebook ID if not set
                if (!user.socialAuth?.facebookId) {
                    user.socialAuth = {
                        ...user.socialAuth,
                        facebookId: profile.id,
                    };
                    await user.save();
                }
                return done(null, user);
            }
            // Create new user
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email found in Facebook profile'), undefined);
            }
            user = await models_1.User.create({
                email,
                firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
                lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                profilePicture: profile.photos?.[0]?.value,
                isEmailVerified: true,
                socialAuth: {
                    facebookId: profile.id,
                    provider: 'facebook',
                },
                dateOfBirth: new Date('2000-01-01'),
                gender: 'prefer_not_to_say',
                password: Math.random().toString(36).slice(-8) + 'Aa1!',
            });
            done(null, user);
        }
        catch (error) {
            logger_1.logger.error('Facebook OAuth error:', error);
            done(error, undefined);
        }
    }));
}
// Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY_PATH) {
    passport_1.default.use(new passport_apple_1.default({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/apple/callback`,
        passReqToCallback: false,
    }, async (accessToken, refreshToken, idToken, profile, done) => {
        try {
            const { sub: appleId, email } = idToken;
            // Check if user already exists
            let user = await models_1.User.findOne({
                $or: [{ 'socialAuth.appleId': appleId }, { email }],
            });
            if (user) {
                // Update Apple ID if not set
                if (!user.socialAuth?.appleId) {
                    user.socialAuth = {
                        ...user.socialAuth,
                        appleId,
                    };
                    await user.save();
                }
                return done(null, user);
            }
            if (!email) {
                return done(new Error('No email found in Apple profile'), undefined);
            }
            // Create new user
            user = await models_1.User.create({
                email,
                firstName: profile?.name?.firstName || 'User',
                lastName: profile?.name?.lastName || '',
                isEmailVerified: true,
                socialAuth: {
                    appleId,
                    provider: 'apple',
                },
                dateOfBirth: new Date('2000-01-01'),
                gender: 'prefer_not_to_say',
                password: Math.random().toString(36).slice(-8) + 'Aa1!',
            });
            done(null, user);
        }
        catch (error) {
            logger_1.logger.error('Apple OAuth error:', error);
            done(error, undefined);
        }
    }));
}
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map