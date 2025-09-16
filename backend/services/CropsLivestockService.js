const ElasticsearchService = require('./ElasticsearchService');

class CropsLivestockService extends ElasticsearchService {
  constructor() {
    super('crops_livestock');
  }

  // Get crops and livestock data with filters and pagination
  async getCropsLivestock(filters = {}, page = 1, limit = 50) {
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

      if (filters.element) {
        mustQueries.push({
          wildcard: {
            'element.keyword': `*${filters.element.toLowerCase()}*`
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
      console.error('Error getting crops and livestock data:', error.message);
      throw error;
    }
  }

  // Search crops and livestock data
  async searchCropsLivestock(searchTerm, filters = {}) {
    try {
      const searchFields = ['item', 'area', 'element', 'domain'];
      return await this.search(searchTerm, searchFields, filters);
    } catch (error) {
      console.error('Error searching crops and livestock data:', error.message);
      throw error;
    }
  }

  // Get analytics data
  async getAnalytics(filters = {}) {
    try {
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
      console.error('Error getting crops livestock analytics:', error.message);
      throw error;
    }
  }

  // Get filter options
  async getFilterOptions() {
    try {
      const aggregations = {
        areas: {
          terms: {
            field: 'area.keyword',
            size: 1000
          }
        },
        items: {
          terms: {
            field: 'item.keyword',
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
        },
        elements: {
          terms: {
            field: 'element.keyword',
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
        domainCodes: aggs.domainCodes.buckets.map(bucket => bucket.key).sort(),
        elements: aggs.elements.buckets.map(bucket => bucket.key).sort()
      };
    } catch (error) {
      console.error('Error getting filter options:', error.message);
      throw error;
    }
  }
}

module.exports = CropsLivestockService;
