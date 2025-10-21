import { Client } from '@elastic/elasticsearch';
declare class ElasticsearchClient {
    private client;
    private isConnected;
    constructor();
    testConnection(): Promise<void>;
    getClient(): Client | null;
    isAvailable(): boolean;
}
export declare const elasticsearchClient: ElasticsearchClient;
export declare const esClient: Client | null;
export {};
//# sourceMappingURL=elasticsearch.d.ts.map