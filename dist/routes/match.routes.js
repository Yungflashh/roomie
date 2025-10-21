"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const match_controller_1 = require("../controllers/match/match.controller");
const match_validator_1 = require("../validators/match.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscription_middleware_1 = require("../middleware/subscription.middleware");
const router = (0, express_1.Router)();
// All routes require authentication and verified email
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
router.use(auth_middleware_1.requireCompleteProfile);
// Get potential matches
router.get('/potential', match_controller_1.MatchController.getPotentialMatches);
// Like/Dislike profiles
router.post('/like/:profileId', (0, validate_1.validate)(match_validator_1.MatchValidator.likeProfile()), match_controller_1.MatchController.likeProfile);
router.post('/dislike/:profileId', (0, validate_1.validate)(match_validator_1.MatchValidator.dislikeProfile()), match_controller_1.MatchController.dislikeProfile);
// Match management
router.get('/', match_controller_1.MatchController.getMatches);
router.get('/stats', match_controller_1.MatchController.getMatchStats);
router.get('/liked-me', (0, subscription_middleware_1.requireFeature)('seeWhoLikedYou'), match_controller_1.MatchController.getWhoLikedMe);
router.get('/:matchId', (0, validate_1.validate)(match_validator_1.MatchValidator.getMatchById()), match_controller_1.MatchController.getMatchById);
router.post('/:matchId/accept', (0, validate_1.validate)(match_validator_1.MatchValidator.getMatchById()), match_controller_1.MatchController.acceptMatch);
router.post('/:matchId/reject', (0, validate_1.validate)(match_validator_1.MatchValidator.getMatchById()), match_controller_1.MatchController.rejectMatch);
router.delete('/:matchId', (0, validate_1.validate)(match_validator_1.MatchValidator.unmatch()), match_controller_1.MatchController.unmatch);
router.post('/:matchId/report', (0, validate_1.validate)(match_validator_1.MatchValidator.reportMatch()), match_controller_1.MatchController.reportMatch);
router.post('/:matchId/meeting', (0, validate_1.validate)(match_validator_1.MatchValidator.scheduleMeeting()), match_controller_1.MatchController.scheduleMeeting);
exports.default = router;
//# sourceMappingURL=match.routes.js.map