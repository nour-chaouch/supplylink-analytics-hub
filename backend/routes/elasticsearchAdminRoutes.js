const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { createIndex, deleteIndex, getIndexStats } = require('../config/elasticsearchMappings');
const UserService = require('../services/UserService');
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// Get Elasticsearch cluster health
router.get('/elasticsearch/health', async (req, res) => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const health = await client.cluster.health();
    const indices = await client.cat.indices({ format: 'json' });

    res.json({
      success: true,
      data: {
        clusterHealth: health,
        indices: indices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all indices
router.get('/elasticsearch/indices', async (req, res) => {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const indices = await client.cat.indices({ format: 'json' });
    
    res.json({
      success: true,
      data: indices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create index
router.post('/elasticsearch/indices', async (req, res) => {
  try {
    const { indexName, mapping } = req.body;
    
    if (!indexName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Index name is required' 
      });
    }

    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    // Check if index already exists
    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Index already exists' 
      });
    }

    // Create index with mapping
    const indexBody = mapping ? { mappings: mapping } : {};
    await client.indices.create({
      index: indexName,
      body: indexBody
    });

    res.json({
      success: true,
      message: `Index '${indexName}' created successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete index
router.delete('/elasticsearch/indices/:indexName', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index not found' 
      });
    }

    await client.indices.delete({ index: indexName });

    res.json({
      success: true,
      message: `Index '${indexName}' deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get index mapping
router.get('/elasticsearch/indices/:indexName/mapping', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const mapping = await client.indices.getMapping({ index: indexName });

    res.json({
      success: true,
      data: mapping
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get index stats
router.get('/elasticsearch/indices/:indexName/stats', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const stats = await getIndexStats(indexName);
    if (!stats) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index not found' 
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import JSON data to index
router.post('/elasticsearch/indices/:indexName/import', upload.single('file'), async (req, res) => {
  try {
    const { indexName } = req.params;
    const { bulkSize = 1000 } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index not found' 
      });
    }

    // Parse JSON file
    let data;
    try {
      data = JSON.parse(req.file.buffer.toString());
    } catch (parseError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON file' 
      });
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = [data];
    }

    // Bulk import data
    const bulkSizeNum = parseInt(bulkSize);
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += bulkSizeNum) {
      const batch = data.slice(i, i + bulkSizeNum);
      const body = [];

      batch.forEach((doc, index) => {
        body.push({
          index: {
            _index: indexName,
            _id: doc._id || `${i + index}`
          }
        });
        body.push(doc);
      });

      try {
        const response = await client.bulk({ body });
        
        // Count successful and failed operations
        response.items.forEach(item => {
          if (item.index && item.index.error) {
            errors++;
          } else {
            imported++;
          }
        });
      } catch (bulkError) {
        console.error('Bulk import error:', bulkError);
        errors += batch.length;
      }
    }

    res.json({
      success: true,
      message: `Import completed: ${imported} documents imported, ${errors} errors`,
      data: {
        imported,
        errors,
        total: data.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create predefined indices (users, producer_prices, crops_livestock)
router.post('/elasticsearch/create-predefined-indices', async (req, res) => {
  try {
    const { createAllIndices } = require('../config/elasticsearchMappings');
    
    const result = await createAllIndices();
    
    if (result) {
      res.json({
        success: true,
        message: 'All predefined indices created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create predefined indices'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get index templates
router.get('/elasticsearch/templates', async (req, res) => {
  try {
    const templates = {
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

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

