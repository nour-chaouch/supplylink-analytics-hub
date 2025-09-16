const { getElasticsearchClient } = require('../config/elasticsearch');

class ElasticsearchService {
  constructor(indexName) {
    this.indexName = indexName;
    this.client = getElasticsearchClient();
  }

  // Create a new document
  async create(document) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.index({
        index: this.indexName,
        body: {
          ...document,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        _id: response._id,
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error creating document in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Find documents with query
  async find(query = {}) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: query.query || { match_all: {} },
          sort: query.sort || [{ createdAt: { order: 'desc' } }],
          from: query.from || 0,
          size: query.size || 50
        }
      });

      return response.hits.hits.map(hit => ({
        _id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error(`Error finding documents in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Find document by ID
  async findById(id) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.get({
        index: this.indexName,
        id: id
      });

      return {
        _id: response._id,
        ...response._source
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`Error finding document by ID in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Update document
  async update(id, updateData) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.update({
        index: this.indexName,
        id: id,
        body: {
          doc: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      });

      return {
        _id: response._id,
        ...updateData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error updating document in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Delete document
  async delete(id) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      await this.client.delete({
        index: this.indexName,
        id: id
      });

      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      console.error(`Error deleting document in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Count documents
  async count(query = {}) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.count({
        index: this.indexName,
        body: {
          query: query.query || { match_all: {} }
        }
      });

      return response.count;
    } catch (error) {
      console.error(`Error counting documents in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Search with text search
  async search(searchTerm, fields = [], filters = {}) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const mustQueries = [];

      // Add text search if searchTerm provided
      if (searchTerm && fields.length > 0) {
        mustQueries.push({
          multi_match: {
            query: searchTerm,
            fields: fields,
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('*')) {
            // Wildcard search
            mustQueries.push({
              wildcard: {
                [field]: value.toLowerCase()
              }
            });
          } else if (typeof value === 'string') {
            // Exact match for strings
            mustQueries.push({
              term: {
                [field]: value
              }
            });
          } else if (typeof value === 'number') {
            // Exact match for numbers
            mustQueries.push({
              term: {
                [field]: value
              }
            });
          }
        }
      });

      const query = mustQueries.length > 0 ? { bool: { must: mustQueries } } : { match_all: {} };

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: query,
          sort: [{ createdAt: { order: 'desc' } }]
        }
      });

      return response.hits.hits.map(hit => ({
        _id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error(`Error searching documents in ${this.indexName}:`, error.message);
      throw error;
    }
  }

  // Aggregate data
  async aggregate(aggregations) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: { match_all: {} },
          aggs: aggregations,
          size: 0
        }
      });

      return response.aggregations;
    } catch (error) {
      console.error(`Error aggregating data in ${this.indexName}:`, error.message);
      throw error;
    }
  }
}

module.exports = ElasticsearchService;
