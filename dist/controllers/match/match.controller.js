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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const matching_service_1 = require("../../services/matching.service");
const analytics_service_1 = require("../../services/analytics.service");
const mongoose_1 = __importDefault(require("mongoose"));
class MatchController {
}
exports.MatchController = MatchController;
_a = MatchController;
// Get potential matches
MatchController.getPotentialMatches = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { minScore, maxDistance, limit } = req.query;
    const matches = await matching_service_1.MatchingService.findMatches(userId, {
        minScore: minScore ? parseInt(minScore) : undefined,
        maxDistance: maxDistance ? parseInt(maxDistance) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    apiResponse_1.ApiResponse.success(res, { matches, total: matches.length }, 'Potential matches retrieved successfully');
});
// Like a profile
MatchController.likeProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { profileId } = req.params;
    const { message } = req.body;
    const userProfile = await models_1.RoommateProfile.findOne({ user: userId });
    const targetProfile = await models_1.RoommateProfile.findById(profileId);
    if (!userProfile || !targetProfile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Check if already liked
    if (userProfile.likedProfiles.includes(targetProfile._id)) {
        throw new ApiError_1.default(400, 'Profile already liked');
    }
    // Add to liked profiles
    userProfile.likedProfiles.push(targetProfile._id);
    await userProfile.save();
    // Check if it's a mutual like (match!)
    const isMutualLike = targetProfile.likedProfiles.includes(userProfile._id);
    if (isMutualLike) {
        // Create match
        const match = await matching_service_1.MatchingService.createMatch(userId, targetProfile.user.toString(), message);
        await analytics_service_1.AnalyticsService.trackEvent({
            userId: userId,
            sessionId: req.cookies?.sessionId,
            eventCategory: 'match',
            eventName: 'match_created',
            properties: {
                matchId: match._id,
                compatibilityScore: match.compatibilityScore,
            },
            req,
        });
        // Update both profiles
        userProfile.matches.push(match._id);
        targetProfile.matches.push(match._id);
        await Promise.all([userProfile.save(), targetProfile.save()]);
        // Create chat room
        const chatRoom = await models_1.ChatRoom.create({
            participants: [userId, targetProfile.user],
            type: 'direct',
            relatedMatch: match._id,
            createdBy: userId,
        });
        match.chatRoom = chatRoom._id;
        match.status = 'accepted';
        match.acceptedAt = new Date();
        await match.save();
        // Send notification to the other user
        await models_1.Notification.create({
            recipient: targetProfile.user,
            sender: userId,
            type: 'match',
            title: 'New Match! 🎉',
            message: `You matched with ${(await models_1.User.findById(userId))?.firstName}!`,
            data: {
                matchId: match._id,
                chatRoomId: chatRoom._id,
            },
            priority: 'high',
        });
        // Emit socket event (we'll implement this later)
        const io = req.app.get('io');
        io.to(targetProfile.user.toString()).emit('new-match', {
            match,
            profile: userProfile,
        });
        apiResponse_1.ApiResponse.success(res, { isMatch: true, match, chatRoom }, "It's a match! 🎉");
    }
    else {
        // Send notification to the liked user
        await models_1.Notification.create({
            recipient: targetProfile.user,
            sender: userId,
            type: 'match',
            title: 'Someone liked your profile! 💙',
            message: message || `${(await models_1.User.findById(userId))?.firstName} liked your profile`,
            data: {
                userId: userId,
            },
            priority: 'medium',
        });
        apiResponse_1.ApiResponse.success(res, { isMatch: false }, 'Profile liked successfully');
    }
});
// Dislike a profile
MatchController.dislikeProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { profileId } = req.params;
    const userProfile = await models_1.RoommateProfile.findOne({ user: userId });
    const targetProfile = await models_1.RoommateProfile.findById(profileId);
    if (!userProfile || !targetProfile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Add to disliked profiles
    if (!userProfile.dislikedProfiles.includes(targetProfile._id)) {
        userProfile.dislikedProfiles.push(targetProfile._id);
        await userProfile.save();
    }
    apiResponse_1.ApiResponse.success(res, null, 'Profile disliked');
});
// Get all matches
MatchController.getMatches = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { status } = req.query;
    const query = {
        $or: [{ user1: userId }, { user2: userId }],
    };
    if (status) {
        query.status = status;
    }
    const matches = await models_1.Match.find(query)
        .populate({
        path: 'user1',
        select: 'firstName lastName email profilePicture age gender',
    })
        .populate({
        path: 'user2',
        select: 'firstName lastName email profilePicture age gender',
    })
        .populate('chatRoom')
        .sort({ createdAt: -1 });
    apiResponse_1.ApiResponse.success(res, { matches, total: matches.length }, 'Matches retrieved successfully');
});
// Get match by ID
MatchController.getMatchById = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const match = await models_1.Match.findById(matchId)
        .populate({
        path: 'user1',
        select: 'firstName lastName email profilePicture age gender bio',
    })
        .populate({
        path: 'user2',
        select: 'firstName lastName email profilePicture age gender bio',
    })
        .populate('chatRoom');
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1._id.toString() !== userId && match.user2._id.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    // Get both profiles
    const profile1 = await models_1.RoommateProfile.findOne({ user: match.user1._id });
    const profile2 = await models_1.RoommateProfile.findOne({ user: match.user2._id });
    apiResponse_1.ApiResponse.success(res, {
        match,
        profiles: {
            user1: profile1,
            user2: profile2,
        },
    }, 'Match details retrieved successfully');
});
// Accept match (if initiated by other user)
MatchController.acceptMatch = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const match = await models_1.Match.findById(matchId);
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    // Check if match is pending
    if (match.status !== 'pending') {
        throw new ApiError_1.default(400, 'Match is not pending');
    }
    // Accept match
    match.status = 'accepted';
    match.acceptedAt = new Date();
    await match.save();
    // Create chat room if not exists
    if (!match.chatRoom) {
        const chatRoom = await models_1.ChatRoom.create({
            participants: [match.user1, match.user2],
            type: 'direct',
            relatedMatch: match._id,
            createdBy: userId,
        });
        match.chatRoom = chatRoom._id;
        await match.save();
    }
    // Send notification
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    await models_1.Notification.create({
        recipient: otherUserId,
        sender: userId,
        type: 'match',
        title: 'Match Accepted! 🎉',
        message: `Your match request was accepted!`,
        data: {
            matchId: match._id,
            chatRoomId: match.chatRoom,
        },
        priority: 'high',
    });
    apiResponse_1.ApiResponse.success(res, { match }, 'Match accepted successfully');
});
// Reject match
MatchController.rejectMatch = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const match = await models_1.Match.findById(matchId);
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    match.status = 'rejected';
    match.rejectedAt = new Date();
    await match.save();
    apiResponse_1.ApiResponse.success(res, null, 'Match rejected');
});
// Unmatch
MatchController.unmatch = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { reason } = req.body;
    const match = await models_1.Match.findById(matchId);
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    match.status = 'rejected';
    match.unmatchedAt = new Date();
    match.unmatchReason = reason;
    await match.save();
    // Remove from both profiles' matches
    await models_1.RoommateProfile.updateMany({ user: { $in: [match.user1, match.user2] } }, { $pull: { matches: match._id } });
    // Archive the chat room
    if (match.chatRoom) {
        await models_1.ChatRoom.findByIdAndUpdate(match.chatRoom, { isArchived: true });
    }
    // Send notification to other user
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    await models_1.Notification.create({
        recipient: otherUserId,
        type: 'system',
        title: 'Match Ended',
        message: 'A match has been ended',
        priority: 'medium',
    });
    apiResponse_1.ApiResponse.success(res, null, 'Unmatched successfully');
});
// Report match
MatchController.reportMatch = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { reason } = req.body;
    const match = await models_1.Match.findById(matchId);
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    match.flags.isReported = true;
    match.flags.reportedBy = new mongoose_1.default.Types.ObjectId(userId);
    match.flags.reportReason = reason;
    await match.save();
    // Create a report in the Report model
    const { Report } = await Promise.resolve().then(() => __importStar(require('../../models')));
    const reportedUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    await Report.create({
        reporter: userId,
        reported: reportedUserId,
        type: 'match',
        reason,
        category: 'other',
        description: `Match reported: ${reason}`,
        relatedEntity: {
            entityType: 'Match',
            entityId: match._id,
        },
    });
    apiResponse_1.ApiResponse.success(res, null, 'Match reported successfully');
});
// Schedule meeting
MatchController.scheduleMeeting = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { date, location, type } = req.body;
    const match = await models_1.Match.findById(matchId);
    if (!match) {
        throw new ApiError_1.default(404, 'Match not found');
    }
    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
        throw new ApiError_1.default(403, 'You do not have access to this match');
    }
    // Check if match is accepted
    if (match.status !== 'accepted') {
        throw new ApiError_1.default(400, 'Can only schedule meetings with accepted matches');
    }
    match.meetingScheduled = true;
    match.meetingDetails = {
        date: new Date(date),
        location,
        type,
    };
    await match.save();
    // Send notification to other user
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    const user = await models_1.User.findById(userId);
    await models_1.Notification.create({
        recipient: otherUserId,
        sender: userId,
        type: 'system',
        title: 'Meeting Scheduled',
        message: `${user?.firstName} scheduled a meeting with you`,
        data: {
            matchId: match._id,
        },
        priority: 'high',
    });
    apiResponse_1.ApiResponse.success(res, { meeting: match.meetingDetails }, 'Meeting scheduled successfully');
});
// Get who liked my profile
MatchController.getWhoLikedMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const userProfile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!userProfile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Find profiles that liked this user
    const profilesWhoLikedMe = await models_1.RoommateProfile.find({
        likedProfiles: userProfile._id,
        _id: { $nin: userProfile.likedProfiles }, // Exclude mutual likes
    })
        .populate('user', 'firstName lastName email profilePicture age gender')
        .limit(50);
    apiResponse_1.ApiResponse.success(res, { profiles: profilesWhoLikedMe, total: profilesWhoLikedMe.length }, 'Profiles retrieved successfully');
});
// Get match statistics
MatchController.getMatchStats = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const userProfile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!userProfile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    const stats = {
        totalLikes: userProfile.likedProfiles.length,
        totalMatches: userProfile.matches.length,
        profileViews: userProfile.profileViews,
        completionPercentage: userProfile.completionPercentage,
        responseRate: userProfile.responseRate,
        averageResponseTime: userProfile.responseTime,
        status: userProfile.status,
    };
    // Get match status breakdown
    const matches = await models_1.Match.find({
        $or: [{ user1: userId }, { user2: userId }],
    });
    const matchStatusBreakdown = {
        pending: matches.filter(m => m.status === 'pending').length,
        accepted: matches.filter(m => m.status === 'accepted').length,
        rejected: matches.filter(m => m.status === 'rejected').length,
        expired: matches.filter(m => m.status === 'expired').length,
    };
    apiResponse_1.ApiResponse.success(res, {
        stats,
        matchStatusBreakdown,
    }, 'Statistics retrieved successfully');
});
//# sourceMappingURL=match.controller.js.map