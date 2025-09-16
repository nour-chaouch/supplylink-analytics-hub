const { getElasticsearchClient } = require('./elasticsearch');

// Index mappings for different data types
const indexMappings = {
  // Users index mapping
  users: {
    mappings: {
      properties: {
        name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        email: { type: 'keyword' },
        password: { type: 'keyword' },
        role: { type: 'keyword' },
        phone: { type: 'text' },
        address: { type: 'text' },
        company: { type: 'text' },
        bio: { type: 'text' },
        farmSize: { type: 'float' },
        mainCrops: { type: 'text' },
        storeLocation: { type: 'text' },
        businessType: { type: 'text' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    }
  },

  // Producer prices index mapping
  producer_prices: {
    mappings: {
      properties: {
        domainCode: { type: 'keyword' },
        domain: { type: 'text' },
        areaCode: { type: 'integer' },
        area: { 
          type: 'text', 
          fields: { 
            keyword: { type: 'keyword' },
            suggest: { type: 'completion' }
          } 
        },
        elementCode: { type: 'integer' },
        element: { type: 'text' },
        itemCode: { type: 'keyword' },
        item: { 
          type: 'text', 
          fields: { 
            keyword: { type: 'keyword' },
            suggest: { type: 'completion' }
          } 
        },
        year: { type: 'integer' },
        unit: { type: 'keyword' },
        value: { type: 'float' },
        flag: { type: 'keyword' },
        flagDescription: { type: 'text' },
        scrapedAt: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    }
  },

  // Crops and livestock index mapping
  crops_livestock: {
    mappings: {
      properties: {
        domainCode: { type: 'keyword' },
        domain: { type: 'text' },
        areaCode: { type: 'integer' },
        area: { 
          type: 'text', 
          fields: { 
            keyword: { type: 'keyword' },
            suggest: { type: 'completion' }
          } 
        },
        elementCode: { type: 'integer' },
        element: { type: 'text' },
        itemCode: { type: 'keyword' },
        item: { 
          type: 'text', 
          fields: { 
            keyword: { type: 'keyword' },
            suggest: { type: 'completion' }
          } 
        },
        year: { type: 'integer' },
        unit: { type: 'keyword' },
        value: { type: 'float' },
        flag: { type: 'keyword' },
        flagDescription: { type: 'text' },
        note: { type: 'text' },
        scrapedAt: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    }
  }
};

// Create index with mapping
const createIndex = async (indexName, mapping) => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized');
    }

    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: mapping
      });
      console.log(`✅ Created Elasticsearch index: ${indexName}`);
    } else {
      console.log(`ℹ️  Elasticsearch index already exists: ${indexName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating index ${indexName}:`, error.message);
    return false;
  }
};

// Create all indices
const createAllIndices = async () => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized');
    }

    console.log('🚀 Creating Elasticsearch indices...');
    
    for (const [indexName, mapping] of Object.entries(indexMappings)) {
      await createIndex(indexName, mapping);
    }
    
    console.log('✅ All Elasticsearch indices created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating indices:', error.message);
    return false;
  }
};

// Delete index (for testing/cleanup)
const deleteIndex = async (indexName) => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized');
    }

    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log(`✅ Deleted Elasticsearch index: ${indexName}`);
    } else {
      console.log(`ℹ️  Index does not exist: ${indexName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error deleting index ${indexName}:`, error.message);
    return false;
  }
};

// Get index stats
const getIndexStats = async (indexName) => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized');
    }

    const stats = await client.indices.stats({ index: indexName });
    return stats.body.indices[indexName];
  } catch (error) {
    console.error(`❌ Error getting stats for index ${indexName}:`, error.message);
    return null;
  }
};

module.exports = {
  indexMappings,
  createIndex,
  createAllIndices,
  deleteIndex,
  getIndexStats
};
