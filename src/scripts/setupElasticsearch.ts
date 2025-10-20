import dotenv from 'dotenv';
import { elasticsearchService } from '../services/elasticsearch.service';
import { connectDB } from '../config/database';
import { logger } from '../utils/logger';

dotenv.config();

async function setupElasticsearch() {
  try {
    logger.info('Setting up Elasticsearch...');

    // Connect to database
    await connectDB();

    // Create index
    logger.info('Creating Elasticsearch index...');
    await elasticsearchService.createIndex();

    // Index all profiles
    logger.info('Indexing all profiles...');
    await elasticsearchService.bulkIndexProfiles();

    logger.info('✅ Elasticsearch setup completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Elasticsearch setup failed:', error);
    process.exit(1);
  }
}

setupElasticsearch();