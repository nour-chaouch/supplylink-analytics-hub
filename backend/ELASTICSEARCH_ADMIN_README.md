# Elasticsearch Admin Panel

This document describes the Elasticsearch administration features available in the SupplyLink Analytics Hub admin panel.

## Overview

The Elasticsearch Admin Panel provides a comprehensive interface for managing Elasticsearch indices, importing data, and monitoring cluster health. This allows administrators to:

- Create and manage Elasticsearch indices
- Import JSON data files
- Monitor cluster health and performance
- View index statistics and mappings

## Access

The Elasticsearch Admin Panel is accessible at:
```
http://localhost:3000/admin/elasticsearch
```

**Requirements:**
- Admin user authentication
- Elasticsearch running on `http://localhost:9200`

## Features

### 1. Cluster Health Monitoring

The admin panel displays real-time cluster health information:
- **Status**: Green (healthy), Yellow (warning), Red (critical)
- **Nodes**: Number of nodes in the cluster
- **Primary Shards**: Number of primary shards
- **Active Shards**: Total active shards

### 2. Index Management

#### Create New Index
- **Custom Index**: Create with custom name and optional mapping
- **Predefined Templates**: Use built-in templates for common data types
- **Empty Index**: Create without any mapping

#### Predefined Index Templates
- **Users**: For user management data
- **Producer Prices**: For agricultural price data
- **Crops & Livestock**: For production and livestock data

#### Index Operations
- **View Statistics**: Document count, store size, health status
- **Delete Index**: Remove unwanted indices
- **View Mappings**: Inspect index field mappings

### 3. Data Import

#### JSON File Import
- Upload JSON files containing data arrays
- Bulk import with configurable batch sizes
- Progress tracking and error reporting
- Support for documents with or without `_id` fields

#### Import Format
```json
[
  {
    "_id": "optional-id",
    "field1": "value1",
    "field2": "value2",
    "timestamp": "2023-12-01T00:00:00.000Z"
  },
  {
    "field1": "value3",
    "field2": "value4"
  }
]
```

## API Endpoints

The admin panel uses the following API endpoints:

### Cluster Management
- `GET /api/admin/elasticsearch/health` - Get cluster health
- `GET /api/admin/elasticsearch/indices` - List all indices

### Index Management
- `POST /api/admin/elasticsearch/indices` - Create new index
- `DELETE /api/admin/elasticsearch/indices/:name` - Delete index
- `GET /api/admin/elasticsearch/indices/:name/mapping` - Get index mapping
- `GET /api/admin/elasticsearch/indices/:name/stats` - Get index statistics

### Data Import
- `POST /api/admin/elasticsearch/indices/:name/import` - Import JSON data
- `POST /api/admin/elasticsearch/create-predefined-indices` - Create all predefined indices

### Templates
- `GET /api/admin/elasticsearch/templates` - Get available index templates

## Usage Examples

### 1. Creating a Custom Index

1. Navigate to the Elasticsearch Admin Panel
2. Enter index name (e.g., "custom_data")
3. Select template or provide custom mapping
4. Click "Create Index"

### 2. Importing Data

1. Create or select target index
2. Click the upload icon next to the index
3. Select JSON file from your computer
4. Click "Import" to start the upload
5. Monitor progress and results

### 3. Using Predefined Indices

1. Click "Create Predefined Indices"
2. This creates three indices:
   - `users` - For user data
   - `producer_prices` - For price data
   - `crops_livestock` - For production data

## Sample Data

A sample JSON file (`sample-data.json`) is provided with example data for testing:

```json
[
  {
    "_id": "1",
    "domainCode": "PP",
    "domain": "Producer Prices",
    "areaCode": 4,
    "area": "Algeria",
    "elementCode": 5530,
    "element": "Producer Price (USD/tonne)",
    "itemCode": 15,
    "item": "Wheat",
    "year": 2023,
    "unit": "USD/tonne",
    "value": 250.50,
    "flag": "A",
    "flagDescription": "Official data",
    "scrapedAt": "2023-12-01T00:00:00.000Z"
  }
]
```

## Security

- All admin endpoints require authentication
- Admin role verification is enforced
- File uploads are limited to JSON files
- File size limit: 50MB per upload

## Troubleshooting

### Common Issues

1. **Elasticsearch Connection Failed**
   - Ensure Elasticsearch is running on `http://localhost:9200`
   - Check firewall settings
   - Verify Elasticsearch configuration

2. **Import Failed**
   - Check JSON file format
   - Ensure target index exists
   - Verify file size is under 50MB limit

3. **Index Creation Failed**
   - Check index name format (lowercase, no special characters)
   - Verify mapping JSON syntax
   - Ensure index doesn't already exist

### Error Messages

- **"Elasticsearch client not initialized"**: Elasticsearch connection issue
- **"Index already exists"**: Try a different index name
- **"Invalid JSON file"**: Check file format and syntax
- **"Index not found"**: Create the index first before importing

## Best Practices

1. **Index Naming**: Use lowercase letters, numbers, and hyphens only
2. **Data Import**: Use smaller batch sizes for large datasets
3. **Mapping**: Define proper field types for better search performance
4. **Monitoring**: Regularly check cluster health and index statistics
5. **Backup**: Export important data before making changes

## Development

### Testing

Run the admin setup test:
```bash
npm run test-elasticsearch-admin
```

### Adding New Templates

To add new index templates:

1. Update `elasticsearchAdminRoutes.js` templates endpoint
2. Add template to the admin UI dropdown
3. Test with sample data

### Extending Functionality

The admin panel is designed to be extensible. You can add:
- Additional index templates
- Custom import formats
- Advanced search capabilities
- Index optimization tools

