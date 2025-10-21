"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("../controllers/search/search.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.requireEmailVerification);
// Public search routes
router.get('/', search_controller_1.SearchController.searchProfiles);
router.get('/autocomplete', search_controller_1.SearchController.autocomplete);
router.get('/aggregations', search_controller_1.SearchController.getAggregations);
// Admin routes
router.post('/reindex', (0, auth_middleware_1.restrictTo)('admin'), search_controller_1.SearchController.reindexAll);
router.post('/index/:profileId', (0, auth_middleware_1.restrictTo)('admin'), search_controller_1.SearchController.indexProfile);
exports.default = router;
//# sourceMappingURL=search.routes.js.map