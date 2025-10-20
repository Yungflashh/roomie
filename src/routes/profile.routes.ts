import { Router } from 'express';
import { ProfileController } from '../controllers/profile/profile.controller';
import { ProfileValidator } from '../validators/profile.validator';
import { validate } from '../middleware/validate';
import { protect, requireEmailVerification } from '../middleware/auth.middleware';
import { uploadMultiple, uploadSingle } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(protect);
router.use(requireEmailVerification);

// Profile CRUD
router.post(
  '/',
  validate(ProfileValidator.createProfile()),
  ProfileController.createProfile
);

router.get('/me', ProfileController.getMyProfile);

router.patch(
  '/me',
  validate(ProfileValidator.updateProfile()),
  ProfileController.updateProfile
);

router.delete('/me', ProfileController.deleteProfile);

router.get('/:profileId', ProfileController.getProfileById);

// Photo management
router.post(
  '/photos',
  uploadLimiter,
  uploadMultiple('photos', 6),
  ProfileController.uploadPhotos
);

router.delete('/photos', ProfileController.deletePhoto);

// Video intro
router.post(
  '/video',
  uploadLimiter,
  uploadSingle('videoIntro'),
  ProfileController.uploadVideoIntro
);

// References
router.post(
  '/references',
  validate(ProfileValidator.addReference()),
  ProfileController.addReference
);

// Status
router.patch(
  '/status',
  validate(ProfileValidator.updateStatus()),
  ProfileController.updateStatus
);

export default router;  