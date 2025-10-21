"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile/profile.controller");
const profile_validator_1 = require("../validators/profile.validator");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
// Profile CRUD
router.post('/', (0, validate_1.validate)(profile_validator_1.ProfileValidator.createProfile()), profile_controller_1.ProfileController.createProfile);
router.get('/me', profile_controller_1.ProfileController.getMyProfile);
router.patch('/me', (0, validate_1.validate)(profile_validator_1.ProfileValidator.updateProfile()), profile_controller_1.ProfileController.updateProfile);
router.delete('/me', profile_controller_1.ProfileController.deleteProfile);
router.get('/:profileId', profile_controller_1.ProfileController.getProfileById);
// Photo management
router.post('/photos', rateLimiter_1.uploadLimiter, (0, upload_middleware_1.uploadMultiple)('photos', 6), profile_controller_1.ProfileController.uploadPhotos);
router.delete('/photos', profile_controller_1.ProfileController.deletePhoto);
// Video intro
router.post('/video', rateLimiter_1.uploadLimiter, (0, upload_middleware_1.uploadSingle)('videoIntro'), profile_controller_1.ProfileController.uploadVideoIntro);
// References
router.post('/references', (0, validate_1.validate)(profile_validator_1.ProfileValidator.addReference()), profile_controller_1.ProfileController.addReference);
// Status
router.patch('/status', (0, validate_1.validate)(profile_validator_1.ProfileValidator.updateStatus()), profile_controller_1.ProfileController.updateStatus);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map