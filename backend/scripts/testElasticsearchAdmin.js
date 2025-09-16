const { initializeElasticsearch } = require('../config/elasticsearch');
const { createAllIndices } = require('../config/elasticsearchMappings');

async function testElasticsearchAdmin() {
  try {
    console.log('🧪 Testing Elasticsearch Admin Setup...');
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    // Create predefined indices
    await createAllIndices();
    
    console.log('✅ Elasticsearch Admin setup completed successfully!');
    console.log('');
    console.log('📋 Available Admin Features:');
    console.log('  • Create custom Elasticsearch indices');
    console.log('  • Create predefined indices (users, producer_prices, crops_livestock)');
    console.log('  • Delete indices');
    console.log('  • View cluster health and index statistics');
    console.log('  • Import JSON data files');
    console.log('  • View index mappings');
    console.log('');
    console.log('🌐 Admin Panel Access:');
    console.log('  • Navigate to: http://localhost:3000/admin/elasticsearch');
    console.log('  • Requires admin authentication');
    console.log('');
    console.log('📁 JSON Import Format:');
    console.log('  • Upload JSON files with array of documents');
    console.log('  • Each document should have _id field (optional)');
    console.log('  • Example: [{"_id": "1", "name": "test", "value": 100}]');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testElasticsearchAdmin()
    .then(() => {
      console.log('✅ Elasticsearch Admin test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Elasticsearch Admin test failed:', error);
      process.exit(1);
    });
}

module.exports = testElasticsearchAdmin;

