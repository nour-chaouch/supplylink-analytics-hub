const { Client } = require('@elastic/elasticsearch');

// Create Elasticsearch client
const createElasticsearchClient = () => {
  const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  console.log(`Creating Elasticsearch client for: ${elasticsearchUrl}`);
  
  const client = new Client({
    node: elasticsearchUrl,
    auth: process.env.ELASTICSEARCH_AUTH ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    } : undefined,
    requestTimeout: 30000,
    maxRetries: 3,
    resurrectStrategy: 'ping',
    // Add connection timeout
    connectionTimeout: 10000,
    // Add ping timeout
    pingTimeout: 5000
  });

  return client;
};

// Test Elasticsearch connection
const testElasticsearchConnection = async () => {
  try {
    const client = createElasticsearchClient();
    console.log('Testing Elasticsearch connection...');
    
    // Try ping first
    try {
      await client.ping();
      console.log('✅ Elasticsearch ping successful');
    } catch (pingError) {
      console.log('⚠️  Ping failed, trying cluster health...');
      // If ping fails, try cluster health as fallback
      await client.cluster.health();
      console.log('✅ Elasticsearch cluster health check successful');
    }
    
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
  console.log('Initializing Elasticsearch client...');
  elasticsearchClient = await testElasticsearchConnection();
  
  if (elasticsearchClient) {
    console.log('✅ Elasticsearch client initialized successfully');
  } else {
    console.log('❌ Elasticsearch client initialization failed');
  }
  
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
