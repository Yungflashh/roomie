import { Response } from 'express';
import { AuthRequest } from '../../types';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { elasticsearchService } from '../../services/elasticsearch.service';
import { RoommateProfile } from '../../models';

export class SearchController {
  // Advanced search
  static searchProfiles = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!elasticsearchService.isAvailable()) {
      // Fallback to MongoDB search
      return SearchController.fallbackSearch(req, res);
    }

    const {
      q: query,
      city,
      budgetMin,
      budgetMax,
      interests,
      cleanliness,
      smoking,
      pets,
      gender,
      lat,
      lon,
      distance,
      sort = 'relevance',
      page = 1,
      limit = 20,
    } = req.query;

    const searchQuery: any = {
      query: query as string || '',
      filters: {},
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
    };

    // Add filters
    if (city) searchQuery.filters.city = city;
    if (budgetMin || budgetMax) {
      searchQuery.filters.budget = {
        min: budgetMin ? parseInt(budgetMin as string) : undefined,
        max: budgetMax ? parseInt(budgetMax as string) : undefined,
      };
    }
    if (interests) {
      searchQuery.filters.interests = Array.isArray(interests)
        ? interests
        : [interests];
    }
    if (cleanliness) {
      searchQuery.filters.cleanliness = Array.isArray(cleanliness)
        ? cleanliness.map((c) => parseInt(c as string))
        : [parseInt(cleanliness as string)];
    }
    if (smoking !== undefined) searchQuery.filters.smoking = smoking === 'true';
    if (pets !== undefined) searchQuery.filters.pets = pets === 'true';
    if (gender) searchQuery.filters.gender = gender;

    // Add location
    if (lat && lon) {
      searchQuery.location = {
        lat: parseFloat(lat as string),
        lon: parseFloat(lon as string),
        distance: distance as string || '50km',
      };
    }

    const results = await elasticsearchService.searchProfiles(searchQuery);

    ApiResponse.success(res, results, 'Search completed successfully');
  });

  // Fallback MongoDB search
  private static async fallbackSearch(req: AuthRequest, res: Response): Promise<void> {
    const {
      q: query,
      city,
      budgetMin,
      budgetMax,
      interests,
      page = 1,
      limit = 20,
    } = req.query;

    const mongoQuery: any = { isProfileComplete: true };

    // Text search
    if (query) {
      mongoQuery.$or = [
        { headline: { $regex: query, $options: 'i' } },
        { about: { $regex: query, $options: 'i' } },
        { interests: { $regex: query, $options: 'i' } },
      ];
    }

    // Filters
    if (city) mongoQuery['location.city'] = city;
    if (budgetMin) mongoQuery['matchingPreferences.budget.max'] = { $gte: parseInt(budgetMin as string) };
    if (budgetMax) mongoQuery['matchingPreferences.budget.min'] = { $lte: parseInt(budgetMax as string) };
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      mongoQuery.interests = { $in: interestArray };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const profiles = await RoommateProfile.find(mongoQuery)
      .populate('user', 'firstName lastName profilePicture age gender')
      .skip(skip)
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await RoommateProfile.countDocuments(mongoQuery);

    ApiResponse.paginated(
      res,
      profiles,
      parseInt(page as string),
      parseInt(limit as string),
      total,
      'Search completed successfully (fallback)'
    );
  }

  // Autocomplete
  static autocomplete = catchAsync(async (req: AuthRequest, res: Response) => {
    const { q: query, field = 'firstName' } = req.query;

    if (!query || (query as string).length < 2) {
      return ApiResponse.success(res, { suggestions: [] }, 'Query too short');
    }

    if (!elasticsearchService.isAvailable()) {
      // Fallback: simple MongoDB query
      const fieldString = field as string;
      const profiles = await RoommateProfile.find({
        [fieldString]: { $regex: `^${query}`, $options: 'i' },
      })
        .limit(10)
        .select(fieldString);

      const suggestions = profiles.map((p: any) => p[fieldString]);
      return ApiResponse.success(res, { suggestions }, 'Suggestions retrieved');
    }

    const suggestions = await elasticsearchService.autocompleteSuggestions(
      query as string,
      field as string
    );

    ApiResponse.success(res, { suggestions }, 'Suggestions retrieved successfully');
  });

  // Get search aggregations (facets)
  static getAggregations = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!elasticsearchService.isAvailable()) {
      throw new ApiError(503, 'Advanced search features are not available');
    }

    const aggregations = await elasticsearchService.getAggregations();

    ApiResponse.success(res, { aggregations }, 'Aggregations retrieved successfully');
  });

  // Reindex all profiles (Admin only)
  static reindexAll = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!elasticsearchService.isAvailable()) {
      throw new ApiError(503, 'Elasticsearch is not available');
    }

    // Create index if not exists
    await elasticsearchService.createIndex();

    // Bulk index all profiles
    await elasticsearchService.bulkIndexProfiles();

    ApiResponse.success(res, null, 'All profiles reindexed successfully');
  });

  // Index single profile
  static indexProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;

    if (!elasticsearchService.isAvailable()) {
      throw new ApiError(503, 'Elasticsearch is not available');
    }

    await elasticsearchService.indexProfile(profileId);

    ApiResponse.success(res, null, 'Profile indexed successfully');
  });
}