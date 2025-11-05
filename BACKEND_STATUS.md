# Backend Server Status & Troubleshooting

## Quick Status Check

### Option 1: Using Node.js script (Recommended)
```bash
cd backend
npm run check-backend
```

### Option 2: Using PowerShell script
```powershell
.\check-backend.ps1
```

### Option 3: Using Batch script
```cmd
check-backend.bat
```

### Option 4: Manual check
```powershell
# Check if port is in use
netstat -ano | findstr :5001

# Test health endpoint
curl http://localhost:5001/api/health
```

## Starting the Backend Server

If the backend is not running, start it with:

```bash
cd backend
npm start
```

This will start the server with nodemon (auto-restart on file changes).

## Troubleshooting

### Port 5001 is in use but backend not responding
- The process may have crashed
- Stop the process: Find PID using `netstat -ano | findstr :5001`, then `taskkill /PID <PID> /F`
- Restart the backend: `cd backend && npm start`

### Connection refused errors
- Backend server is not running
- Start it: `cd backend && npm start`
- Check firewall settings

### Timeout errors
- Backend server may be slow to respond
- Check server logs for errors
- Verify Elasticsearch connection (if needed)

## Default Configuration

- **Port**: 5001 (configurable via `PORT` environment variable)
- **Health endpoint**: `http://localhost:5001/api/health`
- **Frontend proxy**: Configured to proxy `/api/*` requests to `http://localhost:5001`

## Environment Variables

Create a `.env` file in the `backend` directory with:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string (optional)
ELASTICSEARCH_URL=http://localhost:9200 (optional)
FRONTEND_URL=http://localhost:3000
```

