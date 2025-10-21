"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const elasticsearch_service_1 = require("../../services/elasticsearch.service");
const models_1 = require("../../models");
class SearchController {
    // Fallback MongoDB search
    static async fallbackSearch(req, res) {
        const { q: query, city, budgetMin, budgetMax, interests, page = 1, limit = 20, } = req.query;
        const mongoQuery = { isProfileComplete: true };
        // Text search
        if (query) {
            mongoQuery.$or = [
                { headline: { $regex: query, $options: 'i' } },
                { about: { $regex: query, $options: 'i' } },
                { interests: { $regex: query, $options: 'i' } },
            ];
        }
        // Filters
        if (city)
            mongoQuery['location.city'] = city;
        if (budgetMin)
            mongoQuery['matchingPreferences.budget.max'] = { $gte: parseInt(budgetMin) };
        if (budgetMax)
            mongoQuery['matchingPreferences.budget.min'] = { $lte: parseInt(budgetMax) };
        if (interests) {
            const interestArray = Array.isArray(interests) ? interests : [interests];
            mongoQuery.interests = { $in: interestArray };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const profiles = await models_1.RoommateProfile.find(mongoQuery)
            .populate('user', 'firstName lastName profilePicture age gender')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const total = await models_1.RoommateProfile.countDocuments(mongoQuery);
        apiResponse_1.ApiResponse.paginated(res, profiles, parseInt(page), parseInt(limit), total, 'Search completed successfully (fallback)');
    }
}
exports.SearchController = SearchController;
_a = SearchController;
// Advanced search
SearchController.searchProfiles = (0, catchAsync_1.default)(async (req, res) => {
    if (!elasticsearch_service_1.elasticsearchService.isAvailable()) {
        // Fallback to MongoDB search
        return _a.fallbackSearch(req, res);
    }
    const { q: query, city, budgetMin, budgetMax, interests, cleanliness, smoking, pets, gender, lat, lon, distance, sort = 'relevance', page = 1, limit = 20, } = req.query;
    const searchQuery = {
        query: query || '',
        filters: {},
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort,
    };
    // Add filters
    if (city)
        searchQuery.filters.city = city;
    if (budgetMin || budgetMax) {
        searchQuery.filters.budget = {
            min: budgetMin ? parseInt(budgetMin) : undefined,
            max: budgetMax ? parseInt(budgetMax) : undefined,
        };
    }
    if (interests) {
        searchQuery.filters.interests = Array.isArray(interests)
            ? interests
            : [interests];
    }
    if (cleanliness) {
        searchQuery.filters.cleanliness = Array.isArray(cleanliness)
            ? cleanliness.map((c) => parseInt(c))
            : [parseInt(cleanliness)];
    }
    if (smoking !== undefined)
        searchQuery.filters.smoking = smoking === 'true';
    if (pets !== undefined)
        searchQuery.filters.pets = pets === 'true';
    if (gender)
        searchQuery.filters.gender = gender;
    // Add location
    if (lat && lon) {
        searchQuery.location = {
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            distance: distance || '50km',
        };
    }
    const results = await elasticsearch_service_1.elasticsearchService.searchProfiles(searchQuery);
    apiResponse_1.ApiResponse.success(res, results, 'Search completed successfully');
});
// Autocomplete
SearchController.autocomplete = (0, catchAsync_1.default)(async (req, res) => {
    const { q: query, field = 'firstName' } = req.query;
    if (!query || query.length < 2) {
        return apiResponse_1.ApiResponse.success(res, { suggestions: [] }, 'Query too short');
    }
    if (!elasticsearch_service_1.elasticsearchService.isAvailable()) {
        // Fallback: simple MongoDB query
        const fieldString = field;
        const profiles = await models_1.RoommateProfile.find({
            [fieldString]: { $regex: `^${query}`, $options: 'i' },
        })
            .limit(10)
            .select(fieldString);
        const suggestions = profiles.map((p) => p[fieldString]);
        return apiResponse_1.ApiResponse.success(res, { suggestions }, 'Suggestions retrieved');
    }
    const suggestions = await elasticsearch_service_1.elasticsearchService.autocompleteSuggestions(query, field);
    apiResponse_1.ApiResponse.success(res, { suggestions }, 'Suggestions retrieved successfully');
});
// Get search aggregations (facets)
SearchController.getAggregations = (0, catchAsync_1.default)(async (req, res) => {
    if (!elasticsearch_service_1.elasticsearchService.isAvailable()) {
        throw new ApiError_1.default(503, 'Advanced search features are not available');
    }
    const aggregations = await elasticsearch_service_1.elasticsearchService.getAggregations();
    apiResponse_1.ApiResponse.success(res, { aggregations }, 'Aggregations retrieved successfully');
});
// Reindex all profiles (Admin only)
SearchController.reindexAll = (0, catchAsync_1.default)(async (req, res) => {
    if (!elasticsearch_service_1.elasticsearchService.isAvailable()) {
        throw new ApiError_1.default(503, 'Elasticsearch is not available');
    }
    // Create index if not exists
    await elasticsearch_service_1.elasticsearchService.createIndex();
    // Bulk index all profiles
    await elasticsearch_service_1.elasticsearchService.bulkIndexProfiles();
    apiResponse_1.ApiResponse.success(res, null, 'All profiles reindexed successfully');
});
// Index single profile
SearchController.indexProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { profileId } = req.params;
    if (!elasticsearch_service_1.elasticsearchService.isAvailable()) {
        throw new ApiError_1.default(503, 'Elasticsearch is not available');
    }
    await elasticsearch_service_1.elasticsearchService.indexProfile(profileId);
    apiResponse_1.ApiResponse.success(res, null, 'Profile indexed successfully');
});
//# sourceMappingURL=search.controller.js.map