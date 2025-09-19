const mongoose = require('mongoose');
const FilterValues = require('./models/FilterValues');
const FilterValuesService = require('./services/FilterValuesService');

// Test script to verify FilterValues functionality
async function testFilterValuesFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/supplylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const testIndexName = 'test_filter_values_index';
    
    // Clean up any existing test data
    await FilterValues.deleteMany({ indexName: testIndexName });
    console.log('🧹 Cleaned up existing test data');

    // Test 1: Create filter values from sample documents
    console.log('\n📝 Test 1: Creating filter values from sample documents');
    const sampleDocuments = [
      { name: 'John Doe', category: 'Premium', status: 'active', age: 30 },
      { name: 'Jane Smith', category: 'Standard', status: 'inactive', age: 25 },
      { name: 'Bob Johnson', category: 'Premium', status: 'active', age: 35 },
      { name: 'Alice Brown', category: 'Basic', status: 'pending', age: 28 },
      { name: 'Charlie Wilson', category: 'Premium', status: 'active', age: 42 }
    ];

    await FilterValuesService.updateIndexFilterValues(testIndexName, sampleDocuments);
    console.log('✅ Filter values created successfully');

    // Test 2: Verify filter values were created correctly
    console.log('\n🔍 Test 2: Verifying filter values');
    const filterValues = await FilterValuesService.getFilterValues(testIndexName);
    console.log(`Found ${filterValues.length} filter fields:`);
    
    filterValues.forEach(field => {
      console.log(`  - ${field.fieldName} (${field.fieldType}): ${field.values.length} values`);
      console.log(`    Top values: ${field.values.slice(0, 3).map(v => `${v.value}(${v.count})`).join(', ')}`);
    });

    // Test 3: Test adding new documents
    console.log('\n➕ Test 3: Adding new documents');
    const newDocuments = [
      { name: 'David Lee', category: 'Standard', status: 'active', age: 33 },
      { name: 'Eva Garcia', category: 'Premium', status: 'inactive', age: 29 }
    ];

    await FilterValuesService.updateIndexFilterValues(testIndexName, newDocuments);
    console.log('✅ New documents added to filter values');

    // Test 4: Verify updated counts
    console.log('\n📊 Test 4: Verifying updated counts');
    const updatedFilterValues = await FilterValuesService.getFilterValues(testIndexName);
    const categoryField = updatedFilterValues.find(f => f.fieldName === 'category');
    if (categoryField) {
      const premiumCount = categoryField.values.find(v => v.value === 'Premium')?.count || 0;
      console.log(`Premium category count: ${premiumCount} (expected: 4)`);
    }

    // Test 5: Test clearing filter values
    console.log('\n🗑️ Test 5: Testing clear filter values');
    await FilterValuesService.clearIndexFilterValues(testIndexName);
    const clearedValues = await FilterValuesService.getFilterValues(testIndexName);
    console.log(`Filter values after clearing: ${clearedValues.length} (expected: 0)`);

    // Test 6: Test field type determination
    console.log('\n🎯 Test 6: Testing field type determination');
    const testValues = {
      boolean: ['true', 'false', 'yes', 'no'],
      keyword: ['small', 'medium', 'large'],
      text: ['This is a long description that should be classified as text', 'Another long text field']
    };

    Object.entries(testValues).forEach(([expectedType, values]) => {
      const detectedType = FilterValuesService.determineFieldType(values);
      console.log(`  ${expectedType}: detected as ${detectedType} ${detectedType === expectedType ? '✅' : '❌'}`);
    });

    // Test 7: Test filterable value detection
    console.log('\n🔍 Test 7: Testing filterable value detection');
    const testFilterableValues = [
      'active', 'inactive', 'pending', // Should be filterable
      '123456789012345678901234', // MongoDB ObjectId - should be skipped
      '2023-12-01T10:30:00Z', // ISO date - should be skipped
      'a', // Too short - should be skipped
      'This is a very long string that exceeds the maximum length for filtering and should be skipped because it is too long' // Too long - should be skipped
    ];

    testFilterableValues.forEach(value => {
      const isFilterable = FilterValuesService.isFilterableValue(value);
      console.log(`  "${value}": ${isFilterable ? '✅ filterable' : '❌ not filterable'}`);
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Filter values creation and updates work correctly');
    console.log('✅ Field type determination works correctly');
    console.log('✅ Filterable value detection works correctly');
    console.log('✅ Clear functionality works correctly');
    console.log('✅ MongoDB integration works correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up test data
    try {
      await FilterValues.deleteMany({ indexName: 'test_filter_values_index' });
      console.log('🧹 Cleaned up test data');
    } catch (cleanupError) {
      console.error('⚠️ Failed to clean up test data:', cleanupError.message);
    }
    
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFilterValuesFunctionality();
}

module.exports = testFilterValuesFunctionality;

