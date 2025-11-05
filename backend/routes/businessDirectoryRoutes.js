const express = require('express');
const router = express.Router();
const { getElasticsearchClient, reinitializeElasticsearch } = require('../config/elasticsearch');

const BUSINESS_INDEX = 'business_directory';

// Helper function to ensure index exists
const ensureIndexExists = async () => {
  let client = getElasticsearchClient();
  
  // Try to reconnect if client is not initialized
  if (!client) {
    console.log('Elasticsearch client not initialized, attempting to reconnect...');
    client = await reinitializeElasticsearch();
    
    if (!client) {
      throw new Error('Elasticsearch client not initialized. Please ensure Elasticsearch is running.');
    }
  }

  try {
    const exists = await client.indices.exists({ index: BUSINESS_INDEX });
    
    if (!exists) {
      // Create index with mapping for business directory
      await client.indices.create({
        index: BUSINESS_INDEX,
        body: {
          mappings: {
            properties: {
              name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              category: { type: 'keyword' },
              industry: { type: 'keyword' },
              description: { type: 'text' },
              website: { type: 'keyword' },
              email: { type: 'keyword' },
              phone: { type: 'keyword' },
              address: {
                properties: {
                  street: { type: 'text' },
                  city: { type: 'keyword' },
                  state: { type: 'keyword' },
                  zipCode: { type: 'keyword' },
                  country: { type: 'keyword' }
                }
              },
              location: { type: 'geo_point' },
              tags: { type: 'keyword' },
              products: { type: 'keyword' },
              services: { type: 'keyword' },
              employees: { type: 'integer' },
              yearFounded: { type: 'integer' },
              revenue: { type: 'float' },
              rating: { type: 'float' },
              socialMedia: {
                properties: {
                  facebook: { type: 'keyword' },
                  twitter: { type: 'keyword' },
                  linkedin: { type: 'keyword' },
                  instagram: { type: 'keyword' }
                }
              },
              verified: { type: 'boolean' },
              featured: { type: 'boolean' },
              logo: { type: 'keyword' },
              images: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
      console.log(`✅ Created index: ${BUSINESS_INDEX}`);
    }
  } catch (error) {
    console.error('Error ensuring index exists:', error.message);
    throw error;
  }
};

// Get all businesses
router.get('/', async (req, res) => {
  try {
    await ensureIndexExists();
    let client = getElasticsearchClient();
    
    // Try to reconnect if client is not initialized
    if (!client) {
      console.log('Elasticsearch client not initialized, attempting to reconnect...');
      client = await reinitializeElasticsearch();
      
      if (!client) {
        return res.status(503).json({ 
          success: false, 
          message: 'Elasticsearch client not initialized. Please ensure Elasticsearch is running.' 
        });
      }
    }
    
    const { q, category, industry, city, page = 1, limit = 50 } = req.query;

    const mustQueries = [];
    
    // Add text search if query provided
    if (q && q.trim()) {
      mustQueries.push({
        multi_match: {
          query: q,
          fields: ['name^3', 'description^2', 'products', 'services', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    // Add filters
    if (category) {
      mustQueries.push({ term: { category } });
    }
    if (industry) {
      mustQueries.push({ term: { industry } });
    }
    if (city) {
      mustQueries.push({ term: { 'address.city': city } });
    }

    const query = mustQueries.length > 0 ? { bool: { must: mustQueries } } : { match_all: {} };

    const response = await client.search({
      index: BUSINESS_INDEX,
      body: {
        query,
        from: (page - 1) * limit,
        size: parseInt(limit),
        sort: [{ featured: { order: 'desc' } }, { createdAt: { order: 'desc' } }]
      }
    });

    const businesses = response.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source
    }));

    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.hits.total.value,
        pages: Math.ceil(response.hits.total.value / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting businesses:', error.message);
    
    // Try to reconnect on error
    try {
      const client = await reinitializeElasticsearch();
      if (client) {
        // Retry the request
        await ensureIndexExists();
        const retryClient = getElasticsearchClient();
        const { q, category, industry, city, page = 1, limit = 50 } = req.query;
        
        const mustQueries = [];
        if (q && q.trim()) {
          mustQueries.push({
            multi_match: {
              query: q,
              fields: ['name^3', 'description^2', 'products', 'services', 'tags'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          });
        }
        if (category) mustQueries.push({ term: { category } });
        if (industry) mustQueries.push({ term: { industry } });
        if (city) mustQueries.push({ term: { 'address.city': city } });
        
        const query = mustQueries.length > 0 ? { bool: { must: mustQueries } } : { match_all: {} };
        
        const response = await retryClient.search({
          index: BUSINESS_INDEX,
          body: {
            query,
            from: (page - 1) * limit,
            size: parseInt(limit),
            sort: [{ featured: { order: 'desc' } }, { createdAt: { order: 'desc' } }]
          }
        });
        
        const businesses = response.hits.hits.map(hit => ({
          _id: hit._id,
          ...hit._source
        }));
        
        return res.json({
          success: true,
          data: businesses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: response.hits.total.value,
            pages: Math.ceil(response.hits.total.value / parseInt(limit))
          }
        });
      }
    } catch (reconnectError) {
      // Reconnection failed
    }
    
    res.status(500).json({ 
      success: false, 
      message: `Failed to get businesses: ${error.message}. Please ensure Elasticsearch is running.` 
    });
  }
});

// Get business by ID
router.get('/:id', async (req, res) => {
  try {
    const client = getElasticsearchClient();
    const response = await client.get({
      index: BUSINESS_INDEX,
      id: req.params.id
    });

    res.json({
      success: true,
      data: {
        _id: response._id,
        ...response._source
      }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ success: false, message: 'Business not found' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Add a new business
router.post('/', async (req, res) => {
  try {
    await ensureIndexExists();
    const client = getElasticsearchClient();
    
    const businessData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: req.body.verified || false,
      featured: req.body.featured || false
    };

    const response = await client.index({
      index: BUSINESS_INDEX,
      body: businessData
    });

    res.json({
      success: true,
      message: 'Business added successfully',
      data: {
        _id: response._id,
        ...businessData
      }
    });
  } catch (error) {
    console.error('Error adding business:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a business
router.put('/:id', async (req, res) => {
  try {
    const client = getElasticsearchClient();
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await client.update({
      index: BUSINESS_INDEX,
      id: req.params.id,
      body: {
        doc: updateData
      }
    });

    res.json({
      success: true,
      message: 'Business updated successfully'
    });
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ success: false, message: 'Business not found' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Delete a business
router.delete('/:id', async (req, res) => {
  try {
    const client = getElasticsearchClient();
    
    await client.delete({
      index: BUSINESS_INDEX,
      id: req.params.id
    });

    res.json({
      success: true,
      message: 'Business deleted successfully'
    });
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ success: false, message: 'Business not found' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    let client = getElasticsearchClient();
    
    // Try to reconnect if client is not initialized
    if (!client) {
      console.log('Elasticsearch client not initialized, attempting to reconnect...');
      client = await reinitializeElasticsearch();
      
      if (!client) {
        return res.status(503).json({ 
          success: false, 
          message: 'Elasticsearch client not initialized. Please ensure Elasticsearch is running.' 
        });
      }
    }
    
    const response = await client.search({
      index: BUSINESS_INDEX,
      body: {
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category',
              size: 100
            }
          }
        }
      }
    });

    const categories = response.aggregations?.categories?.buckets?.map(bucket => ({
      name: bucket.key,
      count: bucket.doc_count
    })) || [];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `Failed to get categories: ${error.message}. Please ensure Elasticsearch is running.` 
    });
  }
});

// Get industries
router.get('/industries/list', async (req, res) => {
  try {
    let client = getElasticsearchClient();
    
    // Try to reconnect if client is not initialized
    if (!client) {
      console.log('Elasticsearch client not initialized, attempting to reconnect...');
      client = await reinitializeElasticsearch();
      
      if (!client) {
        return res.status(503).json({ 
          success: false, 
          message: 'Elasticsearch client not initialized. Please ensure Elasticsearch is running.' 
        });
      }
    }
    
    const response = await client.search({
      index: BUSINESS_INDEX,
      body: {
        size: 0,
        aggs: {
          industries: {
            terms: {
              field: 'industry',
              size: 100
            }
          }
        }
      }
    });

    const industries = response.aggregations?.industries?.buckets?.map(bucket => ({
      name: bucket.key,
      count: bucket.doc_count
    })) || [];

    res.json({
      success: true,
      data: industries
    });
  } catch (error) {
    console.error('Error getting industries:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `Failed to get industries: ${error.message}. Please ensure Elasticsearch is running.` 
    });
  }
});

// Add multiple businesses (bulk)
router.post('/bulk', async (req, res) => {
  try {
    await ensureIndexExists();
    const client = getElasticsearchClient();
    const businesses = req.body;

    const bulkBody = [];
    
    for (const business of businesses) {
      bulkBody.push({ index: { _index: BUSINESS_INDEX } });
      bulkBody.push({
        ...business,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: business.verified || false,
        featured: business.featured || false
      });
    }

    const response = await client.bulk({ body: bulkBody });
    
    // Check for errors in bulk operation
    const errors = response.items.filter(item => item.index.error);
    
    if (errors.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Some businesses failed to be added',
        errors
      });
    }

    res.json({
      success: true,
      message: `${businesses.length} businesses added successfully`
    });
  } catch (error) {
    console.error('Error adding businesses in bulk:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;









