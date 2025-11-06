# Complete Guide: Fix "No businesses found"

## Step 1: Start Backend Server ✅

**Open a PowerShell or Command Prompt window** and run:

```powershell
cd C:\Users\sqli2\Desktop\projet\supplylink\backend
npm start
```

**OR double-click:** `start-backend.bat`

**Keep this window open!** You should see:
```
🚀 SupplyLink Backend running in development mode on port 5001
```

## Step 2: Add Sample Businesses ✅

**Once backend is running, open ANOTHER terminal window** and run:

```powershell
cd C:\Users\sqli2\Desktop\projet\supplylink\backend
node scripts/addSampleBusinesses.js
```

**OR double-click:** `add-businesses.bat`

You should see:
```
✅ Successfully added all businesses!
📊 10 businesses added successfully
```

## Step 3: Refresh Frontend ✅

1. Go to `http://localhost:3000/businesses`
2. Press **F5** to refresh
3. Businesses should now appear!

## Quick Verification

**Check backend is running:**
```powershell
curl http://localhost:5001/api/health
```

**Check businesses exist:**
```powershell
curl http://localhost:5001/api/businesses
```

## Troubleshooting

### Backend won't start?
- Check Node.js: `node --version`
- Install dependencies: `npm install`
- Check port 5001: `netstat -ano | findstr :5001`

### "No businesses found" after starting backend?
- ✅ Run: `node scripts/addSampleBusinesses.js`
- ✅ Make sure Elasticsearch is running: `curl http://localhost:9200`
- ✅ Check backend console for errors

### Frontend shows error?
- ✅ Verify backend is running
- ✅ Check browser console (F12) for errors
- ✅ Make sure both frontend and backend are running

## Files Created

- `start-backend.bat` - Starts the backend server
- `add-businesses.bat` - Adds sample businesses
- `scripts/addSampleBusinesses.js` - The actual script

## Summary

1. **Terminal 1:** Start backend (`npm start`)
2. **Terminal 2:** Add businesses (`node scripts/addSampleBusinesses.js`)
3. **Browser:** Refresh page

Done! 🎉


