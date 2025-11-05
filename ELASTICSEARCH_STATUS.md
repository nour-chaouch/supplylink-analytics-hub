# Elasticsearch Status & Troubleshooting Guide

## Quick Status Check

### Option 1: Using Node.js script (Recommended)
```bash
cd backend
npm run check-elasticsearch
```

### Option 2: Using PowerShell script
```powershell
.\check-elasticsearch.ps1
```

### Option 3: Manual check
```powershell
# Test Elasticsearch connection
curl http://localhost:9200

# Check cluster health
curl http://localhost:9200/_cluster/health
```

## Current Status

✅ **Elasticsearch is RUNNING**
- **Version**: 9.0.3
- **Port**: 9200
- **Cluster Status**: YELLOW (normal for single-node setup)
- **Nodes**: 1
- **Active Shards**: 3

## Starting Elasticsearch

If Elasticsearch is not running, use one of these methods:

### Option 1: Docker (Easiest)
```powershell
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 `
  -e "discovery.type=single-node" `
  -e "xpack.security.enabled=false" `
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

### Option 2: Windows Service
```powershell
Start-Service elasticsearch
```

### Option 3: Manual Installation
```powershell
cd C:\elasticsearch\elasticsearch-8.11.0\bin
.\elasticsearch.bat
```

## Troubleshooting

### Backend shows "Elasticsearch client not initialized"

**Solution**: Restart the backend server so it can reconnect to Elasticsearch:

```bash
# Stop the backend (Ctrl+C in the terminal where it's running)
# Then restart:
cd backend
npm start
```

### Cluster Status is YELLOW

**This is normal** for a single-node Elasticsearch cluster. YELLOW means:
- ✅ All primary shards are active
- ⚠️ Some replica shards are unassigned (expected in single-node setup)

To get GREEN status, you would need multiple nodes, but this is not necessary for development.

### Port 9200 is already in use

Check what's using the port:
```powershell
netstat -ano | findstr :9200
```

If it's not Elasticsearch, stop the process:
```powershell
taskkill /PID <PID> /F
```

### Backend can't connect to Elasticsearch

1. **Verify Elasticsearch is running**:
   ```powershell
   curl http://localhost:9200
   ```

2. **Check backend logs** for connection errors

3. **Restart backend** to reconnect:
   ```bash
   cd backend
   npm start
   ```

4. **Check environment variables** (if using custom Elasticsearch URL):
   ```env
   ELASTICSEARCH_URL=http://localhost:9200
   ```

## Verifying Full Setup

Run both checks:

```bash
# Check backend
cd backend
npm run check-backend

# Check Elasticsearch
npm run check-elasticsearch
```

Both should show ✅ green status.

## Next Steps

Once Elasticsearch is running:

1. **Verify backend connection**: The backend should automatically connect on startup
2. **Access Elasticsearch Admin**: Go to `http://localhost:3000/admin/elasticsearch`
3. **Create indices**: Use the admin panel to create your first index
4. **Import data**: Use the Data Import Wizard to add data to your indices

## Need More Help?

- See `ELASTICSEARCH_SETUP.md` for detailed installation instructions
- Check backend logs for connection errors
- Verify firewall settings allow localhost connections

