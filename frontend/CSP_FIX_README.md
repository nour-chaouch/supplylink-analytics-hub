# Content Security Policy (CSP) Fix

## Problem
The frontend was showing the error:
```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
```

This happens because Create React App's development server uses `eval()` for hot reloading and source maps, which is blocked by default CSP settings.

## Solution Applied

### 1. Package.json Script Update
Updated the start script to disable source map generation using cross-env:
```json
"start": "cross-env GENERATE_SOURCEMAP=false react-scripts start"
```

### 2. Cross-Platform Support
Installed `cross-env` package for cross-platform environment variable support:
```bash
npm install --save-dev cross-env
```

### 3. Proxy Configuration
Modified `src/setupProxy.js` to remove CSP headers:
```javascript
// Disable CSP headers for development
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});
```

### 4. HTML Meta Tag
Added permissive CSP meta tag to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *;" />
```

### 5. Development Scripts
Created development start scripts:
- `start-dev.sh` (Linux/Mac)
- `start-dev.bat` (Windows)

## Usage

### Option 1: Use Updated npm Script (Recommended)
```bash
npm start
```

### Option 2: Use Development Scripts
```bash
# Linux/Mac
./start-dev.sh

# Windows
start-dev.bat
```

### Option 3: Manual Environment Variables
```bash
# Linux/Mac
GENERATE_SOURCEMAP=false npm start

# Windows
set GENERATE_SOURCEMAP=false && npm start
```

## Security Note
These changes are for **development only**. In production:
- Source maps should be enabled for debugging
- CSP should be properly configured for security
- `unsafe-eval` should be avoided

## Files Modified
- `frontend/package.json` - Updated start script with cross-env
- `frontend/src/setupProxy.js` - Added CSP header removal
- `frontend/public/index.html` - Added permissive CSP meta tag
- `frontend/start-dev.sh` - Linux/Mac start script
- `frontend/start-dev.bat` - Windows start script

## Dependencies Added
- `cross-env` - Cross-platform environment variable support

## Testing
After applying these changes:
1. Stop the current development server
2. Restart with `npm start`
3. The CSP error should be resolved
4. Hot reloading should work properly
5. Works on Windows, Mac, and Linux
