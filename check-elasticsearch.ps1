# Elasticsearch Status Checker and Starter
# Checks if Elasticsearch is running and provides instructions to start it

Write-Host "`n🔍 Checking Elasticsearch status on port 9200...`n" -ForegroundColor Cyan

# Check if port 9200 is in use
$portCheck = netstat -ano | findstr :9200

if ($portCheck) {
    Write-Host "✅ Port 9200 is in use - checking if Elasticsearch is responding...`n" -ForegroundColor Green
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9200" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $esInfo = $response.Content | ConvertFrom-Json
            Write-Host "✅ Elasticsearch is RUNNING and responding correctly!`n" -ForegroundColor Green
            Write-Host "   Cluster Name: $($esInfo.cluster_name)" -ForegroundColor White
            Write-Host "   Version: $($esInfo.version.number)" -ForegroundColor White
            Write-Host "   Node Name: $($esInfo.name)" -ForegroundColor White
            
            # Check cluster health
            try {
                $healthResponse = Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -TimeoutSec 5 -UseBasicParsing
                $health = $healthResponse.Content | ConvertFrom-Json
                Write-Host "`n📊 Cluster Health:" -ForegroundColor Cyan
                Write-Host "   Status: $($health.status.ToUpper())" -ForegroundColor White
                Write-Host "   Nodes: $($health.number_of_nodes)" -ForegroundColor White
                Write-Host "   Active Shards: $($health.active_shards)" -ForegroundColor White
                Write-Host "   Primary Shards: $($health.active_primary_shards)" -ForegroundColor White
            } catch {
                Write-Host "`n⚠️  Could not fetch cluster health details" -ForegroundColor Yellow
            }
            
            Write-Host "`n🌐 Elasticsearch is available at: http://localhost:9200`n" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "❌ Port 9200 is in use but Elasticsearch is NOT responding correctly`n" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "`n💡 The process may have crashed or is stuck. Try:" -ForegroundColor Yellow
        Write-Host "   1. Stop the process using port 9200" -ForegroundColor White
        Write-Host "   2. Restart Elasticsearch`n" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "❌ Port 9200 is NOT in use - Elasticsearch is NOT running`n" -ForegroundColor Red
    Write-Host "💡 To start Elasticsearch:`n" -ForegroundColor Yellow
    
    # Check for Docker
    $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerInstalled) {
        Write-Host "   Option 1: Docker (Recommended)" -ForegroundColor Cyan
        Write-Host "     docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \`" -ForegroundColor White
        Write-Host "       -e `"discovery.type=single-node`" \`" -ForegroundColor White
        Write-Host "       -e `"xpack.security.enabled=false`" \`" -ForegroundColor White
        Write-Host "       docker.elastic.co/elasticsearch/elasticsearch:8.11.0`n" -ForegroundColor White
    }
    
    # Check for Windows Service
    $service = Get-Service elasticsearch -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "   Option 2: Windows Service" -ForegroundColor Cyan
        Write-Host "     Start-Service elasticsearch`n" -ForegroundColor White
    }
    
    Write-Host "   Option 3: Manual Installation" -ForegroundColor Cyan
    Write-Host "     cd C:\elasticsearch\elasticsearch-8.11.0\bin" -ForegroundColor White
    Write-Host "     .\elasticsearch.bat`n" -ForegroundColor White
    
    Write-Host "   See ELASTICSEARCH_SETUP.md for detailed instructions`n" -ForegroundColor Gray
    
    $startNow = Read-Host "Would you like to try starting Elasticsearch now? (y/n)"
    if ($startNow -eq 'y' -or $startNow -eq 'Y') {
        if ($service) {
            Write-Host "`n🚀 Starting Elasticsearch service...`n" -ForegroundColor Cyan
            Start-Service elasticsearch
            Start-Sleep -Seconds 3
            Write-Host "✅ Elasticsearch service started!`n" -ForegroundColor Green
            curl http://localhost:9200
        } elseif ($dockerInstalled) {
            Write-Host "`n🚀 Starting Elasticsearch in Docker...`n" -ForegroundColor Cyan
            docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
            Start-Sleep -Seconds 5
            Write-Host "✅ Elasticsearch started in Docker!`n" -ForegroundColor Green
            curl http://localhost:9200
        } else {
            Write-Host "`n⚠️  No automatic start method available. Please start Elasticsearch manually.`n" -ForegroundColor Yellow
        }
    }
    exit 1
}

