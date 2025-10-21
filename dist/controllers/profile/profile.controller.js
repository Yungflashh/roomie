"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const cloudinary_upload_1 = require("../../utils/cloudinary.upload");
class ProfileController {
}
exports.ProfileController = ProfileController;
_a = ProfileController;
// Create roommate profile
ProfileController.createProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Check if profile already exists
    const existingProfile = await models_1.RoommateProfile.findOne({ user: userId });
    if (existingProfile) {
        throw new ApiError_1.default(400, 'Profile already exists. Use update endpoint instead.');
    }
    const { headline, about, location, currentLiving, matchingPreferences, lifestylePreferences, interests, languages, occupation, education, compatibility, } = req.body;
    // Create profile
    const profile = await models_1.RoommateProfile.create({
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
    apiResponse_1.ApiResponse.created(res, { profile }, 'Profile created successfully');
});
// Update roommate profile
ProfileController.updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found. Please create a profile first.');
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
            profile[field] = req.body[field];
        }
    });
    await profile.save();
    await profile.populate('user', 'firstName lastName email profilePicture');
    apiResponse_1.ApiResponse.success(res, { profile }, 'Profile updated successfully');
});
// Upload profile photos
ProfileController.uploadPhotos = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const files = req.files;
    if (!files || files.length === 0) {
        throw new ApiError_1.default(400, 'No files uploaded');
    }
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Check if adding these photos would exceed the limit
    if (profile.photos.length + files.length > 6) {
        throw new ApiError_1.default(400, 'Maximum 6 photos allowed');
    }
    // Upload photos to Cloudinary
    const uploadPromises = files.map(file => cloudinary_upload_1.CloudinaryUpload.uploadImage(file.buffer, `roommate-finder/profiles/${userId}`, {
        width: 800,
        height: 800,
        quality: 85,
    }));
    const photoUrls = await Promise.all(uploadPromises);
    // Add to profile
    profile.photos.push(...photoUrls);
    await profile.save();
    apiResponse_1.ApiResponse.success(res, { photos: profile.photos }, 'Photos uploaded successfully');
});
// Delete profile photo
ProfileController.deletePhoto = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { photoUrl } = req.body;
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Remove photo from array
    profile.photos = profile.photos.filter(photo => photo !== photoUrl);
    await profile.save();
    // TODO: Delete from Cloudinary (extract public_id from URL)
    apiResponse_1.ApiResponse.success(res, { photos: profile.photos }, 'Photo deleted successfully');
});
// Upload video intro
ProfileController.uploadVideoIntro = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const file = req.file;
    if (!file) {
        throw new ApiError_1.default(400, 'No video file uploaded');
    }
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Upload video to Cloudinary (max 30 seconds)
    const videoUrl = await cloudinary_upload_1.CloudinaryUpload.uploadVideo(file.buffer, `roommate-finder/videos/${userId}`);
    profile.videoIntro = videoUrl;
    await profile.save();
    apiResponse_1.ApiResponse.success(res, { videoIntro: videoUrl }, 'Video intro uploaded successfully');
});
// Get own profile
ProfileController.getMyProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const profile = await models_1.RoommateProfile.findOne({ user: userId })
        .populate('user', 'firstName lastName email profilePicture age gender')
        .populate('matches', 'user1 user2 compatibilityScore status');
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    apiResponse_1.ApiResponse.success(res, { profile }, 'Profile retrieved successfully');
});
// Get profile by ID
ProfileController.getProfileById = (0, catchAsync_1.default)(async (req, res) => {
    const { profileId } = req.params;
    const currentUserId = req.user?.id;
    const profile = await models_1.RoommateProfile.findById(profileId)
        .populate('user', 'firstName lastName email profilePicture age gender bio');
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // Check if current user has blocked this profile's user
    const currentUser = await models_1.User.findById(currentUserId);
    if (currentUser?.blockedUsers.includes(profile.user._id)) {
        throw new ApiError_1.default(403, 'You have blocked this user');
    }
    // Increment profile views if not own profile
    if (profile.user._id.toString() !== currentUserId) {
        profile.profileViews += 1;
        // Add to viewed profiles
        const currentProfile = await models_1.RoommateProfile.findOne({ user: currentUserId });
        if (currentProfile && !currentProfile.viewedProfiles.includes(profile._id)) {
            currentProfile.viewedProfiles.push(profile._id);
            await currentProfile.save({ validateBeforeSave: false });
        }
        await profile.save({ validateBeforeSave: false });
    }
    apiResponse_1.ApiResponse.success(res, { profile }, 'Profile retrieved successfully');
});
// Delete profile
ProfileController.deleteProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const profile = await models_1.RoommateProfile.findOneAndDelete({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    // TODO: Clean up related data (matches, photos, etc.) in background job
    apiResponse_1.ApiResponse.success(res, null, 'Profile deleted successfully');
});
// Add reference
ProfileController.addReference = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { name, relationship, phoneNumber, email } = req.body;
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    if (profile.references.length >= 5) {
        throw new ApiError_1.default(400, 'Maximum 5 references allowed');
    }
    profile.references.push({
        name,
        relationship,
        phoneNumber,
        email,
        verified: false,
    });
    await profile.save();
    apiResponse_1.ApiResponse.success(res, { references: profile.references }, 'Reference added successfully');
});
// Update profile status
ProfileController.updateStatus = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { status } = req.body;
    const profile = await models_1.RoommateProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(404, 'Profile not found');
    }
    profile.status = status;
    profile.lastActive = new Date();
    await profile.save();
    apiResponse_1.ApiResponse.success(res, { status: profile.status }, 'Status updated successfully');
});
//# sourceMappingURL=profile.controller.js.map