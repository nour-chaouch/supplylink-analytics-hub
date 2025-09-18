const FilterValues = require('../models/FilterValues');

class FilterValuesService {
  /**
   * Extract filterable values from documents
   * Only includes string values that are likely to be used for filtering
   */
  static extractFilterableValues(documents) {
    const fieldValues = {};
    
    documents.forEach(doc => {
      Object.entries(doc).forEach(([fieldName, value]) => {
        // Skip system fields and non-string values
        if (this.shouldSkipField(fieldName, value)) {
          return;
        }
        
        // Convert value to string and check if it's filterable
        const stringValue = String(value).trim();
        if (this.isFilterableValue(stringValue)) {
          if (!fieldValues[fieldName]) {
            fieldValues[fieldName] = [];
          }
          fieldValues[fieldName].push(stringValue);
        }
      });
    });
    
    return fieldValues;
  }
  
  /**
   * Determine if a field should be skipped
   */
  static shouldSkipField(fieldName, value) {
    // Skip system fields
    const systemFields = ['_id', '__v', 'createdAt', 'updatedAt', 'scrapedAt'];
    if (systemFields.includes(fieldName)) {
      return true;
    }
    
    // Skip if value is null, undefined, or empty
    if (value === null || value === undefined || value === '') {
      return true;
    }
    
    // Skip numeric fields (they should use range filters, not select lists)
    if (typeof value === 'number') {
      return true;
    }
    
    // Skip date fields (they should use date pickers, not select lists)
    if (value instanceof Date) {
      return true;
    }
    
    // Skip very long strings (likely not filterable)
    if (typeof value === 'string' && value.length > 100) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine if a string value is suitable for filtering
   */
  static isFilterableValue(value) {
    // Must be non-empty string
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    // Skip very short values (likely IDs or codes)
    if (value.length < 2) {
      return false;
    }
    
    // Skip values that look like IDs or timestamps
    if (this.looksLikeId(value) || this.looksLikeTimestamp(value)) {
      return false;
    }
    
    // Skip values that are too long for select lists
    if (value.length > 50) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if value looks like an ID
   */
  static looksLikeId(value) {
    // MongoDB ObjectId pattern
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return true;
    }
    
    // UUID pattern
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) {
      return true;
    }
    
    // Numeric ID pattern
    if (/^\d+$/.test(value) && value.length > 3) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if value looks like a timestamp
   */
  static looksLikeTimestamp(value) {
    // ISO date pattern
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return true;
    }
    
    // Unix timestamp pattern
    if (/^\d{10,13}$/.test(value)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Update filter values for an index
   */
  static async updateIndexFilterValues(indexName, documents) {
    try {
      const fieldValues = this.extractFilterableValues(documents);
      
      const updatePromises = Object.entries(fieldValues).map(async ([fieldName, values]) => {
        // Determine field type based on values
        const fieldType = this.determineFieldType(values);
        
        // Only update if field type is suitable for filtering
        if (fieldType && ['keyword', 'text', 'boolean'].includes(fieldType)) {
          return await FilterValues.updateFieldValues(indexName, fieldName, fieldType, values);
        }
      });
      
      await Promise.all(updatePromises);
      
      console.log(`Updated filter values for index: ${indexName}`);
    } catch (error) {
      console.error('Error updating filter values:', error);
    }
  }
  
  /**
   * Determine field type based on values
   */
  static determineFieldType(values) {
    if (values.length === 0) {
      return null;
    }
    
    // Check if all values are boolean-like
    const booleanValues = values.filter(v => 
      ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
    );
    
    if (booleanValues.length === values.length) {
      return 'boolean';
    }
    
    // Check if values look like keywords (short, distinct values)
    const uniqueValues = new Set(values);
    const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;
    
    if (avgLength < 20 && uniqueValues.size < values.length * 0.8) {
      return 'keyword';
    }
    
    // Default to text
    return 'text';
  }
  
  /**
   * Get filter values for an index (fallback to Elasticsearch if MongoDB not available)
   */
  static async getFilterValues(indexName) {
    try {
      // Try to get from MongoDB first
      const filterValues = await FilterValues.getFilterValues(indexName);
      
      if (filterValues.length > 0) {
        return filterValues;
      }
      
      // If no MongoDB data, generate from Elasticsearch
      console.log('No MongoDB filter values found, generating from Elasticsearch...');
      return await this.generateFilterValuesFromElasticsearch(indexName);
      
    } catch (error) {
      console.error('Error getting filter values from MongoDB:', error.message);
      
      // Fallback to Elasticsearch generation
      console.log('MongoDB error, generating from Elasticsearch...');
      return await this.generateFilterValuesFromElasticsearch(indexName);
    }
  }
  
  /**
   * Generate filter values directly from Elasticsearch data
   */
  static async generateFilterValuesFromElasticsearch(indexName) {
    try {
      const { getElasticsearchClient } = require('../config/elasticsearch');
      const client = getElasticsearchClient();
      
      // Get index mapping to determine field types
      const mappingResponse = await client.indices.getMapping({ index: indexName });
      const properties = mappingResponse[indexName]?.mappings?.properties || {};
      
      // Get a sample of documents to extract values
      const sampleResponse = await client.search({
        index: indexName,
        body: {
          size: 1000, // Get sample of documents
          _source: true
        }
      });
      
      const documents = sampleResponse.hits.hits.map(hit => hit._source);
      const fieldValues = this.extractFilterableValues(documents);
      
      // Convert to FilterValues format
      const filterValues = Object.entries(fieldValues).map(([fieldName, values]) => {
        const fieldType = this.determineFieldType(values);
        
        if (['keyword', 'text', 'boolean'].includes(fieldType)) {
          // Count unique values
          const valueCounts = {};
          values.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
          });
          
          const sortedValues = Object.entries(valueCounts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
          
          return {
            fieldName,
            fieldType,
            values: sortedValues,
            totalDocuments: documents.length
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log(`Generated ${filterValues.length} filter values from Elasticsearch`);
      return filterValues;
      
    } catch (error) {
      console.error('Error generating filter values from Elasticsearch:', error);
      return [];
    }
  }
  
  /**
   * Get values for a specific field
   */
  static async getFieldValues(indexName, fieldName) {
    try {
      return await FilterValues.getFieldValues(indexName, fieldName);
    } catch (error) {
      console.error('Error getting field values:', error);
      return null;
    }
  }
  
  /**
   * Clear filter values for an index (useful when index is deleted)
   */
  static async clearIndexFilterValues(indexName) {
    try {
      await FilterValues.deleteMany({ indexName });
      console.log(`Cleared filter values for index: ${indexName}`);
    } catch (error) {
      console.error('Error clearing filter values:', error);
    }
  }
}

module.exports = FilterValuesService;

