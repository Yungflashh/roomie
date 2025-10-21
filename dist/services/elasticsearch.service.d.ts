interface SearchQuery {
    query: string;
    filters?: {
        city?: string;
        budget?: {
            min?: number;
            max?: number;
        };
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
export declare class ElasticsearchService {
    private indexName;
    isAvailable(): boolean;
    createIndex(): Promise<void>;
    indexProfile(profileId: string): Promise<void>;
    bulkIndexProfiles(): Promise<void>;
    deleteProfile(profileId: string): Promise<void>;
    searchProfiles(searchQuery: SearchQuery): Promise<any>;
    autocompleteSuggestions(prefix: string, field?: string): Promise<string[]>;
    getAggregations(): Promise<any>;
}
export declare const elasticsearchService: ElasticsearchService;
export {};
//# sourceMappingURL=elasticsearch.service.d.ts.map