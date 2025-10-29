# Elasticsearch Setup Guide for SupplyLink

## Quick Start (Choose One Option)

### Option 1: Docker (Recommended - Easiest)

If you have Docker Desktop installed:

```bash
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

To check if it's running:
```bash
docker ps
```

To view logs:
```bash
docker logs elasticsearch
```

To stop:
```bash
docker stop elasticsearch
```

---

### Option 2: Chocolatey Package Manager

1. **Install Chocolatey** (if you don't have it):
   Open PowerShell as Administrator and run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Elasticsearch**:
   ```powershell
   choco install elasticsearch -y
   ```

3. **Start Elasticsearch service**:
   ```powershell
   Start-Service elasticsearch
   ```

---

### Option 3: Manual Installation (No Package Manager)

**Requirements:**
- Java 17 or later (download from: https://adoptium.net/)
- Elasticsearch 8.11.0 or later

**Steps:**

1. **Install Java 17**:
   - Download from: https://adoptium.net/temurin/releases/?version=17
   - Choose: Windows x64 JDK installer
   - Run the installer
   - Verify installation: Open new PowerShell and run `java -version`

2. **Download Elasticsearch**:
   - Go to: https://www.elastic.co/downloads/elasticsearch
   - Download: Elasticsearch 8.11.0 (Windows x86_64, ZIP)
   - Extract to: `C:\elasticsearch`

3. **Start Elasticsearch**:
   ```powershell
   cd C:\elasticsearch\elasticsearch-8.11.0\bin
   .\elasticsearch.bat
   ```

4. **Verify it's running**:
   Open a new PowerShell window and run:
   ```powershell
   curl http://localhost:9200
   ```
   You should see JSON output with version information.

---

## Start/Stop Elasticsearch

### Docker:
```bash
# Start
docker start elasticsearch

# Stop
docker stop elasticsearch

# Restart
docker restart elasticsearch
```

### Windows Service (Chocolatey):
```powershell
# Start
Start-Service elasticsearch

# Stop
Stop-Service elasticsearch

# Status
Get-Service elasticsearch
```

### Manual Installation:
- **Start**: Navigate to `C:\elasticsearch\elasticsearch-8.11.0\bin` and run `.\elasticsearch.bat`
- **Stop**: Press `Ctrl+C` in the terminal window where it's running

---

## Verify Elasticsearch is Running

Test the connection:
```powershell
curl http://localhost:9200
```

Or open in browser:
```
http://localhost:9200
```

You should see JSON output like:
```json
{
  "name": "...",
  "cluster_name": "elasticsearch",
  "cluster_uuid": "...",
  "version": {
    "number": "8.11.0"
  }
}
```

---

## Configure SupplyLink Backend

The backend is configured to connect to Elasticsearch at `http://localhost:9200` by default. No additional configuration is needed if:
- Elasticsearch is running on `localhost:9200`
- Security is disabled (recommended for development)

If you need to configure a different Elasticsearch URL, create a `.env` file in the `backend` folder:

```env
ELASTICSEARCH_URL=http://localhost:9200
```

---

## Troubleshooting

### Port 9200 is already in use:
```powershell
# Find what's using the port
netstat -ano | findstr :9200

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Java not found:
- Download and install Java 17 from https://adoptium.net/
- Make sure to add Java to your PATH

### Elasticsearch won't start:
- Check the logs in: `C:\elasticsearch\elasticsearch-8.11.0\logs\elasticsearch.log`
- Ensure Java is installed: `java -version`
- Check available memory (Elasticsearch needs at least 1GB RAM)

### Permissions error:
- Run PowerShell or Command Prompt as Administrator

---

## Next Steps

Once Elasticsearch is running:

1. **Verify backend connection**: The backend should automatically connect to Elasticsearch on start.

2. **Create your first index**: Use the Elasticsearch Admin panel in the SupplyLink frontend at `http://localhost:3000/admin/elasticsearch`

3. **Import data**: Use the Data Import Wizard in the admin panel to add agricultural data to your indices.

---

## Need Help?

- Elasticsearch documentation: https://www.elastic.co/guide/en/elasticsearch/reference/8.11/index.html
- Docker documentation: https://docs.docker.com/
- Adoptium Java: https://adoptium.net/


