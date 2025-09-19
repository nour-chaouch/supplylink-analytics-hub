const mongoose = require('mongoose');
const IndexMetadata = require('./models/IndexMetadata');

// Test script to verify IndexMetadata model
async function testIndexMetadata() {
  try {
    // Connect to MongoDB (you'll need to set MONGO_URI in your environment)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/supplylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test creating index metadata
    const testMetadata = new IndexMetadata({
      indexName: 'test_index',
      title: 'Test Index',
      description: 'This is a test index for verification',
      icon: 'Database',
      createdBy: null // For testing purposes
    });

    await testMetadata.save();
    console.log('✅ Index metadata created successfully');

    // Test finding index metadata
    const foundMetadata = await IndexMetadata.findOne({ indexName: 'test_index' });
    console.log('✅ Index metadata found:', foundMetadata);

    // Clean up test data
    await IndexMetadata.deleteOne({ indexName: 'test_index' });
    console.log('✅ Test data cleaned up');

    console.log('🎉 All tests passed! IndexMetadata model is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testIndexMetadata();
}

module.exports = testIndexMetadata;

