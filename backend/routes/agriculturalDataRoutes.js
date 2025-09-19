const express = require('express');
const router = express.Router();
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

// Lazy initialization of services
let producerPriceService = null;
let cropsLivestockService = null;

const getServices = () => {
  if (!producerPriceService) {
    producerPriceService = new ProducerPriceService();
  }
  if (!cropsLivestockService) {
    cropsLivestockService = new CropsLivestockService();
  }
  return { producerPriceService, cropsLivestockService };
};

// Get all producer prices with optional filters
router.get('/producer-prices', async (req, res) => {
  try {
    const { producerPriceService } = getServices();
    const { area, item, year, domainCode, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (area) filters.area = area;
    if (item) filters.item = item;
    if (year) filters.year = year;
    if (domainCode) filters.domainCode = domainCode;

    const result = await producerPriceService.getProducerPrices(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all crops and livestock data with optional filters
router.get('/crops-livestock', async (req, res) => {
  try {
    const { cropsLivestockService } = getServices();
    const { area, item, year, domainCode, element, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (area) filters.area = area;
    if (item) filters.item = item;
    if (year) filters.year = year;
    if (domainCode) filters.domainCode = domainCode;
    if (element) filters.element = element;

    const result = await cropsLivestockService.getCropsLivestock(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search across both datasets
router.get('/search', async (req, res) => {
  try {
    const { producerPriceService, cropsLivestockService } = getServices();
    const { query, domainCode, area, year, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (domainCode) filters.domainCode = domainCode;
    if (area) filters.area = area;
    if (year) filters.year = year;

    // Search in both collections
    const [producerPrices, cropsLivestock] = await Promise.all([
      producerPriceService.searchProducerPrices(query, filters),
      cropsLivestockService.searchCropsLivestock(query, filters)
    ]);

    // Combine and sort results
    const combinedData = [...producerPrices, ...cropsLivestock]
      .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: combinedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: combinedData.length,
        pages: Math.ceil(combinedData.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { producerPriceService, cropsLivestockService } = getServices();
    const { domainCode, area, year } = req.query;
    
    const filters = {};
    if (domainCode) filters.domainCode = domainCode;
    if (area) filters.area = area;
    if (year) filters.year = year;

    // Get aggregated data from both services
    const [producerPricesStats, cropsLivestockStats] = await Promise.all([
      producerPriceService.getAnalytics(filters),
      cropsLivestockService.getAnalytics(filters)
    ]);

    res.json({
      success: true,
      data: {
        producerPrices: producerPricesStats,
        cropsLivestock: cropsLivestockStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get filter options
router.get('/filters', async (req, res) => {
  try {
    const { producerPriceService, cropsLivestockService } = getServices();
    const [producerFilters, cropsFilters] = await Promise.all([
      producerPriceService.getFilterOptions(),
      cropsLivestockService.getFilterOptions()
    ]);

    // Combine and deduplicate filter options
    const allAreas = [...new Set([...producerFilters.areas, ...cropsFilters.areas])].sort();
    const allItems = [...new Set([...producerFilters.items, ...cropsFilters.items])].sort();
    const allYears = [...new Set([...producerFilters.years, ...cropsFilters.years])].sort((a, b) => b - a);
    const allDomainCodes = [...new Set([...producerFilters.domainCodes, ...cropsFilters.domainCodes])].sort();
    const allElements = [...new Set([...cropsFilters.elements])].sort();

    res.json({
      success: true,
      data: {
        areas: allAreas,
        items: allItems,
        years: allYears,
        domainCodes: allDomainCodes,
        elements: allElements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available indices with MongoDB metadata
router.get('/indices', async (req, res) => {
  try {
    const { producerPriceService, cropsLivestockService } = getServices();
    
    // Use any available service to get Elasticsearch client
    const client = producerPriceService.client || cropsLivestockService.client;
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
    const { producerPriceService, cropsLivestockService } = getServices();
    const { indexName } = req.params;
    
    // Use any available service to get Elasticsearch client
    const client = producerPriceService.client || cropsLivestockService.client;
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
    const { producerPriceService, cropsLivestockService } = getServices();
    const client = producerPriceService.client || cropsLivestockService.client;
    
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
    const { producerPriceService, cropsLivestockService } = getServices();
    const client = producerPriceService.client || cropsLivestockService.client;
    
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
    const { producerPriceService, cropsLivestockService } = getServices();
    const { indexName } = req.params;
    const { q: query, page = 1, limit = 50, ...filters } = req.query;
    
    // Use any available service to get Elasticsearch client
    const client = producerPriceService.client || cropsLivestockService.client;
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
    
    const { producerPriceService, cropsLivestockService } = getServices();
    const client = producerPriceService.client || cropsLivestockService.client;
    
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

module.exports = router;









