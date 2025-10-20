import { Router } from 'express';
import { SearchController } from '../controllers/search/search.controller';
import { protect, requireEmailVerification, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);
router.use(requireEmailVerification);

// Public search routes
router.get('/', SearchController.searchProfiles);
router.get('/autocomplete', SearchController.autocomplete);
router.get('/aggregations', SearchController.getAggregations);

// Admin routes
router.post(
  '/reindex',
  restrictTo('admin'),
  SearchController.reindexAll
);

router.post(
  '/index/:profileId',
  restrictTo('admin'),
  SearchController.indexProfile
);

export default router;