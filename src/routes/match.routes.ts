import { Router } from 'express';
import { MatchController } from '../controllers/match/match.controller';
import { MatchValidator } from '../validators/match.validator';
import { validate } from '../middleware/validate';
import {
  protect,
  requireEmailVerification,
  requireCompleteProfile,
} from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/subscription.middleware';


const router = Router();

// All routes require authentication and verified email
router.use(protect);
router.use(requireEmailVerification);
router.use(requireCompleteProfile);

// Get potential matches
router.get('/potential', MatchController.getPotentialMatches);

// Like/Dislike profiles
router.post(
  '/like/:profileId',
  validate(MatchValidator.likeProfile()),
  MatchController.likeProfile
);

router.post(
  '/dislike/:profileId',
  validate(MatchValidator.dislikeProfile()),
  MatchController.dislikeProfile
);

// Match management
router.get('/', MatchController.getMatches);

router.get('/stats', MatchController.getMatchStats);

router.get(
  '/liked-me',
  requireFeature('seeWhoLikedYou'),
  MatchController.getWhoLikedMe
);
router.get(
  '/:matchId',
  validate(MatchValidator.getMatchById()),
  MatchController.getMatchById
);

router.post(
  '/:matchId/accept',
  validate(MatchValidator.getMatchById()),
  MatchController.acceptMatch
);

router.post(
  '/:matchId/reject',
  validate(MatchValidator.getMatchById()),
  MatchController.rejectMatch
);

router.delete(
  '/:matchId',
  validate(MatchValidator.unmatch()),
  MatchController.unmatch
);

router.post(
  '/:matchId/report',
  validate(MatchValidator.reportMatch()),
  MatchController.reportMatch
);

router.post(
  '/:matchId/meeting',
  validate(MatchValidator.scheduleMeeting()),
  MatchController.scheduleMeeting
);

export default router;