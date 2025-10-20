import { esClient, elasticsearchClient } from '../config/elasticsearch';
import { logger } from '../utils/logger';
import { RoommateProfile, User } from '../models';

interface SearchQuery {
  query: string;
  filters?: {
    city?: string;
    budget?: { min?: number; max?: number };
    interests?: string[];
    cleanliness?: number[];
    smoking?: boolean;
    pets?: boolean;
    gender?: string;
  };
  location?: {
    lat: number;
    lon: number;
    distance?: string;
  };
  sort?: 'relevance' | 'distance' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}

export class ElasticsearchService {
  private indexName = 'roommate_profiles';

  // Check if Elasticsearch is available
  isAvailable(): boolean {
    return elasticsearchClient.isAvailable();
  }

  // Create index with mappings
  async createIndex(): Promise<void> {
    if (!esClient) return;

    try {
      const exists = await esClient.indices.exists({ index: this.indexName });

      if (!exists) {
        await esClient.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  autocomplete: {
                    type: 'custom',
                    tokenizer: 'autocomplete',
                    filter: ['lowercase'],
                  },
                  autocomplete_search: {
                    type: 'custom',
                    tokenizer: 'lowercase',
                  },
                },
                tokenizer: {
                  autocomplete: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 10,
                    token_chars: ['letter', 'digit'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                userId: { type: 'keyword' },
                profileId: { type: 'keyword' },
                firstName: { 
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'autocomplete_search',
                },
                lastName: { 
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'autocomplete_search',
                },
                headline: { 
                  type: 'text',
                  analyzer: 'standard',
                },
                about: { 
                  type: 'text',
                  analyzer: 'standard',
                },
                location: {
                  type: 'geo_point',
                },
                city: { 
                  type: 'keyword',
                },
                state: { 
                  type: 'keyword',
                },
                country: { 
                  type: 'keyword',
                },
                interests: { 
                  type: 'keyword',
                },
                languages: { 
                  type: 'keyword',
                },
                occupation: { 
                  type: 'text',
                },
                budget: {
                  properties: {
                    min: { type: 'integer' },
                    max: { type: 'integer' },
                  },
                },
                lifestylePreferences: {
                  properties: {
                    cleanliness: { type: 'integer' },
                    smoking: { type: 'boolean' },
                    pets: { type: 'boolean' },
                    drinking: { type: 'keyword' },
                    socialLevel: { type: 'keyword' },
                    sleepSchedule: { type: 'keyword' },
                  },
                },
                gender: { type: 'keyword' },
                age: { type: 'integer' },
                rating: { type: 'float' },
                profileViews: { type: 'integer' },
                isPremium: { type: 'boolean' },
                completionPercentage: { type: 'integer' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });

        logger.info('Elasticsearch index created successfully');
      }
    } catch (error) {
      logger.error('Error creating Elasticsearch index:', error);
      throw error;
    }
  }

