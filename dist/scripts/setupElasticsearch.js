"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const elasticsearch_service_1 = require("../services/elasticsearch.service");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
async function setupElasticsearch() {
    try {
        logger_1.logger.info('Setting up Elasticsearch...');
        // Connect to database
        await (0, database_1.connectDB)();
        // Create index
        logger_1.logger.info('Creating Elasticsearch index...');
        await elasticsearch_service_1.elasticsearchService.createIndex();
        // Index all profiles
        logger_1.logger.info('Indexing all profiles...');
        await elasticsearch_service_1.elasticsearchService.bulkIndexProfiles();
        logger_1.logger.info('✅ Elasticsearch setup completed successfully!');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('❌ Elasticsearch setup failed:', error);
        process.exit(1);
    }
}
setupElasticsearch();
//# sourceMappingURL=setupElasticsearch.js.map