import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

class ElasticsearchClient {
  private client: Client | null = null;
  private isConnected: boolean = false;

  constructor() {
    const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;

    try {
      this.client = new Client({
        node,
        auth: username && password ? { username, password } : undefined,
        maxRetries: 5,
        requestTimeout: 60000,
        sniffOnStart: true,
      });

      this.testConnection();
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch client:', error);
    }
  }

  async testConnection(): Promise<void> {
    if (!this.client) return;

    try {
      const health = await this.client.cluster.health();
      this.isConnected = true;
      logger.info(`Elasticsearch connected: ${health.cluster_name} (${health.status})`);
    } catch (error) {
      this.isConnected = false;
      logger.error('Elasticsearch connection failed:', error);
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const elasticsearchClient = new ElasticsearchClient();
export const esClient = elasticsearchClient.getClient();