  // Index a profile
  async indexProfile(profileId: string): Promise<void> {
    if (!esClient) return;

    try {
      const profile = await RoommateProfile.findById(profileId).populate('user');
      if (!profile) {
        logger.warn(`Profile ${profileId} not found for indexing`);
        return;
      }

      const user = profile.user as any;

      const document = {
        userId: user._id.toString(),
        profileId: (profile._id as any).toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        headline: profile.headline,
        about: profile.about,
        location: {
          lat: profile.location.coordinates[1],
          lon: profile.location.coordinates[0],
        },
        city: profile.location.city,
        state: profile.location.state,
        country: profile.location.country,
        interests: profile.interests,
        languages: profile.languages,
        occupation: profile.occupation.title,
        budget: {
          min: profile.matchingPreferences.budget.min,
          max: profile.matchingPreferences.budget.max,
        },
        lifestylePreferences: {
          cleanliness: profile.lifestylePreferences.cleanliness,
          smoking: profile.lifestylePreferences.smoking,
          pets: profile.lifestylePreferences.pets,
          drinking: profile.lifestylePreferences.drinking,
          socialLevel: profile.lifestylePreferences.socialLevel,
          sleepSchedule: profile.lifestylePreferences.sleepSchedule,
        },
        gender: user.gender,
        age: user.age,
        rating: profile.rating.average,
        profileViews: profile.profileViews,
        isPremium: profile.isPremium,
        completionPercentage: profile.completionPercentage,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      await esClient.index({
        index: this.indexName,
        id: profileId,
        document,
      });

      logger.info(`Profile ${profileId} indexed successfully`);
    } catch (error) {
      logger.error(`Error indexing profile ${profileId}:`, error);
    }
  }

  // Bulk index all profiles
  async bulkIndexProfiles(): Promise<void> {
    if (!esClient) return;

    try {
      const profiles = await RoommateProfile.find({ isProfileComplete: true }).populate('user');

      const body = profiles.flatMap((profile) => {
        const user = profile.user as any;
        return [
          { index: { _index: this.indexName, _id: (profile._id as any).toString() } },
          {
            userId: user._id.toString(),
            profileId: (profile._id as any).toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            headline: profile.headline,
            about: profile.about,
            location: {
              lat: profile.location.coordinates[1],
              lon: profile.location.coordinates[0],
            },
            city: profile.location.city,
            state: profile.location.state,
            country: profile.location.country,
            interests: profile.interests,
            languages: profile.languages,
            occupation: profile.occupation.title,
            budget: {
              min: profile.matchingPreferences.budget.min,
              max: profile.matchingPreferences.budget.max,
            },
            lifestylePreferences: {
              cleanliness: profile.lifestylePreferences.cleanliness,
              smoking: profile.lifestylePreferences.smoking,
              pets: profile.lifestylePreferences.pets,
              drinking: profile.lifestylePreferences.drinking,
              socialLevel: profile.lifestylePreferences.socialLevel,
              sleepSchedule: profile.lifestylePreferences.sleepSchedule,
            },
            gender: user.gender,
            age: user.age,
            rating: profile.rating.average,
            profileViews: profile.profileViews,
            isPremium: profile.isPremium,
            completionPercentage: profile.completionPercentage,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
        ];
      });

      if (body.length > 0) {
        const { errors } = await esClient.bulk({ refresh: true, body });

        if (errors) {
          logger.error('Bulk indexing had errors');
        } else {
          logger.info(`Successfully indexed ${profiles.length} profiles`);
        }
      }
    } catch (error) {
      logger.error('Error bulk indexing profiles:', error);
      throw error;
    }
  }

  // Delete profile from index
  async deleteProfile(profileId: string): Promise<void> {
    if (!esClient) return;

    try {
      await esClient.delete({
        index: this.indexName,
        id: profileId,
      });

      logger.info(`Profile ${profileId} deleted from index`);
    } catch (error) {
      if ((error as any).meta?.statusCode !== 404) {
        logger.error(`Error deleting profile ${profileId}:`, error);
      }
    }
  }

  // Search profiles
  async searchProfiles(searchQuery: SearchQuery): Promise<any> {
    if (!esClient) {
      throw new Error('Elasticsearch is not available');
    }

    const {
      query,
      filters = {},
      location,
      sort = 'relevance',
      page = 1,
      limit = 20,
    } = searchQuery;

    const must: any[] = [];
    const filter: any[] = [];

    // Text search
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query,
          fields: [
            'firstName^3',
            'lastName^3',
            'headline^2',
            'about',
            'interests^2',
            'occupation',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Location filter
    if (location) {
      filter.push({
        geo_distance: {
          distance: location.distance || '50km',
          location: {
            lat: location.lat,
            lon: location.lon,
          },
        },
      });
    }

    // City filter
    if (filters.city) {
      filter.push({ term: { city: filters.city } });
    }

    // Budget filter
    if (filters.budget) {
      const budgetQuery: any = {};
      if (filters.budget.min !== undefined) {
        budgetQuery['budget.max'] = { gte: filters.budget.min };
      }
      if (filters.budget.max !== undefined) {
        budgetQuery['budget.min'] = { lte: filters.budget.max };
      }
      if (Object.keys(budgetQuery).length > 0) {
        filter.push({ range: budgetQuery });
      }
    }

    // Interests filter
    if (filters.interests && filters.interests.length > 0) {
      filter.push({
        terms: { interests: filters.interests },
      });
    }

    // Cleanliness filter
    if (filters.cleanliness && filters.cleanliness.length > 0) {
      filter.push({
        terms: { 'lifestylePreferences.cleanliness': filters.cleanliness },
      });
    }

    // Smoking filter
    if (filters.smoking !== undefined) {
      filter.push({
        term: { 'lifestylePreferences.smoking': filters.smoking },
      });
    }

    // Pets filter
    if (filters.pets !== undefined) {
      filter.push({
        term: { 'lifestylePreferences.pets': filters.pets },
      });
    }

    // Gender filter
    if (filters.gender) {
      filter.push({ term: { gender: filters.gender } });
    }

    // Build sort
    const sortOptions: any[] = [];
    switch (sort) {
      case 'distance':
        if (location) {
          sortOptions.push({
            _geo_distance: {
              location: {
                lat: location.lat,
                lon: location.lon,
              },
              order: 'asc',
              unit: 'km',
            },
          });
        }
        break;
      case 'newest':
        sortOptions.push({ createdAt: 'desc' });
        break;
      case 'rating':
        sortOptions.push({ rating: 'desc' });
        break;
      case 'relevance':
      default:
        sortOptions.push('_score');
    }

    // Execute search
    try {
      const from = (page - 1) * limit;

      const result = await esClient.search({
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort: sortOptions,
          highlight: {
            fields: {
              headline: {},
              about: {},
              interests: {},
            },
          },
        },
      });

      const hits = result.hits.hits.map((hit: any) => ({
        profileId: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight,
      }));

      return {
        profiles: hits,
        total: result.hits.total,
        page,
        limit,
        totalPages: Math.ceil((result.hits.total as any).value / limit),
      };
    } catch (error) {
      logger.error('Elasticsearch search error:', error);
      throw error;
    }
  }

  // Auto-complete suggestions
  async autocompleteSuggestions(prefix: string, field: string = 'firstName'): Promise<string[]> {
    if (!esClient || !prefix || prefix.length < 2) {
      return [];
    }

    try {
      const result = await esClient.search({
        index: this.indexName,
        body: {
          size: 0,
          suggest: {
            suggestions: {
              prefix,
              completion: {
                field: field,
                fuzzy: {
                  fuzziness: 'AUTO',
                },
                size: 10,
              },
            },
          },
        },
      });

      const suggestions = result.suggest?.suggestions?.[0]?.options || [];
      if (Array.isArray(suggestions)) {
        return suggestions.map((opt: any) => opt.text);
      }
      return [];
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  // Get aggregations
  async getAggregations(): Promise<any> {
    if (!esClient) {
      throw new Error('Elasticsearch is not available');
    }

    try {
      const result = await esClient.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            cities: {
              terms: { field: 'city', size: 20 },
            },
            interests: {
              terms: { field: 'interests', size: 50 },
            },
            budget_ranges: {
              histogram: {
                field: 'budget.min',
                interval: 200,
              },
            },
            avg_rating: {
              avg: { field: 'rating' },
            },
            smoking_distribution: {
              terms: { field: 'lifestylePreferences.smoking' },
            },
            pets_distribution: {
              terms: { field: 'lifestylePreferences.pets' },
            },
          },
        },
      });

      return result.aggregations;
    } catch (error) {
      logger.error('Aggregations error:', error);
      throw error;
    }
  }
}

export const elasticsearchService = new ElasticsearchService();