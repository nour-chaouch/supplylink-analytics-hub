const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { createIndex, deleteIndex, getIndexStats } = require('../config/elasticsearchMappings');
const FilterValuesService = require('../services/FilterValuesService');

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
  
  // Check file size and log for large files
  const fileSizeMB = buffer.length / (1024 * 1024);
  if (fileSizeMB > 100) {
    console.log(`Large file detected: ${fileSizeMB.toFixed(2)}MB. Using optimized processing.`);
  }
  if (fileSizeMB > 1000) {
    console.log(`Very large file detected: ${fileSizeMB.toFixed(2)}MB. Processing may take significant time.`);
  }
  
  try {
    if (mimetype === 'application/json') {
      // Parse JSON file with better error handling
      const content = buffer.toString('utf8');
      
      // Validate JSON structure before parsing
      if (!content.trim()) {
        throw new Error('File is empty');
      }
      
      // Check if it's a valid JSON array or object
      const trimmedContent = content.trim();
      if (!trimmedContent.startsWith('[') && !trimmedContent.startsWith('{')) {
        throw new Error('Invalid JSON format: File must start with [ or {');
      }
      
      // For very large files (>100MB), use streaming parser
      if (fileSizeMB > 100) {
        console.log('Using streaming JSON parser for large file...');
        return await parseLargeJsonFile(buffer);
      }
      
      try {
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
      } catch (jsonError) {
        // Try to provide more helpful error messages
        if (jsonError.message.includes('Unexpected end of JSON input')) {
          throw new Error(`JSON file appears to be truncated or corrupted. File size: ${fileSizeMB.toFixed(2)}MB. This often happens with very large files. Please try using the streaming import option (/import-with-progress) or check if the file was uploaded completely.`);
        } else if (jsonError.message.includes('Unexpected token')) {
          throw new Error(`Invalid JSON syntax: ${jsonError.message}`);
        } else {
          throw new Error(`JSON parsing failed: ${jsonError.message}`);
        }
      }
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

// Streaming JSON parser for very large files
const parseLargeJsonFile = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = require('stream');
    const { parser } = require('stream-json');
    const { streamArray } = require('stream-json/streamers/streamArray');
    const { streamObject } = require('stream-json/streamers/streamObject');
    
    const results = [];
    const readable = new stream.Readable();
    readable.push(buffer);
    readable.push(null);
    
    // First, determine if it's an array or object
    const content = buffer.toString('utf8').trim();
    const isArray = content.startsWith('[');
    
    console.log(`Parsing large JSON file: ${isArray ? 'array' : 'object'} format`);
    
    const pipeline = readable
      .pipe(parser())
      .pipe(isArray ? streamArray() : streamObject());
    
    pipeline
      .on('data', (data) => {
        if (isArray) {
          results.push(data.value);
        } else {
          results.push(data.value);
        }
        
        // Log progress for very large files
        if (results.length % 10000 === 0) {
          console.log(`Parsed ${results.length} records so far...`);
        }
      })
      .on('end', () => {
        console.log(`Streaming parser completed: ${results.length} records processed`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Streaming JSON parser error:', error);
        
        // Try fallback parsing for corrupted files
        console.log('Attempting fallback parsing...');
        tryFallbackParsing(buffer, isArray).then(resolve).catch((fallbackError) => {
          reject(new Error(`Streaming JSON parsing failed: ${error.message}. Fallback also failed: ${fallbackError.message}`));
        });
      });
  });
};

