# Quick Start Guide - Backend Server

## Start Backend Server

**Open a new PowerShell or Command Prompt window and run:**

```powershell
cd C:\Users\sqli2\Desktop\projet\supplylink\backend
npm start
```

The server should start and show:
```
🚀 SupplyLink Backend running in development mode on port 5001
📊 Health check available at: http://localhost:5001/api/health
```

**Keep this terminal window open** - the server needs to keep running.

## Add Sample Businesses

Once the backend is running, **open another terminal window** and run:

```powershell
cd C:\Users\sqli2\Desktop\projet\supplylink\backend
node scripts/addSampleBusinesses.js
```

This will add 10 sample businesses to your directory.

## Verify Everything is Working

1. **Check backend is running:**
   ```powershell
   curl http://localhost:5001/api/health
   ```

2. **Check businesses exist:**
   ```powershell
   curl http://localhost:5001/api/businesses
   ```

3. **Refresh your frontend** at `http://localhost:3000/businesses`

## Troubleshooting

### Backend won't start?
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install` (in backend directory)
- Check if port 5001 is already in use

### No businesses showing?
- Make sure Elasticsearch is running: `curl http://localhost:9200`
- Run the sample businesses script: `node scripts/addSampleBusinesses.js`
- Check backend logs for errors

### Frontend can't connect?
- Verify backend is running on port 5001
- Check browser console for errors
- Make sure frontend proxy is configured correctly

