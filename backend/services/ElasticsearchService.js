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

      // Nettoyer le document pour éviter les champs en double
      const cleanDocument = { ...document };
      // Retirer les champs qui pourraient être dupliqués
      delete cleanDocument.createdAt;
      delete cleanDocument.updatedAt;
      delete cleanDocument.id;
      delete cleanDocument._id;

      console.log(`[ElasticsearchService.create] Index: ${this.indexName}, Document keys:`, Object.keys(cleanDocument));

      const response = await this.client.index({
        index: this.indexName,
        body: cleanDocument
      });

      console.log(`[ElasticsearchService.create] Document indexed with ID: ${response._id}, result: ${response.result}`);

      // Attendre un peu pour que l'indexation soit terminée (refresh)
      await this.client.indices.refresh({ index: this.indexName });

      return {
        _id: response._id,
        ...cleanDocument
      };
    } catch (error) {
      console.error(`[ElasticsearchService.create] Error creating document in ${this.indexName}:`, error.message);
      if (error.meta && error.meta.body) {
        console.error(`[ElasticsearchService.create] Error details:`, JSON.stringify(error.meta.body, null, 2));
      }
      console.error(`[ElasticsearchService.create] Error stack:`, error.stack);
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

      console.log(`[ElasticsearchService.delete] Deleting document ID: ${id} from index: ${this.indexName}`);

      const response = await this.client.delete({
        index: this.indexName,
        id: id
      });

      console.log(`[ElasticsearchService.delete] Deletion successful. Result: ${response.result}`);

      // Refresh l'index pour que la suppression soit immédiatement visible
      await this.client.indices.refresh({ index: this.indexName });

      return true;
    } catch (error) {
      console.error(`[ElasticsearchService.delete] Error deleting document in ${this.indexName}:`, error.message);
      if (error.meta && error.meta.body) {
        console.error(`[ElasticsearchService.delete] Error details:`, JSON.stringify(error.meta.body, null, 2));
      }
      // Si le document n'existe pas (404), on peut considérer que c'est déjà supprimé
      if (error.statusCode === 404 || (error.meta && error.meta.statusCode === 404)) {
        console.log(`[ElasticsearchService.delete] Document ${id} not found (404), considering as already deleted`);
        return true; // Considérer comme succès si déjà supprimé
      }
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

      // Check if index exists first
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      if (!indexExists) {
        console.log(`Index ${this.indexName} does not exist, returning empty search results`);
        return [];
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
  async aggregate(aggregations, query = null) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      // Utiliser la query fournie ou match_all par défaut
      const searchQuery = query || { match_all: {} };

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: searchQuery,
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
