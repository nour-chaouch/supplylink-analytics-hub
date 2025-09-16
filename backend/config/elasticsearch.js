const { Client } = require('@elastic/elasticsearch');

// Create Elasticsearch client
const createElasticsearchClient = () => {
  const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_AUTH ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    } : undefined,
    requestTimeout: 30000,
    maxRetries: 3,
    resurrectStrategy: 'ping'
  });

  return client;
};

// Test Elasticsearch connection
const testElasticsearchConnection = async () => {
  try {
    const client = createElasticsearchClient();
    const response = await client.ping();
    console.log('✅ Elasticsearch Connected Successfully');
    return client;
  } catch (error) {
    console.error('❌ Elasticsearch Connection Error:', error.message);
    console.log('⚠️  Server will continue without Elasticsearch connection');
    return null;
  }
};

// Initialize Elasticsearch client
let elasticsearchClient = null;

const initializeElasticsearch = async () => {
  elasticsearchClient = await testElasticsearchConnection();
  return elasticsearchClient;
};

// Get Elasticsearch client
const getElasticsearchClient = () => {
  if (!elasticsearchClient) {
    console.warn('⚠️  Elasticsearch client not initialized. Call initializeElasticsearch() first.');
    return null;
  }
  return elasticsearchClient;
};

module.exports = {
  createElasticsearchClient,
  testElasticsearchConnection,
  initializeElasticsearch,
  getElasticsearchClient
};

