import { Response } from 'express';
import { AuthRequest } from '../../types';
import { RoommateProfile, User, Match } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { CloudinaryUpload } from '../../utils/cloudinary.upload';

export class ProfileController {
  // Create roommate profile
  static createProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Check if profile already exists
    const existingProfile = await RoommateProfile.findOne({ user: userId });
    if (existingProfile) {
      throw new ApiError(400, 'Profile already exists. Use update endpoint instead.');
    }

    const {
      headline,
      about,
      location,
      currentLiving,
      matchingPreferences,
      lifestylePreferences,
      interests,
      languages,
      occupation,
      education,
      compatibility,
    } = req.body;

    // Create profile
    const profile = await RoommateProfile.create({
      user: userId,
      headline,
      about,
      location,
      currentLiving,
      matchingPreferences,
      lifestylePreferences,
      interests,
      languages,
      occupation,
      education,
      compatibility,
    });

    await profile.populate('user', 'firstName lastName email profilePicture');

    ApiResponse.created(res, { profile }, 'Profile created successfully');
  });

  // Update roommate profile
  static updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found. Please create a profile first.');
    }

    // Fields that can be updated
    const allowedUpdates = [
      'headline',
      'about',
      'location',
      'currentLiving',
      'matchingPreferences',
      'lifestylePreferences',
      'interests',
      'languages',
      'occupation',
      'education',
      'compatibility',
      'status',
    ];

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (profile as any)[field] = req.body[field];
      }
    });

    await profile.save();
    await profile.populate('user', 'firstName lastName email profilePicture');

    ApiResponse.success(res, { profile }, 'Profile updated successfully');
  });

  // Upload profile photos
  static uploadPhotos = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files uploaded');
    }

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Check if adding these photos would exceed the limit
    if (profile.photos.length + files.length > 6) {
      throw new ApiError(400, 'Maximum 6 photos allowed');
    }

    // Upload photos to Cloudinary
    const uploadPromises = files.map(file =>
      CloudinaryUpload.uploadImage(file.buffer, `roommate-finder/profiles/${userId}`, {
        width: 800,
        height: 800,
        quality: 85,
      })
    );

    const photoUrls = await Promise.all(uploadPromises);

    // Add to profile
    profile.photos.push(...photoUrls);
    await profile.save();

    ApiResponse.success(res, { photos: profile.photos }, 'Photos uploaded successfully');
  });

  // Delete profile photo
  static deletePhoto = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { photoUrl } = req.body;

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Remove photo from array
    profile.photos = profile.photos.filter(photo => photo !== photoUrl);
    await profile.save();

    // TODO: Delete from Cloudinary (extract public_id from URL)

    ApiResponse.success(res, { photos: profile.photos }, 'Photo deleted successfully');
  });

  // Upload video intro
  static uploadVideoIntro = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, 'No video file uploaded');
    }

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Upload video to Cloudinary (max 30 seconds)
    const videoUrl = await CloudinaryUpload.uploadVideo(
      file.buffer,
      `roommate-finder/videos/${userId}`
    );

    profile.videoIntro = videoUrl;
    await profile.save();

    ApiResponse.success(res, { videoIntro: videoUrl }, 'Video intro uploaded successfully');
  });

  // Get own profile
  static getMyProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const profile = await RoommateProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email profilePicture age gender')
      .populate('matches', 'user1 user2 compatibilityScore status');

    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    ApiResponse.success(res, { profile }, 'Profile retrieved successfully');
  });

  // Get profile by ID
  static getProfileById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const currentUserId = req.user?.id;

    const profile = await RoommateProfile.findById(profileId)
      .populate('user', 'firstName lastName email profilePicture age gender bio');

    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Check if current user has blocked this profile's user
    const currentUser = await User.findById(currentUserId);
    if (currentUser?.blockedUsers.includes(profile.user._id)) {
      throw new ApiError(403, 'You have blocked this user');
    }

    // Increment profile views if not own profile
    if (profile.user._id.toString() !== currentUserId) {
      profile.profileViews += 1;
      
      // Add to viewed profiles
      const currentProfile = await RoommateProfile.findOne({ user: currentUserId });
      if (currentProfile && !currentProfile.viewedProfiles.includes(profile._id as any)) {
  currentProfile.viewedProfiles.push(profile._id as any);
  await currentProfile.save({ validateBeforeSave: false });
}

      await profile.save({ validateBeforeSave: false });
    }

    ApiResponse.success(res, { profile }, 'Profile retrieved successfully');
  });

  // Delete profile
  static deleteProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const profile = await RoommateProfile.findOneAndDelete({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // TODO: Clean up related data (matches, photos, etc.) in background job

    ApiResponse.success(res, null, 'Profile deleted successfully');
  });

  // Add reference
  static addReference = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { name, relationship, phoneNumber, email } = req.body;

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    if (profile.references.length >= 5) {
      throw new ApiError(400, 'Maximum 5 references allowed');
    }

    profile.references.push({
      name,
      relationship,
      phoneNumber,
      email,
      verified: false,
    });

    await profile.save();

    ApiResponse.success(res, { references: profile.references }, 'Reference added successfully');
  });

  // Update profile status
  static updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { status } = req.body;

    const profile = await RoommateProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    profile.status = status;
    profile.lastActive = new Date();
    await profile.save();

    ApiResponse.success(res, { status: profile.status }, 'Status updated successfully');
  });
}