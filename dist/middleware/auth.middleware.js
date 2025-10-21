"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSubscription = exports.requireCompleteProfile = exports.requirePhoneVerification = exports.requireEmailVerification = exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
// Protect routes - require authentication
const protect = async (req, res, next) => {
    try {
        let token;
        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            throw new ApiError_1.default(401, 'You are not logged in. Please log in to get access.');
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists
        const user = await models_1.User.findById(decoded.id);
        if (!user) {
            throw new ApiError_1.default(401, 'The user belonging to this token no longer exists.');
        }
        // Check if user is active
        if (!user.isActive) {
            throw new ApiError_1.default(401, 'Your account has been deactivated. Please contact support.');
        }
        // Grant access to protected route
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new ApiError_1.default(401, 'Invalid token. Please log in again.'));
        }
        else if (error.name === 'TokenExpiredError') {
            next(new ApiError_1.default(401, 'Your token has expired. Please log in again.'));
        }
        else {
            next(error);
        }
    }
};
exports.protect = protect;
// Restrict to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            return next(new ApiError_1.default(403, 'You do not have permission to perform this action'));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
// Require email verification
const requireEmailVerification = async (req, res, next) => {
    const authReq = req;
    try {
        const user = await models_1.User.findById(authReq.user?.id);
        if (!user) {
            throw new ApiError_1.default(404, 'User not found');
        }
        if (!user.isEmailVerified) {
            throw new ApiError_1.default(403, 'Please verify your email to access this resource');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireEmailVerification = requireEmailVerification;
// Require phone verification
const requirePhoneVerification = async (req, res, next) => {
    const authReq = req;
    try {
        const user = await models_1.User.findById(authReq.user?.id);
        if (!user) {
            throw new ApiError_1.default(404, 'User not found');
        }
        if (!user.isPhoneVerified) {
            throw new ApiError_1.default(403, 'Please verify your phone number to access this resource');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requirePhoneVerification = requirePhoneVerification;
// Require complete profile
const requireCompleteProfile = async (req, res, next) => {
    const authReq = req;
    try {
        const { RoommateProfile } = await Promise.resolve().then(() => __importStar(require('../models')));
        const profile = await RoommateProfile.findOne({ user: authReq.user?.id });
        if (!profile || !profile.isProfileComplete) {
            throw new ApiError_1.default(403, 'Please complete your profile to access this resource');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireCompleteProfile = requireCompleteProfile;
// Require subscription (Premium/Pro)
const requireSubscription = async (req, res, next) => {
    const authReq = req;
    try {
        const user = await models_1.User.findById(authReq.user?.id);
        if (!user) {
            throw new ApiError_1.default(404, 'User not found');
        }
        // Check if user has premium subscription
        const { Subscription } = await Promise.resolve().then(() => __importStar(require('../models')));
        const subscription = await Subscription.findOne({
            user: user._id,
            status: 'active'
        });
        if (!subscription || subscription.plan === 'basic') {
            throw new ApiError_1.default(403, 'This feature requires a premium subscription');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireSubscription = requireSubscription;
//# sourceMappingURL=auth.middleware.js.map