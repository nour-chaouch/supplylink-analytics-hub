# MongoDB to Elasticsearch Migration Guide

This guide explains how to migrate your SupplyLink Analytics Hub from MongoDB to Elasticsearch.

## Prerequisites

1. **Elasticsearch Running**: Make sure Elasticsearch is running on your system
   - Default URL: `http://localhost:9200`
   - For authentication, set `ELASTICSEARCH_USERNAME` and `ELASTICSEARCH_PASSWORD` in your `.env` file

2. **MongoDB Data**: Ensure your MongoDB instance is running and contains the data you want to migrate

## Migration Steps

### 1. Install Dependencies

The Elasticsearch client is already installed. If you need to reinstall:

```bash
npm install @elastic/elasticsearch
```

### 2. Configure Environment Variables

Create or update your `.env` file with:

```env
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=your_password

# MongoDB Configuration (for migration)
MONGO_URI=mongodb://localhost:27017/supplylink

# Other existing configurations...
```

### 3. Run Migration

Execute the migration script:

```bash
npm run migrate-to-elasticsearch
```

This will:
- Initialize Elasticsearch connection
- Create all necessary indices with proper mappings
- Migrate all data from MongoDB to Elasticsearch
- Provide progress updates and error reporting

### 4. Verify Migration

After migration, verify the data:

```bash
npm run verify-migration
```

This will compare record counts between MongoDB and Elasticsearch to ensure all data was migrated successfully.

## What Gets Migrated

The migration process transfers the following data:

1. **Users** (`users` index)
   - User profiles, authentication data
   - Password hashes are preserved

2. **Producer Prices** (`producer_prices` index)
   - Agricultural price data from FAO STAT
   - All metadata and timestamps

3. **Crops & Livestock** (`crops_livestock` index)
   - Production and livestock statistics
   - All metadata and timestamps

## Elasticsearch Features Enabled

After migration, you'll have access to:

- **Full-text search** across all agricultural data
- **Fuzzy search** for better matching
- **Aggregations** for analytics
- **Faceted search** with filters
- **Auto-complete** suggestions
- **Advanced querying** capabilities

## API Changes

The API endpoints remain the same, but now use Elasticsearch for:

- Faster search performance
- Better text search capabilities
- More flexible filtering
- Enhanced analytics

## Troubleshooting

### Connection Issues

If Elasticsearch connection fails:

1. Check if Elasticsearch is running: `curl http://localhost:9200`
2. Verify the URL in your `.env` file
3. Check authentication credentials if using security

### Migration Errors

If migration fails:

1. Check MongoDB connection
2. Ensure Elasticsearch has enough disk space
3. Check Elasticsearch logs for errors
4. Run verification to see what was migrated

### Performance Issues

If queries are slow:

1. Check Elasticsearch cluster health
2. Consider increasing Elasticsearch memory
3. Optimize index mappings if needed

## Rollback Plan

If you need to rollback to MongoDB:

1. The original MongoDB data remains unchanged
2. Update routes to use MongoDB models instead of Elasticsearch services
3. Restart the server

## Next Steps

After successful migration:

1. Test all API endpoints
2. Verify frontend functionality
3. Monitor Elasticsearch performance
4. Consider optimizing queries for better performance

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify Elasticsearch cluster health
3. Ensure all environment variables are set correctly
4. Check that all required indices were created successfully

