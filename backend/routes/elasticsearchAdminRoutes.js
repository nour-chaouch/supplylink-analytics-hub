const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { createIndex, deleteIndex, getIndexStats } = require('../config/elasticsearchMappings');
const UserService = require('../services/UserService');
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

// Supported file extensions for data import
const SUPPORTED_EXTENSIONS = ['.json', '.csv', '.xlsx', '.xls'];

// Helper function to parse different file formats
// Helper function to convert values to appropriate Elasticsearch types
const convertValueToType = (value, targetType) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    switch (targetType) {
      case 'integer':
        if (typeof value === 'string' && value.includes('$oid')) {
          // Handle MongoDB ObjectId as string
          return parseInt(value.replace(/\D/g, '').slice(-8), 16) || 0;
        }
        return parseInt(value, 10);
      
      case 'float':
        return parseFloat(value);
      
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
      
      case 'date':
        if (typeof value === 'object' && value.$date) {
          // Handle MongoDB Date object
          return new Date(value.$date).toISOString();
        }
        if (typeof value === 'string' && value.includes('$date')) {
          // Handle stringified MongoDB Date
          const dateMatch = value.match(/\$date["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
          if (dateMatch) {
            return new Date(dateMatch[1]).toISOString();
          }
        }
        return new Date(value).toISOString();
      
      case 'keyword':
        if (typeof value === 'object' && value.$oid) {
          // Handle MongoDB ObjectId
          return value.$oid;
        }
        if (typeof value === 'string' && value.includes('$oid')) {
          // Handle stringified MongoDB ObjectId
          const oidMatch = value.match(/\$oid["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
          if (oidMatch) {
            return oidMatch[1];
          }
        }
        return String(value);
      
      case 'text':
        return String(value);
      
      default:
        return value;
    }
  } catch (error) {
    console.warn(`Failed to convert value ${value} to type ${targetType}:`, error.message);
    return value;
  }
};

const parseFileData = async (file) => {
  const { originalname, mimetype, buffer } = file;
  
  try {
    if (mimetype === 'application/json') {
      // Parse JSON file
      const data = JSON.parse(buffer.toString());
      return Array.isArray(data) ? data : [data];
    }
    
    if (mimetype === 'text/csv') {
      // Parse CSV file
      const csv = require('csv-parser');
      const results = [];
      
      return new Promise((resolve, reject) => {
        const stream = require('stream');
        const readable = new stream.Readable();
        readable.push(buffer.toString());
        readable.push(null);
        
        readable
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    }
    
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimetype === 'application/vnd.ms-excel') {
      // Parse Excel file
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    }
    
    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

// Apply protect and adminOnly middleware to all routes
router.use(protect);
router.use(adminOnly);

// Configure multer for file uploads
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 50;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON, CSV, and Excel files are allowed'), false);
    }
  }
});

// Get supported file formats for data import
router.get('/supported-formats', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        supportedExtensions: SUPPORTED_EXTENSIONS,
        formats: [
          { extension: '.json', description: 'JavaScript Object Notation files', maxSize: `${MAX_FILE_SIZE_MB}MB`, mimetype: 'application/json' },
          { extension: '.csv', description: 'Comma-separated values files', maxSize: `${MAX_FILE_SIZE_MB}MB`, mimetype: 'text/csv' },
          { extension: '.xlsx', description: 'Microsoft Excel files (modern)', maxSize: `${MAX_FILE_SIZE_MB}MB`, mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { extension: '.xls', description: 'Microsoft Excel files (legacy)', maxSize: `${MAX_FILE_SIZE_MB}MB`, mimetype: 'application/vnd.ms-excel' }
        ],
        maxFileSize: `${MAX_FILE_SIZE_MB}MB`,
        notes: [
          'createdAt and updatedAt timestamps will be added automatically if missing',
          'MongoDB-style ObjectIds and dates will be converted automatically',
          'CSV files will have data types inferred automatically',
          'Excel files will use the first worksheet'
        ]
      }
    });
  } catch (error) {
    console.error('Get supported formats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get Elasticsearch cluster health
router.get('/health', async (req, res) => {
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
router.get('/indices', async (req, res) => {
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
router.post('/indices', async (req, res) => {
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

    // Create index with mapping and settings
    const indexBody = mapping || {};
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
router.delete('/indices/:indexName', async (req, res) => {
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
router.get('/indices/:indexName/mapping', async (req, res) => {
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

// Get index schema for form generation
router.get('/indices/:indexName/schema', async (req, res) => {
  try {
    const { indexName } = req.params;
    const client = getElasticsearchClient();
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    // Get mapping
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName]?.mappings?.properties || {};
    
    // Get predefined mapping if available
    const { indexMappings } = require('../config/elasticsearchMappings');
    const predefinedMapping = indexMappings[indexName];
    
    const fields = [];
    
    // Process fields from mapping
    for (const [fieldName, fieldConfig] of Object.entries(properties)) {
      const config = fieldConfig;
      
      // Skip system fields
      if (fieldName.startsWith('_') || fieldName === 'createdAt' || fieldName === 'updatedAt') {
        continue;
      }
      
      let fieldInfo = {
        name: fieldName,
        type: config.type || 'text',
        required: false,
        description: '',
        example: '',
        validation: {}
      };
      
      // Set field-specific information based on type
      switch (config.type) {
        case 'keyword':
          fieldInfo.inputType = 'text';
          fieldInfo.validation.maxLength = 256;
          break;
        case 'text':
          fieldInfo.inputType = 'textarea';
          break;
        case 'integer':
          fieldInfo.inputType = 'number';
          fieldInfo.validation.step = 1;
          break;
        case 'float':
          fieldInfo.inputType = 'number';
          fieldInfo.validation.step = 0.01;
          break;
        case 'date':
          fieldInfo.inputType = 'datetime-local';
          break;
        case 'boolean':
          fieldInfo.inputType = 'select';
          fieldInfo.options = [
            { value: true, label: 'True' },
            { value: false, label: 'False' }
          ];
          break;
        default:
          fieldInfo.inputType = 'text';
      }
      
      // Add field-specific metadata for known indices
      if (indexName === 'producer_prices') {
        switch (fieldName) {
          case 'domainCode':
            fieldInfo.description = 'Domain code (e.g., PP for Producer Prices)';
            fieldInfo.example = 'PP';
            fieldInfo.required = true;
            break;
          case 'domain':
            fieldInfo.description = 'Domain name';
            fieldInfo.example = 'Producer Prices';
            fieldInfo.required = true;
            break;
          case 'areaCode':
            fieldInfo.description = 'Country/Area code';
            fieldInfo.example = '4';
            fieldInfo.required = true;
            break;
          case 'area':
            fieldInfo.description = 'Country/Area name';
            fieldInfo.example = 'Algeria';
            fieldInfo.required = true;
            break;
          case 'elementCode':
            fieldInfo.description = 'Element code';
            fieldInfo.example = '5532';
            fieldInfo.required = true;
            break;
          case 'element':
            fieldInfo.description = 'Element name';
            fieldInfo.example = 'Producer Price (USD/tonne)';
            fieldInfo.required = true;
            break;
          case 'itemCode':
            fieldInfo.description = 'Item code';
            fieldInfo.example = '44';
            fieldInfo.required = true;
            break;
          case 'item':
            fieldInfo.description = 'Item name';
            fieldInfo.example = 'Barley';
            fieldInfo.required = true;
            break;
          case 'year':
            fieldInfo.description = 'Year';
            fieldInfo.example = '1991';
            fieldInfo.required = true;
            break;
          case 'unit':
            fieldInfo.description = 'Unit of measurement';
            fieldInfo.example = 'USD';
            fieldInfo.required = true;
            break;
          case 'value':
            fieldInfo.description = 'Value';
            fieldInfo.example = '124.5';
            fieldInfo.required = true;
            break;
          case 'flag':
            fieldInfo.description = 'Data flag';
            fieldInfo.example = 'A';
            fieldInfo.required = false;
            break;
          case 'flagDescription':
            fieldInfo.description = 'Flag description';
            fieldInfo.example = 'Official figure';
            fieldInfo.required = false;
            break;
        }
      }
      
      fields.push(fieldInfo);
    }
    
    // Sort fields - required first, then alphabetical
    fields.sort((a, b) => {
      if (a.required !== b.required) {
        return b.required ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      data: {
        indexName,
        fields,
        hasPredefinedMapping: !!predefinedMapping,
        totalFields: fields.length,
        requiredFields: fields.filter(f => f.required).length
      }
    });
  } catch (error) {
    console.error('Get schema error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get sortable fields for an index
router.get('/indices/:indexName/sort-fields', async (req, res) => {
  try {
    const { indexName } = req.params;
    const client = getElasticsearchClient();
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    // Get mapping to determine field types
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName]?.mappings?.properties || {};
    
    const sortableFields = [];
    
    // Add default sort fields
    sortableFields.push({
      field: '_score',
      label: 'Relevance Score',
      type: 'score'
    });
    
    // Process fields from mapping
    for (const [fieldName, fieldConfig] of Object.entries(properties)) {
      // Skip system fields and non-sortable fields
      if (fieldName.startsWith('_') || 
          fieldName === 'createdAt' || 
          fieldName === 'updatedAt' ||
          fieldConfig.type === 'text' || // text fields are not sortable by default
          fieldConfig.type === 'object' ||
          fieldConfig.type === 'nested') {
        continue;
      }
      
      let fieldType = fieldConfig.type || 'keyword';
      let label = fieldName;
      
      // Create human-readable labels
      switch (fieldName) {
        case 'domainCode':
          label = 'Domain Code';
          break;
        case 'domain':
          label = 'Domain';
          break;
        case 'areaCode':
          label = 'Area Code';
          break;
        case 'area':
          label = 'Area';
          break;
        case 'elementCode':
          label = 'Element Code';
          break;
        case 'element':
          label = 'Element';
          break;
        case 'itemCode':
          label = 'Item Code';
          break;
        case 'item':
          label = 'Item';
          break;
        case 'year':
          label = 'Year';
          break;
        case 'unit':
          label = 'Unit';
          break;
        case 'value':
          label = 'Value';
          break;
        case 'flag':
          label = 'Flag';
          break;
        case 'flagDescription':
          label = 'Flag Description';
          break;
        default:
          // Convert camelCase to Title Case
          label = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      }
      
      sortableFields.push({
        field: fieldName,
        label: label,
        type: fieldType
      });
    }
    
    // Add timestamp fields if they exist
    if (properties.createdAt) {
      sortableFields.push({
        field: 'createdAt',
        label: 'Created At',
        type: 'date'
      });
    }
    if (properties.updatedAt) {
      sortableFields.push({
        field: 'updatedAt',
        label: 'Updated At',
        type: 'date'
      });
    }
    
    // Sort fields alphabetically by label
    sortableFields.sort((a, b) => a.label.localeCompare(b.label));

    res.json({
      success: true,
      data: {
        sortableFields,
        totalFields: sortableFields.length
      }
    });
  } catch (error) {
    console.error('Get sort fields error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get index stats
router.get('/indices/:indexName/stats', async (req, res) => {
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

// Custom authentication for SSE routes
const authenticateSSE = async (req, res, next) => {
  let token;

  // Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const User = require('../models/User');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          message: 'User not found' 
        }));
        return;
      }

      // Check if user is admin
      if (req.user.role !== 'admin') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          message: 'Admin access required' 
        }));
        return;
      }

      next();
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        message: 'Invalid token' 
      }));
      return;
    }
  } else {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false,
      message: 'No token provided' 
    }));
    return;
  }
};

// Import with real-time progress tracking using Server-Sent Events
router.post('/indices/:indexName/import-with-progress', authenticateSSE, upload.single('file'), async (req, res) => {
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

    // Parse file data
    let data;
    try {
      data = await parseFileData(req.file);
    } catch (parseError) {
      return res.status(400).json({ 
        success: false, 
        message: parseError.message 
      });
    }

    // Set up Server-Sent Events AFTER all validation
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial progress
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      total: data.length, 
      processed: 0, 
      imported: 0, 
      errors: 0 
    })}\n\n`);

    // Bulk import data with progress updates
    const bulkSizeNum = parseInt(bulkSize);
    let imported = 0;
    let errors = 0;
    let processed = 0;

    for (let i = 0; i < data.length; i += bulkSizeNum) {
      const batch = data.slice(i, i + bulkSizeNum);
      const body = [];
      const batchTimestamp = Date.now();

      batch.forEach((doc, index) => {
        // Filter out MongoDB-specific fields that we don't need in Elasticsearch
        const filteredDoc = { ...doc };
        const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];
        
        skipFields.forEach(field => {
          delete filteredDoc[field];
        });
        
        // Convert MongoDB-style data to Elasticsearch-compatible format
        const convertedDoc = {};
        for (const [key, value] of Object.entries(filteredDoc)) {
          if (value === null || value === undefined) {
            convertedDoc[key] = value;
            continue;
          }
          
          // Handle MongoDB ObjectId
          if (typeof value === 'object' && value.$oid) {
            convertedDoc[key] = value.$oid;
          }
          // Handle MongoDB Date
          else if (typeof value === 'object' && value.$date) {
            convertedDoc[key] = new Date(value.$date).toISOString();
          }
          // Handle stringified MongoDB objects
          else if (typeof value === 'string') {
            if (value.includes('$oid')) {
              const oidMatch = value.match(/\$oid["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
              if (oidMatch) {
                convertedDoc[key] = oidMatch[1];
              } else {
                convertedDoc[key] = value;
              }
            } else if (value.includes('$date')) {
              const dateMatch = value.match(/\$date["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
              if (dateMatch) {
                convertedDoc[key] = new Date(dateMatch[1]).toISOString();
              } else {
                convertedDoc[key] = value;
              }
            } else {
              convertedDoc[key] = value;
            }
          }
          // Handle arrays with MongoDB objects
          else if (Array.isArray(value)) {
            convertedDoc[key] = value.map(item => {
              if (typeof item === 'object' && item.$oid) {
                return item.$oid;
              } else if (typeof item === 'object' && item.$date) {
                return new Date(item.$date).toISOString();
              }
              return item;
            });
          }
          else {
            convertedDoc[key] = value;
          }
        }
        
        // Add timestamps if missing
        if (!convertedDoc.createdAt) {
          convertedDoc.createdAt = new Date().toISOString();
        }
        if (!convertedDoc.updatedAt) {
          convertedDoc.updatedAt = new Date().toISOString();
        }
        
        // Generate unique ID using batch timestamp and position to avoid conflicts
        const documentId = `${batchTimestamp}_${i + index}`;
        
        body.push({
          index: {
            _index: indexName,
            _id: documentId
          }
        });
        body.push(convertedDoc);
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
        
        processed += batch.length;
        
        // Send progress update
        const progress = Math.round((processed / data.length) * 100);
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          total: data.length, 
          processed, 
          imported, 
          errors, 
          progress 
        })}\n\n`);
        
      } catch (bulkError) {
        console.error('Bulk import error:', bulkError);
        errors += batch.length;
        processed += batch.length;
        
        // Send error progress update
        const progress = Math.round((processed / data.length) * 100);
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          total: data.length, 
          processed, 
          imported, 
          errors, 
          progress,
          error: bulkError.message 
        })}\n\n`);
      }
    }

    // Send completion
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      total: data.length, 
      processed, 
      imported, 
      errors, 
      progress: 100,
      success: true,
      message: `Import completed: ${imported} documents imported, ${errors} errors`
    })}\n\n`);
    
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

