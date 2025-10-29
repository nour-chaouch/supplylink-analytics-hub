# Business Directory API Guide

## Overview

The Business Directory API allows you to manage and search through businesses in the SupplyLink system. There are currently **10 sample businesses** already added to the directory.

## Base URL
```
http://localhost:5001/api/businesses
```

---

## Available Endpoints

### 1. Get All Businesses
```http
GET /api/businesses
```

**Query Parameters:**
- `q` - Search query (searches name, description, products, services, tags)
- `category` - Filter by category
- `industry` - Filter by industry
- `city` - Filter by city
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Example:**
```bash
curl "http://localhost:5001/api/businesses?q=honey&category=Agriculture"
```

---

### 2. Get Business by ID
```http
GET /api/businesses/:id
```

**Example:**
```bash
curl http://localhost:5001/api/businesses/Cv46K5oBSd98C4B2O_Xh
```

---

### 3. Add a Business
```http
POST /api/businesses
```

**Request Body:**
```json
{
  "name": "My Farm Business",
  "category": "Agriculture",
  "industry": "Livestock",
  "description": "Family-owned livestock operation",
  "website": "https://myfarm.com",
  "email": "contact@myfarm.com",
  "phone": "+1-555-1234",
  "address": {
    "street": "123 Farm Road",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "tags": ["organic", "local"],
  "products": ["beef", "pork"],
  "services": ["farm tours"],
  "employees": 15,
  "yearFounded": 2010,
  "revenue": 500000,
  "rating": 4.5,
  "verified": true,
  "featured": false
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/businesses \
  -H "Content-Type: application/json" \
  -d @business.json
```

---

### 4. Update a Business
```http
PUT /api/businesses/:id
```

**Example:**
```bash
curl -X PUT http://localhost:5001/api/businesses/:id \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

---

### 5. Delete a Business
```http
DELETE /api/businesses/:id
```

**Example:**
```bash
curl -X DELETE http://localhost:5001/api/businesses/:id
```

---

### 6. Get Categories
```http
GET /api/businesses/categories/list
```

Returns all available categories and their counts.

---

### 7. Get Industries
```http
GET /api/businesses/industries/list
```

Returns all available industries and their counts.

---

### 8. Bulk Add Businesses
```http
POST /api/businesses/bulk
```

Add multiple businesses at once.

**Request Body:**
```json
[
  {
    "name": "Business 1",
    "category": "Agriculture",
    ...
  },
  {
    "name": "Business 2",
    "category": "Technology",
    ...
  }
]
```

---

## Current Sample Businesses

1. **Green Valley Organic Farms** - Agriculture/Organic Farming
2. **AgriTech Solutions Inc** - Technology/Agricultural Technology
3. **Rural Supply Co.** - Retail/Agricultural Supplies
4. **Pure Honey Apiaries** - Agriculture/Beekeeping
5. **Sustainable Seed Company** - Agriculture/Seed Production
6. **Farm Fresh Delivery** - Logistics/Food Delivery
7. **Livestock Management Systems** - Technology/Livestock Technology
8. **Agricultural Consulting Group** - Consulting/Agricultural Consulting
9. **Heritage Grain Mill** - Processing/Grain Processing
10. **Urban Farm Co-op** - Agriculture/Urban Farming

---

## Business Data Structure

Each business can have the following fields:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Business name (required) |
| category | string | Business category |
| industry | string | Specific industry |
| description | string | Business description |
| website | string | Website URL |
| email | string | Contact email |
| phone | string | Contact phone |
| address | object | Full address with street, city, state, zipCode, country |
| tags | array | Keywords/tags |
| products | array | List of products |
| services | array | List of services |
| employees | number | Number of employees |
| yearFounded | number | Year business was founded |
| revenue | number | Annual revenue |
| rating | number | Rating (0-5) |
| socialMedia | object | Social media links |
| verified | boolean | Verified business flag |
| featured | boolean | Featured business flag |

---

## Examples

### Search for organic businesses
```bash
curl "http://localhost:5001/api/businesses?q=organic"
```

### Filter by category
```bash
curl "http://localhost:5001/api/businesses?category=Agriculture"
```

### Find businesses in a city
```bash
curl "http://localhost:5001/api/businesses?city=San Francisco"
```

---

## Using the API

### Adding a New Business Directly

Use curl or Postman to add a business:

```bash
curl -X POST http://localhost:5001/api/businesses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Farm",
    "category": "Agriculture",
    "industry": "Organic Farming",
    "description": "Small family farm",
    "email": "info@localfarm.com",
    "phone": "+1-555-1234",
    "address": {
      "street": "123 Farm Road",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701",
      "country": "USA"
    },
    "verified": true
  }'
```

### Using PowerShell

```powershell
$body = @{
    name = "My Business"
    category = "Agriculture"
    industry = "Farming"
    description = "Description here"
    email = "info@business.com"
    phone = "+1-555-1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/businesses" -Method POST -Body $body -ContentType "application/json"
```

---

## Testing

Test the API with:

```bash
# Get all businesses
curl http://localhost:5001/api/businesses

# Get categories
curl http://localhost:5001/api/businesses/categories/list

# Get industries
curl http://localhost:5001/api/businesses/industries/list

# Search
curl "http://localhost:5001/api/businesses?q=technology"
```

---

## Notes

- Businesses are stored in Elasticsearch
- The index name is: `business_directory`
- All businesses have automatic `createdAt` and `updatedAt` timestamps
- Search is case-insensitive and supports fuzzy matching
- Featured businesses appear first in results

