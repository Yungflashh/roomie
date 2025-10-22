"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esClient = exports.elasticsearchClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("it got here oop");
console.log(process.env.ELASTICSEARCH_NODE);
class ElasticsearchClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
        const username = process.env.ELASTICSEARCH_USERNAME;
        const password = process.env.ELASTICSEARCH_PASSWORD;
        try {
            this.client = new elasticsearch_1.Client({
                node,
                auth: username && password ? { username, password } : undefined,
                maxRetries: 5,
                requestTimeout: 60000,
                sniffOnStart: true,
            });
            this.testConnection();
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Elasticsearch client:', error);
        }
    }
    async testConnection() {
        if (!this.client)
            return;
        try {
            const health = await this.client.cluster.health();
            this.isConnected = true;
            logger_1.logger.info(`Elasticsearch connected: ${health.cluster_name} (${health.status})`);
        }
        catch (error) {
            this.isConnected = false;
            logger_1.logger.error('Elasticsearch connection failed:', error);
        }
    }
    getClient() {
        return this.client;
    }
    isAvailable() {
        return this.isConnected && this.client !== null;
    }
}
exports.elasticsearchClient = new ElasticsearchClient();
exports.esClient = exports.elasticsearchClient.getClient();
//# sourceMappingURL=elasticsearch.js.map