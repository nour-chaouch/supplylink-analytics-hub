# Quick Start - Get Elasticsearch Running

## Current Status
✅ Backend server: **RUNNING** on port 5001  
❌ Elasticsearch: **NOT RUNNING** (needed for data indices)

---

## Fastest Way to Get Started

### Quick Option 1: Chocolatey (2 commands)

Open PowerShell as **Administrator** and run:

```powershell
# Install Elasticsearch
choco install elasticsearch -y

# Start it
Start-Service elasticsearch
```

Verify it's running:
```powershell
curl http://localhost:9200
```

---

### Quick Option 2: Manual (5 minutes)

1. **Download Java 17**:
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Download: Windows x64 JDK installer
   - Run the installer
   - ✅ Done when you can run `java -version` in PowerShell

2. **Download Elasticsearch**:
   - Go to: https://www.elastic.co/downloads/elasticsearch
   - Download: Windows x86_64 (ZIP)
   - Extract to: `C:\elasticsearch`

3. **Start Elasticsearch**:
   ```powershell
   cd C:\elasticsearch\elasticsearch-8.11.0\bin
   .\elasticsearch.bat
   ```

4. **Verify**:
   Open a NEW PowerShell window (keep the Elasticsearch one running) and run:
   ```powershell
   curl http://localhost:9200
   ```

---

### What to Do After Elasticsearch Starts

1. Go to your SupplyLink frontend at: http://localhost:3000
2. Navigate to Admin Panel → Elasticsearch Management
3. Create an index or import data

---

## If You Just Want to Test Without Elasticsearch

The application can run without Elasticsearch, but you won't be able to:
- View or search data indices
- Import data
- Use analytics features

You can still:
- View the homepage
- Login/Register (if MongoDB is configured)
- Access admin user management (without data features)

---

## Need Help?

See `ELASTICSEARCH_SETUP.md` for detailed installation instructions.