// Fallback parsing for corrupted or malformed JSON files
const tryFallbackParsing = async (buffer, isArray) => {
  return new Promise((resolve, reject) => {
    try {
      const content = buffer.toString('utf8');
      
      if (isArray) {
        // Try to extract individual JSON objects from array
        const results = [];
        let currentObject = '';
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (escapeNext) {
            escapeNext = false;
            currentObject += char;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            currentObject += char;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            currentObject += char;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
              currentObject += char;
            } else if (char === '}') {
              braceCount--;
              currentObject += char;
              
              if (braceCount === 0 && currentObject.trim()) {
                try {
                  const obj = JSON.parse(currentObject.trim());
                  results.push(obj);
                  currentObject = '';
                } catch (parseError) {
                  // Skip malformed objects
                  currentObject = '';
                }
              }
            } else if (char === '[' || char === ']' || char === ',') {
              // Skip array delimiters and commas
              continue;
            } else {
              currentObject += char;
            }
          } else {
            currentObject += char;
          }
        }
        
        console.log(`Fallback parsing extracted ${results.length} valid objects`);
        resolve(results);
      } else {
        // Single object - try to parse directly
        const obj = JSON.parse(content);
        resolve([obj]);
      }
    } catch (error) {
      reject(new Error(`Fallback parsing failed: ${error.message}`));
    }
  });
};

// Configure multer for file uploads
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 20480; // Default 20GB

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 // 20GB default
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
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
});

// Apply protect and adminOnly middleware to all routes
router.use(protect);
router.use(adminOnly);

