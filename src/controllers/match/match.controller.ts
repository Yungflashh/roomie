import { Response } from 'express';
import { AuthRequest } from '../../types';
import { Match, RoommateProfile, User, ChatRoom, Notification } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { MatchingService } from '../../services/matching.service';
import { AnalyticsService } from '../../services/analytics.service';

import mongoose from 'mongoose';

export class MatchController {
  // Get potential matches
  static getPotentialMatches = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { minScore, maxDistance, limit } = req.query;

    const matches = await MatchingService.findMatches(userId!, {
      minScore: minScore ? parseInt(minScore as string) : undefined,
      maxDistance: maxDistance ? parseInt(maxDistance as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    ApiResponse.success(
      res,
      { matches, total: matches.length },
      'Potential matches retrieved successfully'
    );
  });

  // Like a profile
  static likeProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { profileId } = req.params;
    const { message } = req.body;

    const userProfile = await RoommateProfile.findOne({ user: userId });
    const targetProfile = await RoommateProfile.findById(profileId);

    if (!userProfile || !targetProfile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Check if already liked
  
if (userProfile.likedProfiles.includes(targetProfile._id as any)) {
  throw new ApiError(400, 'Profile already liked');
}

// Add to liked profiles
userProfile.likedProfiles.push(targetProfile._id as any);
await userProfile.save();

// Check if it's a mutual like (match!)
const isMutualLike = targetProfile.likedProfiles.includes(userProfile._id as any);

    if (isMutualLike) {
      // Create match
      const match = await MatchingService.createMatch(
        userId!,
        targetProfile.user.toString(),
        message
      );

          await AnalyticsService.trackEvent({
      userId: userId!,
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
      const chatRoom = await ChatRoom.create({
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
      await Notification.create({
        recipient: targetProfile.user,
        sender: userId,
        type: 'match',
        title: 'New Match! 🎉',
        message: `You matched with ${(await User.findById(userId))?.firstName}!`,
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

      ApiResponse.success(
        res,
        { isMatch: true, match, chatRoom },
        "It's a match! 🎉"
      );
    } else {
      // Send notification to the liked user
      await Notification.create({
        recipient: targetProfile.user,
        sender: userId,
        type: 'match',
        title: 'Someone liked your profile! 💙',
        message: message || `${(await User.findById(userId))?.firstName} liked your profile`,
        data: {
          userId: userId,
        },
        priority: 'medium',
      });

      ApiResponse.success(res, { isMatch: false }, 'Profile liked successfully');
    }
  });

  // Dislike a profile
  static dislikeProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { profileId } = req.params;

    const userProfile = await RoommateProfile.findOne({ user: userId });
    const targetProfile = await RoommateProfile.findById(profileId);

    if (!userProfile || !targetProfile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Add to disliked profiles
    if (!userProfile.dislikedProfiles.includes(targetProfile._id as any)) {
  userProfile.dislikedProfiles.push(targetProfile._id as any);
  await userProfile.save();
}

    ApiResponse.success(res, null, 'Profile disliked');
  });

  // Get all matches
  static getMatches = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { status } = req.query;

    const query: any = {
      $or: [{ user1: userId }, { user2: userId }],
    };

    if (status) {
      query.status = status;
    }

    const matches = await Match.find(query)
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

    ApiResponse.success(res, { matches, total: matches.length }, 'Matches retrieved successfully');
  });

  // Get match by ID
  static getMatchById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
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
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1._id.toString() !== userId && match.user2._id.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    // Get both profiles
    const profile1 = await RoommateProfile.findOne({ user: match.user1._id });
    const profile2 = await RoommateProfile.findOne({ user: match.user2._id });

    ApiResponse.success(
      res,
      {
        match,
        profiles: {
          user1: profile1,
          user2: profile2,
        },
      },
      'Match details retrieved successfully'
    );
  });

  // Accept match (if initiated by other user)
  static acceptMatch = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    // Check if match is pending
    if (match.status !== 'pending') {
      throw new ApiError(400, 'Match is not pending');
    }

    // Accept match
    match.status = 'accepted';
    match.acceptedAt = new Date();
    await match.save();

    // Create chat room if not exists
    if (!match.chatRoom) {
      const chatRoom = await ChatRoom.create({
        participants: [match.user1, match.user2],
        type: 'direct',
        relatedMatch: match._id,
        createdBy: userId,
      });

            match.chatRoom = chatRoom._id as any;
          await match.save();
    }

    // Send notification
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    await Notification.create({
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

    ApiResponse.success(res, { match }, 'Match accepted successfully');
  });

  // Reject match
  static rejectMatch = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    match.status = 'rejected';
    match.rejectedAt = new Date();
    await match.save();

    ApiResponse.success(res, null, 'Match rejected');
  });

  // Unmatch
  static unmatch = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { reason } = req.body;

    const match = await Match.findById(matchId);

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    match.status = 'rejected';
    match.unmatchedAt = new Date();
    match.unmatchReason = reason;
    await match.save();

    // Remove from both profiles' matches
    await RoommateProfile.updateMany(
      { user: { $in: [match.user1, match.user2] } },
      { $pull: { matches: match._id } }
    );

    // Archive the chat room
    if (match.chatRoom) {
      await ChatRoom.findByIdAndUpdate(match.chatRoom, { isArchived: true });
    }

    // Send notification to other user
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
    await Notification.create({
      recipient: otherUserId,
      type: 'system',
      title: 'Match Ended',
      message: 'A match has been ended',
      priority: 'medium',
    });

    ApiResponse.success(res, null, 'Unmatched successfully');
  });

  // Report match
  static reportMatch = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { reason } = req.body;

    const match = await Match.findById(matchId);

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    match.flags.isReported = true;
    match.flags.reportedBy = new mongoose.Types.ObjectId(userId);
    match.flags.reportReason = reason;
    await match.save();

    // Create a report in the Report model
    const { Report } = await import('../../models');
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

    ApiResponse.success(res, null, 'Match reported successfully');
  });

  // Schedule meeting
  static scheduleMeeting = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { date, location, type } = req.body;

    const match = await Match.findById(matchId);

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    // Check if user is part of the match
    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this match');
    }

    // Check if match is accepted
    if (match.status !== 'accepted') {
      throw new ApiError(400, 'Can only schedule meetings with accepted matches');
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
    const user = await User.findById(userId);

    await Notification.create({
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

    ApiResponse.success(res, { meeting: match.meetingDetails }, 'Meeting scheduled successfully');
  });

  // Get who liked my profile
  static getWhoLikedMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const userProfile = await RoommateProfile.findOne({ user: userId });

    if (!userProfile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Find profiles that liked this user
    const profilesWhoLikedMe = await RoommateProfile.find({
      likedProfiles: userProfile._id,
      _id: { $nin: userProfile.likedProfiles }, // Exclude mutual likes
    })
      .populate('user', 'firstName lastName email profilePicture age gender')
      .limit(50);

    ApiResponse.success(
      res,
      { profiles: profilesWhoLikedMe, total: profilesWhoLikedMe.length },
      'Profiles retrieved successfully'
    );
  });

  // Get match statistics
  static getMatchStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const userProfile = await RoommateProfile.findOne({ user: userId });

    if (!userProfile) {
      throw new ApiError(404, 'Profile not found');
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
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
    });

    const matchStatusBreakdown = {
      pending: matches.filter(m => m.status === 'pending').length,
      accepted: matches.filter(m => m.status === 'accepted').length,
      rejected: matches.filter(m => m.status === 'rejected').length,
      expired: matches.filter(m => m.status === 'expired').length,
    };

    ApiResponse.success(
      res,
      {
        stats,
        matchStatusBreakdown,
      },
      'Statistics retrieved successfully'
    );
  });
}