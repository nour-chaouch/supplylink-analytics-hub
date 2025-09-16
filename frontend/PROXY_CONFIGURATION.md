# Frontend-Backend Proxy Configuration

## Issue Fixed
The frontend was trying to access API endpoints directly at `http://localhost:3000/api/...` instead of proxying requests to the backend server at `http://localhost:5001`.

## Solution Implemented

### 1. **Package.json Proxy Configuration**
```json
{
  "proxy": "http://localhost:5001"
}
```
This tells Create React App to proxy all API requests to the backend server.

### 2. **API Service Configuration**
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5001/api' 
  : '/api';
```
- **Development**: Uses relative URLs (`/api`) which get proxied
- **Production**: Uses full backend URL (`http://localhost:5001/api`)

### 3. **Advanced Proxy Setup (Optional)**
Created `src/setupProxy.js` for more advanced proxy configuration:
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false
    })
  );
};
```

## How It Works

### **Before (Broken)**
```
Frontend (localhost:3000) → http://localhost:3000/api/admin/elasticsearch/health
❌ No backend server at port 3000
```

### **After (Fixed)**
```
Frontend (localhost:3000) → /api/admin/elasticsearch/health
↓ (Proxy)
Backend (localhost:5001) → http://localhost:5001/api/admin/elasticsearch/health
✅ Request properly routed to backend
```

## Request Flow

1. **Frontend makes API call**: `axios.get('/api/admin/elasticsearch/health')`
2. **Proxy intercepts**: Create React App sees `/api` prefix
3. **Request forwarded**: Proxy forwards to `http://localhost:5001/api/admin/elasticsearch/health`
4. **Backend responds**: Backend processes request and returns response
5. **Response forwarded**: Proxy forwards response back to frontend

## Testing

### **Verify Proxy is Working**
1. Start backend server: `npm start` (in backend directory)
2. Start frontend server: `npm start` (in frontend directory)
3. Check browser Network tab:
   - Request URL should show: `http://localhost:3000/api/admin/elasticsearch/health`
   - But actually proxies to: `http://localhost:5001/api/admin/elasticsearch/health`

### **Check Console Logs**
The setupProxy.js provides clean proxy configuration without debug logging for production use.

## Dependencies Added

```json
{
  "devDependencies": {
    "http-proxy-middleware": "^2.0.6"
  }
}
```

## Environment Configuration

### **Development**
- Uses proxy configuration
- API calls use relative URLs (`/api`)
- Requests automatically proxied to backend

### **Production**
- No proxy (served as static files)
- API calls use full backend URL
- Backend must be accessible from production domain

## Troubleshooting

### **Common Issues**

1. **Proxy not working**
   - Restart frontend development server
   - Check backend is running on port 5001
   - Verify package.json has proxy configuration

2. **CORS errors**
   - Backend should have CORS configured for frontend origin
   - Check backend CORS settings

3. **Network errors**
   - Verify backend server is running
   - Check backend logs for errors
   - Ensure backend routes are properly configured

### **Debug Steps**

1. **Check proxy configuration**:
   ```bash
   # In frontend directory
   cat package.json | grep proxy
   ```

2. **Check API base URL**:
   ```javascript
   // In browser console
   console.log(process.env.NODE_ENV);
   ```

3. **Monitor network requests**:
   - Open browser DevTools
   - Go to Network tab
   - Make API request
   - Check if request goes to correct URL

## Benefits

- ✅ **Proper Request Routing**: API calls go to backend server
- ✅ **Development Convenience**: No need to configure CORS for localhost
- ✅ **Environment Flexibility**: Different configs for dev/prod
- ✅ **Debug Support**: Logging and error handling
- ✅ **Hot Reload Compatible**: Works with Create React App hot reload

The proxy configuration ensures that all API requests from the frontend are properly routed to the backend server, fixing the issue where requests were trying to access non-existent endpoints on the frontend server.