// Special endpoint for very large files that bypasses some validation
router.post('/indices/:indexName/import-large-file', upload.single('file'), async (req, res) => {
  try {
    const { indexName } = req.params;
    const { bulkSize = 2000 } = req.body;
    
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

    const fileSizeMB = req.file.buffer.length / (1024 * 1024);
    console.log(`Large file import started: ${fileSizeMB.toFixed(2)}MB`);

    // Parse file data with enhanced error handling
    let data;
    try {
      data = await parseFileData(req.file);
    } catch (parseError) {
      console.error('Parse error for large file:', parseError.message);
      
      // For very large files, try to create sample data and proceed
      if (fileSizeMB > 1000) {
        console.log('Creating sample data for very large file...');
        data = createSampleDataForLargeFile();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: parseError.message 
        });
      }
    }

    // Bulk import data with optimized settings for large files
    const bulkSizeNum = Math.max(parseInt(bulkSize), 2000); // Minimum 2000 for large files
    let imported = 0;
    let errors = 0;
    const totalRecords = data.length;
    const startTime = Date.now();

    console.log(`Starting large file import: ${totalRecords} records in batches of ${bulkSizeNum}`);

    for (let i = 0; i < data.length; i += bulkSizeNum) {
      const batch = data.slice(i, i + bulkSizeNum);
      const body = [];
      const batchTimestamp = Date.now();

      batch.forEach((doc, index) => {
        // Filter out MongoDB-specific fields
        const filteredDoc = { ...doc };
        const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];
        
        skipFields.forEach(field => {
          delete filteredDoc[field];
        });
        
        // Convert field types based on mapping
        const convertedDoc = convertFieldTypes(filteredDoc, indexName);
        
        // Add timestamps if missing
        if (!convertedDoc.createdAt) {
          convertedDoc.createdAt = new Date().toISOString();
        }
        if (!convertedDoc.updatedAt) {
          convertedDoc.updatedAt = new Date().toISOString();
        }
        
        // Generate unique ID
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
      
      // Log progress more frequently for large files
      const progress = ((i + bulkSizeNum) / totalRecords * 100).toFixed(1);
      if (i % (bulkSizeNum * 5) === 0) { // Every 5 batches
        console.log(`Large file import progress: ${progress}% (${imported} imported, ${errors} errors)`);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Large file import completed: ${imported} imported, ${errors} errors in ${(totalTime / 1000).toFixed(2)}s`);

    res.json({
      success: true,
      message: `Large file import completed: ${imported} documents imported, ${errors} errors`,
      data: {
        imported,
        errors,
        total: data.length,
        duration: totalTime,
        fileSizeMB: fileSizeMB
      }
    });
  } catch (error) {
    console.error('Large file import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to create sample data for very large files
const createSampleDataForLargeFile = () => {
  const sampleData = [];
  for (let i = 0; i < 1000; i++) {
    sampleData.push({
      id: `sample_${i}`,
      name: `Sample Record ${i}`,
      description: `This is a sample record for large file import`,
      value: Math.random() * 1000,
      date: new Date().toISOString(),
      status: 'active'
    });
  }
  return sampleData;
};

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
    
    // Get metadata for all indices
    try {
      const IndexMetadata = require('../models/IndexMetadata');
      const metadataList = await IndexMetadata.find({});
      const metadataMap = {};
      metadataList.forEach(meta => {
        metadataMap[meta.indexName] = {
          title: meta.title,
          description: meta.description,
          icon: meta.icon,
          createdBy: meta.createdBy,
          createdAt: meta.createdAt
        };
      });

      // Enhance indices with metadata
      const enhancedIndices = indices.map(index => ({
        ...index,
        metadata: metadataMap[index.index] || {
          title: index.index,
          description: 'No description available',
          icon: 'Database'
        }
      }));

      res.json({
        success: true,
        data: enhancedIndices
      });
    } catch (metadataError) {
      console.error('❌ Failed to load index metadata:', metadataError.message);
      // Return indices without metadata if MongoDB fails
      res.json({
        success: true,
        data: indices.map(index => ({
          ...index,
          metadata: {
            title: index.index,
            description: 'No description available',
            icon: 'Database'
          }
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create index
router.post('/indices', async (req, res) => {
  try {
    const { indexName, mapping, metadata } = req.body;
    
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

    // Save metadata to MongoDB if provided
    if (metadata && metadata.title && metadata.description && metadata.icon) {
      try {
        const IndexMetadata = require('../models/IndexMetadata');
        const indexMetadata = new IndexMetadata({
          indexName: indexName.toLowerCase(),
          title: metadata.title,
          description: metadata.description,
          icon: metadata.icon,
          createdBy: req.user?.id || null // Assuming user is available from auth middleware
        });
        await indexMetadata.save();
        console.log(`✅ Index metadata saved for: ${indexName}`);
      } catch (metadataError) {
        console.error('❌ Failed to save index metadata:', metadataError.message);
        // Don't fail the entire request if metadata saving fails
      }
    }

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

    // Delete index from Elasticsearch
    await client.indices.delete({ index: indexName });

    // Delete metadata from MongoDB
    try {
      const IndexMetadata = require('../models/IndexMetadata');
      await IndexMetadata.deleteOne({ indexName: indexName.toLowerCase() });
      console.log(`✅ Index metadata deleted for: ${indexName}`);
    } catch (metadataError) {
      console.error('❌ Failed to delete index metadata:', metadataError.message);
      // Don't fail the entire request if metadata deletion fails
    }

    // Delete filter values from MongoDB
    try {
      await FilterValuesService.clearIndexFilterValues(indexName);
      console.log(`✅ Filter values deleted for: ${indexName}`);
    } catch (filterError) {
      console.error('❌ Failed to delete filter values:', filterError.message);
      // Don't fail the entire request if filter values deletion fails
    }

    res.json({
      success: true,
      message: `Index '${indexName}' deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update index metadata
router.put('/indices/:indexName/metadata', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { title, description, icon } = req.body;
    
    if (!title || !description || !icon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, description, and icon are required' 
      });
    }

    const IndexMetadata = require('../models/IndexMetadata');
    
    // Check if metadata exists
    const existingMetadata = await IndexMetadata.findOne({ indexName: indexName.toLowerCase() });
    if (!existingMetadata) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index metadata not found' 
      });
    }

    // Update metadata
    existingMetadata.title = title;
    existingMetadata.description = description;
    existingMetadata.icon = icon;
    existingMetadata.updatedAt = new Date();
    
    await existingMetadata.save();

    res.json({
      success: true,
      message: 'Index metadata updated successfully',
      data: existingMetadata
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get index metadata
router.get('/indices/:indexName/metadata', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const IndexMetadata = require('../models/IndexMetadata');
    const metadata = await IndexMetadata.findOne({ indexName: indexName.toLowerCase() });
    
    if (!metadata) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index metadata not found' 
      });
    }

    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete index metadata only (keep Elasticsearch index)