// Import JSON data to index
router.post('/indices/:indexName/import', upload.single('file'), async (req, res) => {
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
    console.log(`Index ${indexName} exists:`, exists);
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index not found' 
      });
    }

    // Parse file data
    let data;
    try {
      data = await parseFileData(req.file);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: parseError.message 
      });
    }

    // Bulk import data
    const bulkSizeNum = parseInt(bulkSize);
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += bulkSizeNum) {
      const batch = data.slice(i, i + bulkSizeNum);
      const body = [];
      const batchTimestamp = Date.now(); // Generate timestamp once per batch

      batch.forEach((doc, index) => {
        // Filter out MongoDB-specific fields that we don't need in Elasticsearch
        const filteredDoc = { ...doc };
        const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];
        
        skipFields.forEach(field => {
          delete filteredDoc[field];
        });
        
        // Convert MongoDB-style data to Elasticsearch-compatible format
        const convertedDoc = {};
        for (const [key, value] of Object.entries(filteredDoc)) {
          if (value === null || value === undefined) {
            convertedDoc[key] = value;
            continue;
          }
          
          // Handle MongoDB ObjectId
          if (typeof value === 'object' && value.$oid) {
            convertedDoc[key] = value.$oid;
          }
          // Handle MongoDB Date
          else if (typeof value === 'object' && value.$date) {
            convertedDoc[key] = new Date(value.$date).toISOString();
          }
          // Handle stringified MongoDB objects
          else if (typeof value === 'string') {
            if (value.includes('$oid')) {
              const oidMatch = value.match(/\$oid["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
              if (oidMatch) {
                convertedDoc[key] = oidMatch[1];
              } else {
                convertedDoc[key] = value;
              }
            } else if (value.includes('$date')) {
              const dateMatch = value.match(/\$date["\s]*:\s*["\s]*([^"}\s]+)["\s]*/);
              if (dateMatch) {
                convertedDoc[key] = new Date(dateMatch[1]).toISOString();
              } else {
                convertedDoc[key] = value;
              }
            } else {
              convertedDoc[key] = value;
            }
          }
          // Handle arrays with MongoDB objects
          else if (Array.isArray(value)) {
            convertedDoc[key] = value.map(item => {
              if (typeof item === 'object' && item.$oid) {
                return item.$oid;
              } else if (typeof item === 'object' && item.$date) {
                return new Date(item.$date).toISOString();
              }
              return item;
            });
          }
          else {
            convertedDoc[key] = value;
          }
        }
        
        // Add timestamps if missing
        if (!convertedDoc.createdAt) {
          convertedDoc.createdAt = new Date().toISOString();
        }
        if (!convertedDoc.updatedAt) {
          convertedDoc.updatedAt = new Date().toISOString();
        }
        
        // Generate unique ID using batch timestamp and position to avoid conflicts
        const documentId = `${batchTimestamp}_${i + index}`;
        
        body.push({
          index: {
            _index: indexName,
            _id: documentId
          }
        });
        body.push(convertedDoc);
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
router.post('/create-predefined-indices', async (req, res) => {
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
router.get('/templates', async (req, res) => {
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

// ==================== DATA MANAGEMENT ENDPOINTS ====================

// Get documents from an index with pagination and search
router.get('/indices/:indexName/documents', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { 
      page = 1, 
      size = 10, 
      search = '', 
      sortField = '_id', 
      sortOrder = 'desc',
      fields = '*'
    } = req.query;

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
        message: `Index '${indexName}' not found` 
      });
    }

    const from = (parseInt(page) - 1) * parseInt(size);
    const query = {
      index: indexName,
      body: {
        from,
        size: parseInt(size),
        sort: [{ [sortField]: { order: sortOrder } }],
        _source: fields === '*' ? true : fields.split(',')
      }
    };

    // Add search if provided
    if (search.trim()) {
      query.body.query = {
        multi_match: {
          query: search,
          fields: ['*'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      };
    } else {
      query.body.query = { match_all: {} };
    }

    const response = await client.search(query);

    res.json({
      success: true,
      data: {
        documents: response.hits.hits.map(hit => ({
          _id: hit._id,
          _source: hit._source,
          _score: hit._score
        })),
        total: response.hits.total.value,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(response.hits.total.value / parseInt(size))
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get a specific document by ID
router.get('/indices/:indexName/documents/:documentId', async (req, res) => {
  try {
    const { indexName, documentId } = req.params;
    const client = getElasticsearchClient();
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    const response = await client.get({
      index: indexName,
      id: documentId
    });

    res.json({
      success: true,
      data: {
        _id: response._id,
        _source: response._source,
        _version: response._version
      }
    });
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ 
        success: false, 
        message: `Document '${req.params.documentId}' not found` 
      });
    }
    console.error('Get document error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create a new document
router.post('/indices/:indexName/documents', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { document, documentId } = req.body;
    
    if (!document) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document data is required' 
      });
    }

    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    // Add timestamps
    const documentWithTimestamps = {
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      index: indexName,
      body: documentWithTimestamps
    };

    if (documentId) {
      params.id = documentId;
    }

    const response = await client.index(params);

    res.json({
      success: true,
      message: 'Document created successfully',
      data: {
        _id: response._id,
        _version: response._version,
        result: response.result
      }
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update an existing document
router.put('/indices/:indexName/documents/:documentId', async (req, res) => {
  try {
    const { indexName, documentId } = req.params;
    const { document } = req.body;
    
    if (!document) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document data is required' 
      });
    }

    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    // Add updated timestamp
    const documentWithTimestamps = {
      ...document,
      updatedAt: new Date().toISOString()
    };

    const response = await client.index({
      index: indexName,
      id: documentId,
      body: documentWithTimestamps
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        _id: response._id,
        _version: response._version,
        result: response.result
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete a document
router.delete('/indices/:indexName/documents/:documentId', async (req, res) => {
  try {
    const { indexName, documentId } = req.params;
    const client = getElasticsearchClient();
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    const response = await client.delete({
      index: indexName,
      id: documentId
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        _id: response._id,
        _version: response._version,
        result: response.result
      }
    });
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ 
        success: false, 
        message: `Document '${req.params.documentId}' not found` 
      });
    }
    console.error('Delete document error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Bulk operations on documents
router.post('/indices/:indexName/documents/bulk', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { operations } = req.body;
    
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Operations array is required' 
      });
    }

    const client = getElasticsearchClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Elasticsearch client not initialized' 
      });
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Index '${indexName}' not found` 
      });
    }

    const body = [];
    operations.forEach(op => {
      if (op.action === 'delete') {
        body.push({ delete: { _index: indexName, _id: op.documentId } });
      } else if (op.action === 'index' || op.action === 'create') {
        const doc = {
          ...op.document,
          updatedAt: new Date().toISOString()
        };
        
        if (op.action === 'create') {
          body.push({ create: { _index: indexName, _id: op.documentId } });
        } else {
          body.push({ index: { _index: indexName, _id: op.documentId } });
        }
        body.push(doc);
      }
    });

    const response = await client.bulk({ body });

    const results = {
      total: operations.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    response.items.forEach((item, index) => {
      const operation = operations[index];
      const result = item[operation.action];
      
      if (result.error) {
        results.failed++;
        results.errors.push({
          operation: operation.action,
          documentId: operation.documentId,
          error: result.error.reason
        });
      } else {
        results.successful++;
      }
    });

    res.json({
      success: true,
      message: `Bulk operation completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;

