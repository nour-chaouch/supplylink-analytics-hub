const { initializeElasticsearch, getElasticsearchClient } = require('../config/elasticsearch');
const { createAllIndices } = require('../config/elasticsearchMappings');
const UserService = require('../services/UserService');
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

async function testElasticsearchSetup() {
  try {
    console.log('🧪 Testing Elasticsearch setup...');
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    // Create all indices
    await createAllIndices();
    
    // Test services
    const userService = new UserService();
    const producerPriceService = new ProducerPriceService();
    const cropsLivestockService = new CropsLivestockService();
    
    // Test creating sample data
    console.log('📝 Creating sample data...');
    
    // Create a test user
    const testUser = await userService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'farmer'
    });
    console.log('✅ Created test user:', testUser._id);
    
    // Create test producer price data
    const testProducerPrice = await producerPriceService.create({
      domainCode: 'PP',
      domain: 'Producer Prices',
      areaCode: 4,
      area: 'Algeria',
      elementCode: 5530,
      element: 'Producer Price (USD/tonne)',
      itemCode: 15,
      item: 'Wheat',
      year: 2023,
      unit: 'USD/tonne',
      value: 250.50,
      flag: 'A',
      flagDescription: 'Official data',
      scrapedAt: new Date()
    });
    console.log('✅ Created test producer price:', testProducerPrice._id);
    
    // Create test crops/livestock data
    const testCropsLivestock = await cropsLivestockService.create({
      domainCode: 'QCL',
      domain: 'Crops and Livestock Products',
      areaCode: 4,
      area: 'Algeria',
      elementCode: 5510,
      element: 'Production',
      itemCode: 15,
      item: 'Wheat',
      year: 2023,
      unit: 'tonnes',
      value: 2500000,
      flag: 'A',
      flagDescription: 'Official data',
      note: 'Test data',
      scrapedAt: new Date()
    });
    console.log('✅ Created test crops/livestock data:', testCropsLivestock._id);
    
    // Test searching
    console.log('🔍 Testing search functionality...');
    
    const searchResults = await producerPriceService.searchProducerPrices('wheat', {});
    console.log('✅ Search test completed, found', searchResults.length, 'results');
    
    // Test analytics
    console.log('📊 Testing analytics...');
    
    const analytics = await producerPriceService.getAnalytics({});
    console.log('✅ Analytics test completed, total records:', analytics.totalRecords);
    
    // Test filter options
    console.log('🔧 Testing filter options...');
    
    const filters = await producerPriceService.getFilterOptions();
    console.log('✅ Filter options test completed, areas:', filters.areas.length);
    
    console.log('🎉 All Elasticsearch tests passed!');
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await userService.delete(testUser._id);
    await producerPriceService.delete(testProducerPrice._id);
    await cropsLivestockService.delete(testCropsLivestock._id);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testElasticsearchSetup()
    .then(() => {
      console.log('✅ Elasticsearch setup test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Elasticsearch setup test failed:', error);
      process.exit(1);
    });
}

module.exports = testElasticsearchSetup;

