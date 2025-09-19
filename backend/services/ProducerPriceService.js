const ElasticsearchService = require('./ElasticsearchService');

class ProducerPriceService extends ElasticsearchService {
  constructor() {
    super('producer_prices');
  }

  // Get producer prices with filters and pagination
  async getProducerPrices(filters = {}, page = 1, limit = 50) {
    try {
      const from = (page - 1) * limit;
      
      // Build query filters
      const mustQueries = [];
      
      if (filters.area) {
        mustQueries.push({
          wildcard: {
            'area.keyword': `*${filters.area.toLowerCase()}*`
          }
        });
      }
      
      if (filters.item) {
        mustQueries.push({
          wildcard: {
            'item.keyword': `*${filters.item.toLowerCase()}*`
          }
        });
      }
      
      if (filters.year) {
        mustQueries.push({
          term: {
            year: parseInt(filters.year)
          }
        });
      }
      
      if (filters.domainCode) {
        mustQueries.push({
          term: {
            domainCode: filters.domainCode
          }
        });
      }

      const query = mustQueries.length > 0 ? { bool: { must: mustQueries } } : { match_all: {} };

      const data = await this.find({
        query: query,
        from: from,
        size: limit,
        sort: [{ year: { order: 'desc' } }, { scrapedAt: { order: 'desc' } }]
      });

      const total = await this.count({ query });

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting producer prices:', error.message);
      throw error;
    }
  }

  // Search producer prices
  async searchProducerPrices(searchTerm, filters = {}) {
    try {
      const searchFields = ['item', 'area', 'element', 'domain'];
      return await this.search(searchTerm, searchFields, filters);
    } catch (error) {
      console.error('Error searching producer prices:', error.message);
      throw error;
    }
  }

  // Get analytics data
  async getAnalytics(filters = {}) {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      const mustQueries = [];
      
      if (filters.domainCode) {
        mustQueries.push({
          term: {
            domainCode: filters.domainCode
          }
        });
      }
      
      if (filters.area) {
        mustQueries.push({
          wildcard: {
            'area.keyword': `*${filters.area.toLowerCase()}*`
          }
        });
      }
      
      if (filters.year) {
        mustQueries.push({
          term: {
            year: parseInt(filters.year)
          }
        });
      }

      const query = mustQueries.length > 0 ? { bool: { must: mustQueries } } : { match_all: {} };

      const aggregations = {
        total_records: {
          value_count: {
            field: '_id'
          }
        },
        avg_value: {
          avg: {
            field: 'value'
          }
        },
        min_value: {
          min: {
            field: 'value'
          }
        },
        max_value: {
          max: {
            field: 'value'
          }
        },
        unique_areas: {
          terms: {
            field: 'area.keyword',
            size: 1000
          }
        },
        unique_items: {
          terms: {
            field: 'item.keyword',
            size: 1000
          }
        },
        year_range: {
          terms: {
            field: 'year',
            size: 1000
          }
        }
      };

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: query,
          aggs: aggregations,
          size: 0
        }
      });

      const aggs = response.aggregations;
      
      return {
        totalRecords: aggs.total_records.value,
        avgValue: aggs.avg_value.value || 0,
        minValue: aggs.min_value.value || 0,
        maxValue: aggs.max_value.value || 0,
        uniqueAreas: aggs.unique_areas.buckets.map(bucket => bucket.key),
        uniqueItems: aggs.unique_items.buckets.map(bucket => bucket.key),
        yearRange: aggs.year_range.buckets.map(bucket => bucket.key).sort((a, b) => b - a)
      };
    } catch (error) {
      console.error('Error getting producer price analytics:', error.message);
      throw error;
    }
  }

  // Get filter options
  async getFilterOptions() {
    try {
      if (!this.client) {
        throw new Error('Elasticsearch client not initialized');
      }

      // Check if index exists first
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      if (!indexExists) {
        console.log(`Index ${this.indexName} does not exist, returning empty filter options`);
        return {
          areas: [],
          items: [],
          years: [],
          domainCodes: []
        };
      }

      const aggregations = {
        areas: {
          terms: {
            field: 'area',
            size: 1000
          }
        },
        items: {
          terms: {
            field: 'item',
            size: 1000
          }
        },
        years: {
          terms: {
            field: 'year',
            size: 1000
          }
        },
        domainCodes: {
          terms: {
            field: 'domainCode',
            size: 1000
          }
        }
      };

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: { match_all: {} },
          aggs: aggregations,
          size: 0
        }
      });

      const aggs = response.aggregations;
      
      return {
        areas: aggs.areas.buckets.map(bucket => bucket.key).sort(),
        items: aggs.items.buckets.map(bucket => bucket.key).sort(),
        years: aggs.years.buckets.map(bucket => bucket.key).sort((a, b) => b - a),
        domainCodes: aggs.domainCodes.buckets.map(bucket => bucket.key).sort()
      };
    } catch (error) {
      console.error('Error getting filter options:', error.message);
      throw error;
    }
  }
}

module.exports = ProducerPriceService;