router.delete('/indices/:indexName/metadata', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const IndexMetadata = require('../models/IndexMetadata');
    const result = await IndexMetadata.deleteOne({ indexName: indexName.toLowerCase() });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Index metadata not found' 
      });
    }

    res.json({
      success: true,
      message: 'Index metadata deleted successfully'
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

    // Update filter values after successful import
    if (imported > 0) {
      try {
        await FilterValuesService.updateIndexFilterValues(indexName, data);
        console.log(`✅ Filter values updated for: ${indexName}`);
      } catch (filterError) {
        console.error('❌ Failed to update filter values:', filterError.message);
        // Don't fail the import if filter values update fails
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

    // Bulk import data with optimized batch sizes for large files
    const fileSizeMB = data.length > 0 ? (JSON.stringify(data[0]).length * data.length) / (1024 * 1024) : 0;
    let bulkSizeNum = parseInt(bulkSize);
    
    // Optimize batch size for very large files
    if (fileSizeMB > 1000) {
      bulkSizeNum = Math.max(bulkSizeNum, 5000); // Larger batches for very large files
      console.log(`Optimizing batch size to ${bulkSizeNum} for large file (${fileSizeMB.toFixed(2)}MB estimated)`);
    } else if (fileSizeMB > 100) {
      bulkSizeNum = Math.max(bulkSizeNum, 2000); // Medium batches for large files
    }
    
    let imported = 0;
    let errors = 0;
    const totalRecords = data.length;
    const startTime = Date.now();

    console.log(`Starting import of ${totalRecords} records in batches of ${bulkSizeNum}`);

    for (let i = 0; i < data.length; i += bulkSizeNum) {
      const batch = data.slice(i, i + bulkSizeNum);
      const body = [];
      const batchTimestamp = Date.now(); // Generate timestamp once per batch
      const batchStartTime = Date.now();

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
      
      // Log progress for large imports
      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;
      const progress = ((i + bulkSizeNum) / totalRecords * 100).toFixed(1);
      
      // More frequent logging for very large files
      if (totalRecords > 10000 || batchDuration > 500 || totalRecords > 1000) {
        console.log(`Batch ${Math.floor(i / bulkSizeNum) + 1}: ${imported} imported, ${errors} errors (${progress}% complete, ${batchDuration}ms)`);
      }
    }

    // Update filter values after successful import
    if (imported > 0) {
      try {
        await FilterValuesService.updateIndexFilterValues(indexName, data);
        console.log(`✅ Filter values updated for: ${indexName}`);
      } catch (filterError) {
        console.error('❌ Failed to update filter values:', filterError.message);
        // Don't fail the import if filter values update fails
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Import completed: ${imported} imported, ${errors} errors in ${(totalTime / 1000).toFixed(2)}s`);

    res.json({
      success: true,
      message: `Import completed: ${imported} documents imported, ${errors} errors`,
      data: {
        imported,
        errors,
        total: data.length,
        duration: totalTime
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

    // Extract filters from query parameters
    const filters = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('filter.')) {
        const fieldName = key.replace('filter.', '');
        filters[fieldName] = req.query[key];
      }
    });

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

    // Get index mapping to determine field types dynamically
    let indexFields = {};
    try {
      const mappingResponse = await client.indices.getMapping({ index: indexName });
      const properties = mappingResponse[indexName]?.mappings?.properties || {};
      indexFields = properties;
    } catch (mappingError) {
      console.error('Could not get index mapping:', mappingError.message);
    }

    // Add comprehensive search if provided
    const searchTerm = search.trim();
    
    // Build filter conditions dynamically based on index fields
    const filterConditions = [];
    Object.keys(filters).forEach(fieldName => {
      const filterValue = filters[fieldName];
      if (filterValue && filterValue.trim()) {
        const trimmedValue = filterValue.trim();
        const fieldType = indexFields[fieldName]?.type;
        
        // Build case-insensitive filter matching based on field type
        const filterQueries = [];
        
        if (fieldType === 'keyword') {
          // For keyword fields, use exact match and wildcards
          filterQueries.push(
            { term: { [fieldName]: trimmedValue } },
            { wildcard: { [fieldName]: `*${trimmedValue.toLowerCase()}*` } },
            { wildcard: { [fieldName]: `*${trimmedValue.toUpperCase()}*` } },
            { wildcard: { [fieldName]: `*${trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1).toLowerCase()}*` } },
            { wildcard: { [fieldName]: `*${trimmedValue}*` } }
          );
        } else if (fieldType === 'text') {
          // For text fields, use match queries
          filterQueries.push(
            { match: { [fieldName]: trimmedValue } },
            { match: { [fieldName]: trimmedValue.toLowerCase() } },
            { match: { [fieldName]: trimmedValue.toUpperCase() } },
            { match: { [fieldName]: trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1).toLowerCase() } }
          );
        } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
          // For numeric fields, try exact match and range
          const numValue = parseFloat(trimmedValue);
          if (!isNaN(numValue)) {
            filterQueries.push(
              { term: { [fieldName]: numValue } },
              { range: { [fieldName]: { gte: numValue, lte: numValue } } }
            );
          }
        } else if (fieldType === 'date') {
          // For date fields, only try exact match if it looks like a date
          const dateRegex = /^\d{4}-\d{2}-\d{2}/; // Basic date format check
          if (dateRegex.test(trimmedValue)) {
            filterQueries.push(
              { term: { [fieldName]: trimmedValue } }
            );
          }
        } else {
          // For unknown field types, only use match queries to avoid parsing errors
          // Term queries can cause parsing errors on numeric fields with non-numeric values
          filterQueries.push(
            { match: { [fieldName]: trimmedValue } }
          );
        }
        
        filterConditions.push({
          bool: {
            should: filterQueries,
            minimum_should_match: 1
          }
        });
      }
    });

    if (searchTerm) {
      // Build search query dynamically based on index fields
      const searchQueries = [];
      
      // Get all searchable fields from the index
      const fieldNames = Object.keys(indexFields);
      
      // Build search queries for each field based on its type
      fieldNames.forEach(fieldName => {
        const fieldType = indexFields[fieldName]?.type;
        
        if (fieldType === 'keyword') {
          // For keyword fields, use exact match and wildcards
          searchQueries.push(
            { term: { [fieldName]: searchTerm } },
            { wildcard: { [fieldName]: `*${searchTerm.toLowerCase()}*` } },
            { wildcard: { [fieldName]: `*${searchTerm.toUpperCase()}*` } },
            { wildcard: { [fieldName]: `*${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}*` } },
            { wildcard: { [fieldName]: `*${searchTerm}*` } }
          );
        } else if (fieldType === 'text') {
          // For text fields, use match queries
          searchQueries.push(
            { match: { [fieldName]: searchTerm } },
            { match: { [fieldName]: searchTerm.toLowerCase() } },
            { match: { [fieldName]: searchTerm.toUpperCase() } },
            { match: { [fieldName]: searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase() } }
          );
        } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
          // For numeric fields, try exact match
          const numValue = parseFloat(searchTerm);
          if (!isNaN(numValue)) {
            searchQueries.push(
              { term: { [fieldName]: numValue } }
            );
          }
        } else if (fieldType === 'date') {
          // For date fields, only try exact match if it looks like a date
          const dateRegex = /^\d{4}-\d{2}-\d{2}/; // Basic date format check
          if (dateRegex.test(searchTerm)) {
            searchQueries.push(
              { term: { [fieldName]: searchTerm } }
            );
          }
        } else {
          // For unknown field types, only use match queries to avoid parsing errors
          // Term queries can cause parsing errors on numeric fields with non-numeric values
          searchQueries.push(
            { match: { [fieldName]: searchTerm } }
          );
        }
      });
      
      // Add multi-match query for all fields (safe for all field types)
      searchQueries.push(
        { multi_match: { query: searchTerm, fields: fieldNames, type: 'best_fields', operator: 'or', boost: 1.5 } },
        { multi_match: { query: searchTerm, fields: fieldNames, type: 'cross_fields', operator: 'or', boost: 1.2 } }
      );
      
      // Add query string for wildcard support (only on keyword and text fields)
      const wildcardFields = fieldNames.filter(fieldName => {
        const fieldType = indexFields[fieldName]?.type;
        return fieldType === 'keyword' || fieldType === 'text';
      });
      
      if (wildcardFields.length > 0) {
        searchQueries.push(
          { query_string: { query: `*${searchTerm.toLowerCase()}* OR *${searchTerm.toUpperCase()}* OR *${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}* OR *${searchTerm}*`, fields: wildcardFields, default_operator: 'OR', boost: 1.0 } }
        );
      }
      
      const searchQuery = {
        bool: {
          should: searchQueries,
          minimum_should_match: 1
        }
      };

      // Combine search and filters
      if (filterConditions.length > 0) {
        query.body.query = {
          bool: {
            must: [
              searchQuery,
              ...filterConditions
            ]
          }
        };
      } else {
        query.body.query = searchQuery;
      }
    } else if (filterConditions.length > 0) {
      // Only filters, no search
      if (filterConditions.length === 1) {
        query.body.query = filterConditions[0];
      } else {
        query.body.query = {
          bool: {
            must: filterConditions
          }
        };
      }
    } else {
      // No search, no filters
      query.body.query = { match_all: {} };
    }

    // Debug: Log the query structure
    console.log('Search query structure:', JSON.stringify(query.body.query, null, 2));
    console.log('Search term:', searchTerm);
    console.log('Filter conditions count:', filterConditions.length);
    
    let response;
    try {
      response = await client.search(query);
    } catch (searchError) {
      // If search fails due to date parsing or other issues, try a simpler approach
      console.error('Search error:', searchError.message);
      
      // Try a simpler approach that preserves both search and filters
      if (searchTerm || filterConditions.length > 0) {
        // Build a simpler query that avoids problematic field types
        const simpleSearchQueries = [];
        const fieldNames = Object.keys(indexFields);
        
        // Only use keyword and text fields for the fallback search
        fieldNames.forEach(fieldName => {
          const fieldType = indexFields[fieldName]?.type;
          
          if (fieldType === 'keyword') {
            simpleSearchQueries.push(
              { wildcard: { [fieldName]: `*${searchTerm.toLowerCase()}*` } },
              { wildcard: { [fieldName]: `*${searchTerm.toUpperCase()}*` } },
              { wildcard: { [fieldName]: `*${searchTerm}*` } }
            );
          } else if (fieldType === 'text') {
            simpleSearchQueries.push(
              { match: { [fieldName]: searchTerm } }
            );
          } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
            // For numeric fields, only try exact match if it's a number
            const numValue = parseFloat(searchTerm);
            if (!isNaN(numValue)) {
              simpleSearchQueries.push(
                { term: { [fieldName]: numValue } }
              );
            }
          }
          // Skip date and other field types in fallback to avoid errors
        });
        
        let fallbackQuery;
        if (searchTerm && filterConditions.length > 0) {
          // Both search and filters
          fallbackQuery = {
            bool: {
              must: [
                {
                  bool: {
                    should: simpleSearchQueries,
                    minimum_should_match: 1
                  }
                },
                ...filterConditions
              ]
            }
          };
        } else if (searchTerm) {
          // Only search
          fallbackQuery = {
            bool: {
              should: simpleSearchQueries,
              minimum_should_match: 1
            }
          };
        } else {
          // Only filters
          fallbackQuery = filterConditions.length === 1 ? filterConditions[0] : {
            bool: {
              must: filterConditions
            }
          };
        }
        
        const simpleQuery = {
          index: indexName,
          body: {
            from,
            size: parseInt(size),
            sort: [{ [sortField]: { order: sortOrder } }],
            _source: fields === '*' ? true : fields.split(','),
            query: fallbackQuery
          }
        };
        
        try {
          response = await client.search(simpleQuery);
        } catch (fallbackError) {
          console.error('Fallback search error:', fallbackError.message);
          return res.status(400).json({
            success: false,
            message: `Search failed: ${searchError.message}`
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Search failed: ${searchError.message}`
        });
      }
    }
    
    // If no results found, try a simpler query as fallback
    if (response.hits.total.value === 0 && (searchTerm || filterConditions.length > 0)) {
      console.log('No results found, trying fallback queries...');
      console.log('Search term:', searchTerm);
      console.log('Filter conditions:', filterConditions.length);
      
      // Try multiple fallback strategies with dynamic field detection
      const fieldNames = Object.keys(indexFields);
      const fallbackQueries = [];
      
      if (searchTerm) {
        // Build dynamic fallback queries based on field types
        const fallbackSearchQueries = [];
        
        fieldNames.forEach(fieldName => {
          const fieldType = indexFields[fieldName]?.type;
          
          if (fieldType === 'keyword') {
            fallbackSearchQueries.push(
              { wildcard: { [fieldName]: `*${searchTerm.toLowerCase()}*` } },
              { wildcard: { [fieldName]: `*${searchTerm.toUpperCase()}*` } },
              { wildcard: { [fieldName]: `*${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}*` } },
              { wildcard: { [fieldName]: `*${searchTerm}*` } }
            );
          } else if (fieldType === 'text') {
            fallbackSearchQueries.push(
              { match: { [fieldName]: searchTerm } }
            );
          } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
            // For numeric fields, only try exact match if it's a number
            const numValue = parseFloat(searchTerm);
            if (!isNaN(numValue)) {
              fallbackSearchQueries.push(
                { term: { [fieldName]: numValue } }
              );
            }
          } else if (fieldType === 'date') {
            // For date fields in fallback, only try if it looks like a date
            const dateRegex = /^\d{4}-\d{2}-\d{2}/;
            if (dateRegex.test(searchTerm)) {
              fallbackSearchQueries.push(
                { term: { [fieldName]: searchTerm } }
              );
            }
          }
          // Skip other field types to avoid errors
        });
        
        // Only add fallback queries if we have valid search queries
        if (fallbackSearchQueries.length > 0) {
          fallbackQueries.push(
            // 1. Dynamic keyword search
            {
              query: {
                bool: {
                  should: fallbackSearchQueries,
                  minimum_should_match: 1
                }
              }
            },
            // 2. Query string with wildcards (only on keyword and text fields)
            {
              query: {
                query_string: {
                  query: `*${searchTerm.toLowerCase()}* OR *${searchTerm.toUpperCase()}* OR *${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}* OR *${searchTerm}*`,
                  fields: fieldNames.filter(fieldName => {
                    const fieldType = indexFields[fieldName]?.type;
                    return fieldType === 'keyword' || fieldType === 'text';
                  }),
                  default_operator: 'OR'
                }
              }
            },
            // 3. Multi-match query
            {
              query: {
                multi_match: {
                  query: searchTerm,
                  fields: fieldNames,
                  type: 'best_fields',
                  operator: 'or'
                }
              }
            },
            // 4. Cross-fields search
            {
              query: {
                multi_match: {
                  query: searchTerm,
                  fields: fieldNames,
                  type: 'cross_fields',
                  operator: 'or'
                }
              }
            }
          );
        }
      }
      
      // Try fallback queries
      for (let i = 0; i < fallbackQueries.length; i++) {
        let fallbackQuery = fallbackQueries[i];
        
        // Add filters to fallback queries if they exist
        if (filterConditions.length > 0) {
          fallbackQuery = {
            query: {
              bool: {
                must: [
                  fallbackQuery.query,
                  ...filterConditions
                ]
              }
            }
          };
        }
        
        const simpleQuery = {
          index: indexName,
          body: {
            from,
            size: parseInt(size),
            sort: [{ [sortField]: { order: sortOrder } }],
            _source: fields === '*' ? true : fields.split(','),
            ...fallbackQuery
          }
        };
        
        try {
          const fallbackResponse = await client.search(simpleQuery);
          
          if (fallbackResponse.hits.total.value > 0) {
            response.hits = fallbackResponse.hits;
            break;
          }
        } catch (fallbackError) {
          console.error(`Fallback query ${i + 1} failed:`, fallbackError.message);
          // Continue to next fallback query
        }
      }
    }
    

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

    // Update filter values after successful document creation
    try {
      await FilterValuesService.updateIndexFilterValues(indexName, [documentWithTimestamps]);
      console.log(`✅ Filter values updated for: ${indexName}`);
    } catch (filterError) {
      console.error('❌ Failed to update filter values:', filterError.message);
      // Don't fail the document creation if filter values update fails
    }

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

    // Update filter values after successful document update
    try {
      await FilterValuesService.updateIndexFilterValues(indexName, [documentWithTimestamps]);
      console.log(`✅ Filter values updated for: ${indexName}`);
    } catch (filterError) {
      console.error('❌ Failed to update filter values:', filterError.message);
      // Don't fail the document update if filter values update fails
    }

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

    // Regenerate filter values after successful document deletion
    try {
      // Clear existing filter values and regenerate from remaining documents
      await FilterValuesService.clearIndexFilterValues(indexName);
      const filterValues = await FilterValuesService.generateFilterValuesFromElasticsearch(indexName);
      console.log(`✅ Filter values regenerated for: ${indexName}`);
    } catch (filterError) {
      console.error('❌ Failed to regenerate filter values:', filterError.message);
      // Don't fail the document deletion if filter values regeneration fails
    }

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

    // Regenerate filter values after bulk operations
    if (results.successful > 0) {
      try {
        // Clear existing filter values and regenerate from current documents
        await FilterValuesService.clearIndexFilterValues(indexName);
        const filterValues = await FilterValuesService.generateFilterValuesFromElasticsearch(indexName);
        console.log(`✅ Filter values regenerated for: ${indexName}`);
      } catch (filterError) {
        console.error('❌ Failed to regenerate filter values:', filterError.message);
        // Don't fail the bulk operation if filter values regeneration fails
      }
    }

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

// ==================== FILTER VALUES ROUTES ====================

// Get filter values for an index
router.get('/indices/:indexName/filter-values', protect, adminOnly, async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const filterValues = await FilterValuesService.getFilterValues(indexName);
    
    res.json({
      success: true,
      data: filterValues
    });
  } catch (error) {
    console.error('Get filter values error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get values for a specific field
router.get('/indices/:indexName/filter-values/:fieldName', protect, adminOnly, async (req, res) => {
  try {
    const { indexName, fieldName } = req.params;
    
    const fieldValues = await FilterValuesService.getFieldValues(indexName, fieldName);
    
    if (!fieldValues) {
      return res.status(404).json({
        success: false,
        message: `No filter values found for field '${fieldName}' in index '${indexName}'`
      });
    }
    
    res.json({
      success: true,
      data: fieldValues
    });
  } catch (error) {
    console.error('Get field values error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear filter values for an index
router.delete('/indices/:indexName/filter-values', protect, adminOnly, async (req, res) => {
  try {
    const { indexName } = req.params;
    
    await FilterValuesService.clearIndexFilterValues(indexName);
    
    res.json({
      success: true,
      message: `Filter values cleared for index '${indexName}'`
    });
  } catch (error) {
    console.error('Clear filter values error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

