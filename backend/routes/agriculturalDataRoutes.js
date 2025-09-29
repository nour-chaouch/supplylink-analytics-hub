const express = require('express');
const router = express.Router();

// Get available indices with MongoDB metadata
router.get('/indices', async (req, res) => {
  try {
    // Get Elasticsearch client from any available service
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Get all indices from Elasticsearch
    const indicesResponse = await client.cat.indices({ format: 'json' });
    
    // Filter out system indices
    const elasticsearchIndices = indicesResponse
      .filter(index => !index.index.startsWith('.') && !index.index.startsWith('_'))
      .map(index => ({
        name: index.index,
        documentCount: parseInt(index['docs.count']) || 0,
        status: index.status === 'open' ? 'available' : 'not_available',
        health: index.health,
        size: index['store.size'],
        lastModified: index['creation.date.string'] || null
      }));

    // Get metadata from MongoDB
    const IndexMetadata = require('../models/IndexMetadata');
    const metadataList = await IndexMetadata.find({}).populate('createdBy', 'username email');
    
    // Create a map of metadata by index name
    const metadataMap = {};
    metadataList.forEach(metadata => {
      metadataMap[metadata.indexName] = metadata;
    });

    // Combine Elasticsearch data with MongoDB metadata
    const indices = elasticsearchIndices.map(index => {
      const metadata = metadataMap[index.name];
      
      return {
        name: index.name,
        displayName: metadata?.title || index.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: metadata?.description || `Data from ${index.name} index`,
        icon: metadata?.icon || 'Database',
        documentCount: index.documentCount,
        status: index.status,
        health: index.health,
        size: index.size,
        lastModified: index.lastModified,
        createdAt: metadata?.createdAt,
        updatedAt: metadata?.updatedAt,
        createdBy: metadata?.createdBy,
        hasMetadata: !!metadata
      };
    }).sort((a, b) => {
      // Sort by metadata first, then by name
      if (a.hasMetadata && !b.hasMetadata) return -1;
      if (!a.hasMetadata && b.hasMetadata) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    res.json({
      success: true,
      data: indices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get index fields/schema
router.get('/indices/:indexName/fields', async (req, res) => {
  try {
    const { indexName } = req.params;
    
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get mapping to determine available fields
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    // Extract filterable fields (keyword, text, date, numeric fields)
    const filterableFields = [];
    const searchableFields = [];
    
    Object.keys(properties).forEach(fieldName => {
      const field = properties[fieldName];
      const fieldType = field.type;
      
      if (fieldType === 'keyword' || fieldType === 'text' || fieldType === 'date' || 
          fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
        filterableFields.push({
          name: fieldName,
          type: fieldType,
          displayName: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          searchable: fieldType === 'text' || fieldType === 'keyword'
        });
      }
      
      if (fieldType === 'text' || fieldType === 'keyword') {
        searchableFields.push(fieldName);
      }
    });
    
    res.json({
      success: true,
      data: {
        indexName,
        filterableFields,
        searchableFields,
        totalFields: Object.keys(properties).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all filter values for an index from MongoDB with Elasticsearch fallback
router.get('/indices/:indexName/filter-values', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { size = 1000 } = req.query;
    
    // Try to get filter values from MongoDB first
    const FilterValues = require('../models/FilterValues');
    const filterDocs = await FilterValues.getFilterValues(indexName);
    
    if (filterDocs && filterDocs.length > 0) {
      // Format the response from MongoDB
      const filterValues = {};
      filterDocs.forEach(doc => {
        filterValues[doc.fieldName] = {
          fieldType: doc.fieldType,
          values: doc.values.slice(0, parseInt(size)),
          totalValues: doc.values.length,
          totalDocuments: doc.totalDocuments,
          lastUpdated: doc.lastUpdated
        };
      });
      
      return res.json({
        success: true,
        data: {
          indexName,
          filterValues,
          totalFields: filterDocs.length,
          source: 'mongodb'
        }
      });
    }
    
    // Fallback to Elasticsearch if MongoDB doesn't have data
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get mapping to determine available fields
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    // Get filter values for each field from Elasticsearch
    const filterValues = {};
    const fieldNames = Object.keys(properties).filter(fieldName => {
      const field = properties[fieldName];
      const fieldType = field.type;
      return fieldType === 'keyword' || fieldType === 'text' || fieldType === 'date' || 
             fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double';
    });
    
    // Get values for each field
    for (const fieldName of fieldNames.slice(0, 10)) { // Limit to first 10 fields for performance
      try {
        const response = await client.search({
          index: indexName,
          body: {
            size: 0,
            aggs: {
              unique_values: {
                terms: {
                  field: fieldName,
                  size: parseInt(size)
                }
              }
            }
          }
        });
        
        const values = response.aggregations.unique_values.buckets.map(bucket => ({
          value: bucket.key,
          count: bucket.doc_count
        }));
        
        filterValues[fieldName] = {
          fieldType: properties[fieldName].type,
          values: values,
          totalValues: values.length,
          totalDocuments: response.hits.total.value,
          lastUpdated: new Date()
        };
      } catch (fieldError) {
        console.error(`Error getting values for field ${fieldName}:`, fieldError.message);
        // Skip this field if there's an error
      }
    }
    
    res.json({
      success: true,
      data: {
        indexName,
        filterValues,
        totalFields: Object.keys(filterValues).length,
        source: 'elasticsearch'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get filter values for a specific index and field from MongoDB with Elasticsearch fallback
router.get('/indices/:indexName/filter-values/:fieldName', async (req, res) => {
  try {
    const { indexName, fieldName } = req.params;
    const { size = 1000 } = req.query;
    
    // Try to get filter values from MongoDB first
    const FilterValues = require('../models/FilterValues');
    const filterDoc = await FilterValues.getFieldValues(indexName, fieldName);
    
    if (filterDoc) {
      // Return MongoDB data
      const limitedValues = filterDoc.values.slice(0, parseInt(size));
      
      return res.json({
        success: true,
        data: {
          indexName,
          fieldName,
          fieldType: filterDoc.fieldType,
          values: limitedValues,
          totalValues: filterDoc.values.length,
          totalDocuments: filterDoc.totalDocuments,
          lastUpdated: filterDoc.lastUpdated,
          source: 'mongodb'
        }
      });
    }
    
    // Fallback to Elasticsearch if MongoDB doesn't have data
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get unique values for the field from Elasticsearch
    const response = await client.search({
      index: indexName,
      body: {
        size: 0,
        aggs: {
          unique_values: {
            terms: {
              field: fieldName,
              size: parseInt(size)
            }
          }
        }
      }
    });
    
    const values = response.aggregations.unique_values.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
    
    res.json({
      success: true,
      data: {
        indexName,
        fieldName,
        fieldType: 'unknown', // We don't know the type from Elasticsearch aggregation
        values: values,
        totalValues: values.length,
        totalDocuments: response.hits.total.value,
        lastUpdated: new Date(),
        source: 'elasticsearch'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search in specific index
router.get('/indices/:indexName/search', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { q: query, page = 1, limit = 50, ...filters } = req.query;
    
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get index mapping to determine searchable fields
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    // Extract searchable fields (text and keyword fields)
    const searchableFields = Object.keys(properties).filter(fieldName => {
      const field = properties[fieldName];
      const fieldType = field.type;
      return fieldType === 'text' || fieldType === 'keyword';
    });
    
    // Build search query dynamically
    const mustQueries = [];
    const shouldQueries = [];
    
    // Add intelligent text search if query provided
    if (query && query.trim()) {
      const searchTerm = query.trim();
      
      // Multiple search strategies - all in shouldQueries for maximum flexibility
      
      // 1. Primary wildcard search strategy - most flexible
      if (searchableFields.length > 0) {
        shouldQueries.push({
          query_string: {
            query: `*${searchTerm}*`,
            fields: searchableFields,
            default_operator: 'OR',
            analyze_wildcard: true,
            boost: 5.0,
            lenient: true,
            minimum_should_match: 1
          }
        });
      }
      
      // 2. Exact match in keyword fields (highest priority)
      searchableFields.forEach(fieldName => {
        const field = properties[fieldName];
        if (field.type === 'keyword') {
          shouldQueries.push({
            term: {
              [fieldName]: {
                value: searchTerm,
                case_insensitive: true,
                boost: 10.0
              }
            }
          });
        }
      });
      
      // 3. Wildcard search for partial matches in keyword fields
      searchableFields.forEach(fieldName => {
        const field = properties[fieldName];
        if (field.type === 'keyword') {
          shouldQueries.push({
            wildcard: {
              [fieldName]: {
                value: `*${searchTerm.toLowerCase()}*`,
                case_insensitive: true,
                boost: 8.0
              }
            }
          });
        }
      });
      
      // 4. Regexp search for even more flexible matching
      searchableFields.forEach(fieldName => {
        const field = properties[fieldName];
        if (field.type === 'keyword') {
          shouldQueries.push({
            regexp: {
              [fieldName]: {
                value: `.*${searchTerm.toLowerCase()}.*`,
                case_insensitive: true,
                boost: 6.0
              }
            }
          });
        }
      });
      
      // 5. Multi-match for text fields with fuzziness
      if (searchableFields.length > 0) {
        shouldQueries.push({
          multi_match: {
            query: searchTerm,
            fields: searchableFields.map(field => `${field}^2`),
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or',
            boost: 4.0
          }
        });
      }
      
      // 6. Prefix match for better autocomplete-like behavior
      searchableFields.forEach(fieldName => {
        const field = properties[fieldName];
        if (field.type === 'keyword') {
          shouldQueries.push({
            prefix: {
              [fieldName]: {
                value: searchTerm.toLowerCase(),
                case_insensitive: true,
                boost: 3.0
              }
            }
          });
        }
      });
      
      // 7. Fuzzy search for typos and variations
      searchableFields.forEach(fieldName => {
        const field = properties[fieldName];
        if (field.type === 'keyword') {
          shouldQueries.push({
            fuzzy: {
              [fieldName]: {
                value: searchTerm.toLowerCase(),
                fuzziness: 'AUTO',
                boost: 2.0
              }
            }
          });
        }
      });
    }
    
    // Add filters with proper field type handling
    Object.keys(filters).forEach(filterKey => {
      if (filters[filterKey] && filters[filterKey].trim()) {
        const field = properties[filterKey];
        const filterValue = filters[filterKey].trim();
        
        if (field) {
          if (field.type === 'keyword' || field.type === 'text') {
            mustQueries.push({
              term: {
                [filterKey]: {
                  value: filterValue,
                  case_insensitive: true
                }
              }
            });
          } else if (field.type === 'integer' || field.type === 'long') {
            const numericValue = parseInt(filterValue);
            if (!isNaN(numericValue)) {
              mustQueries.push({
                term: {
                  [filterKey]: numericValue
                }
              });
            }
          } else if (field.type === 'float' || field.type === 'double') {
            const numericValue = parseFloat(filterValue);
            if (!isNaN(numericValue)) {
              mustQueries.push({
                term: {
                  [filterKey]: numericValue
                }
              });
            }
          } else if (field.type === 'date') {
            mustQueries.push({
              term: {
                [filterKey]: filterValue
              }
            });
          }
        }
      }
    });
    
    // Combine queries with ultra-flexible scoring for maximum search coverage
    let searchQuery;
    if (mustQueries.length > 0 || shouldQueries.length > 0) {
      if (shouldQueries.length > 0 && mustQueries.length === 0) {
        // If only should queries, use them directly with minimum_should_match
        searchQuery = {
          bool: {
            should: shouldQueries,
            minimum_should_match: 1 // At least one should query must match
          }
        };
      } else {
        // If we have must queries, combine them
        searchQuery = {
          bool: {
            must: mustQueries,
            should: shouldQueries,
            minimum_should_match: 0 // Allow any should query to match for maximum flexibility
          }
        };
      }
    } else {
      searchQuery = { match_all: {} };
    }
    
    // Perform search with intelligent sorting
    const response = await client.search({
      index: indexName,
      body: {
        query: searchQuery,
        sort: query && query.trim() ? 
          [{ _score: { order: 'desc' } }] : // Sort by relevance when searching
          [{ createdAt: { order: 'desc' } }], // Sort by date when browsing
        from: (page - 1) * limit,
        size: parseInt(limit),
        highlight: query && query.trim() ? {
          fields: searchableFields.reduce((acc, field) => {
            acc[field] = {
              fragment_size: 150,
              number_of_fragments: 3
            };
            return acc;
          }, {})
        } : undefined
      }
    });
    
    const results = response.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source,
      _score: hit._score,
      _highlights: hit.highlight || {}
    }));
    
    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.hits.total.value,
        pages: Math.ceil(response.hits.total.value / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get search suggestions for autocomplete
router.get('/indices/:indexName/suggestions', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          total: 0
        }
      });
    }
    
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get mapping to determine searchable fields
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    // Extract searchable fields (text and keyword fields)
    const searchableFields = Object.keys(properties).filter(fieldName => {
      const field = properties[fieldName];
      const fieldType = field.type;
      return fieldType === 'text' || fieldType === 'keyword';
    });
    
    if (searchableFields.length === 0) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          total: 0
        }
      });
    }
    
    // Get suggestions from Elasticsearch
    const response = await client.search({
      index: indexName,
      body: {
        size: 0,
        aggs: {
          suggestions: {
            terms: {
              field: searchableFields[0], // Use first searchable field
              size: parseInt(limit)
            }
          }
        }
      }
    });
    
    const suggestions = response.aggregations.suggestions.buckets.map(bucket => ({
      text: bucket.key,
      count: bucket.doc_count,
      field: searchableFields[0]
    }));
    
    res.json({
      success: true,
      data: {
        suggestions,
        total: suggestions.length,
        query: query.trim()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic analytics endpoint for any index
router.get('/indices/:indexName/analytics', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { field, groupBy, timeField, timeRange, limit = 10 } = req.query;
    
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService();
    const client = esService.client;
    
    if (!client) {
      return res.status(500).json({ success: false, message: 'Elasticsearch client not initialized' });
    }
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      return res.status(404).json({ success: false, message: 'Index not found' });
    }
    
    // Get mapping to determine available fields
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    // Build analytics aggregations - only add aggregations that are needed
    const aggregations = {};
    
    // Get total document count using a different approach
    const totalCountResponse = await client.count({
      index: indexName
    });
    const totalDocuments = totalCountResponse.count;
    
    // Add field-specific analytics if field is specified
    if (field && properties[field]) {
      const fieldType = properties[field].type;
      
      if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double') {
        // Numeric field analytics
        aggregations.field_stats = {
          stats: {
            field: field
          }
        };
        
        // Top values for numeric fields
        aggregations.top_values = {
          terms: {
            field: field,
            size: parseInt(limit),
            order: { _count: 'desc' }
          }
        };
      } else if (fieldType === 'keyword' || fieldType === 'text') {
        // Text/keyword field analytics
        aggregations.top_values = {
          terms: {
            field: field,
            size: parseInt(limit),
            order: { _count: 'desc' }
          }
        };
      }
    }
    
    // Add group by aggregation if specified
    if (groupBy && properties[groupBy]) {
      aggregations.group_by = {
        terms: {
          field: groupBy,
          size: parseInt(limit),
          order: { _count: 'desc' }
        }
      };
    }
    
    // Add time series if time field is specified and is actually a date field
    if (timeField && properties[timeField] && properties[timeField].type === 'date') {
      const timeRangeValue = timeRange || '1y';
      aggregations.time_series = {
        date_histogram: {
          field: timeField,
          calendar_interval: timeRangeValue === '1y' ? 'month' : timeRangeValue === '1M' ? 'day' : 'year',
          min_doc_count: 0
        }
      };
    }
    
    // Get all available fields for reference
    const availableFields = Object.keys(properties).map(fieldName => ({
      name: fieldName,
      type: properties[fieldName].type,
      searchable: properties[fieldName].type === 'text' || properties[fieldName].type === 'keyword'
    }));
    
    // Perform analytics query
    const response = await client.search({
      index: indexName,
      body: {
        query: { match_all: {} },
        aggs: aggregations,
        size: 0
      }
    });
    
    const aggs = response.aggregations;
    
    // Format the response
    const analyticsData = {
      indexName,
      totalDocuments: totalDocuments,
      fieldStats: aggs.field_stats || null,
      topValues: aggs.top_values ? aggs.top_values.buckets.map(bucket => ({
        value: bucket.key,
        count: bucket.doc_count
      })) : [],
      groupBy: aggs.group_by ? aggs.group_by.buckets.map(bucket => ({
        value: bucket.key,
        count: bucket.doc_count
      })) : [],
      timeSeries: aggs.time_series ? aggs.time_series.buckets.map(bucket => ({
        date: bucket.key_as_string || bucket.key,
        count: bucket.doc_count
      })) : [],
      availableFields
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Legacy analytics endpoint - redirects to dynamic index analytics
router.get('/analytics', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Analytics endpoint is now dynamic. Use /indices/{indexName}/analytics for specific index analytics.',
        availableIndices: 'Use /indices endpoint to get available indices for analytics.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
