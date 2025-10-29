# Quick Elasticsearch Setup for SupplyLink
# Run this script as Administrator

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "SupplyLink - Quick Elasticsearch Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Administrator privileges required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    Write-Host "Then run: .\start-elasticsearch-quick.ps1" -ForegroundColor White
    exit 1
}

Write-Host "Checking available installation methods..." -ForegroundColor Cyan
Write-Host ""

# Method 1: Check for winget
$wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetInstalled) {
    Write-Host "✓ Winget is available" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install Elasticsearch with Winget:" -ForegroundColor Yellow
    Write-Host "  winget install --id=Elastic.Elasticsearch -e" -ForegroundColor White
    Write-Host ""
    $useWinget = Read-Host "Would you like to install Elasticsearch with Winget now? (y/n)"
    if ($useWinget -eq 'y') {
        Write-Host "Installing Elasticsearch..." -ForegroundColor Cyan
        winget install --id=Elastic.Elasticsearch -e
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Elasticsearch installed!" -ForegroundColor Green
            Write-Host "Starting Elasticsearch service..." -ForegroundColor Cyan
            Start-Service elasticsearch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Elasticsearch is running!" -ForegroundColor Green
                Start-Sleep -Seconds 2
                curl http://localhost:9200
                exit 0
            }
        }
    }
}

# Method 2: Check for Chocolatey
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
if ($chocoInstalled) {
    Write-Host "✓ Chocolatey is available" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install Elasticsearch with Chocolatey:" -ForegroundColor Yellow
    Write-Host "  choco install elasticsearch -y" -ForegroundColor White
    Write-Host ""
    $useChoco = Read-Host "Would you like to install Elasticsearch with Chocolatey now? (y/n)"
    if ($useChoco -eq 'y') {
        Write-Host "Installing Elasticsearch..." -ForegroundColor Cyan
        choco install elasticsearch -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Elasticsearch installed!" -ForegroundColor Green
            Write-Host "Starting Elasticsearch service..." -ForegroundColor Cyan
            Start-Service elasticsearch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Elasticsearch is running!" -ForegroundColor Green
                Start-Sleep -Seconds 2
                curl http://localhost:9200
                exit 0
            }
        }
    }
}

# Method 3: Docker
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "✓ Docker is available" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run Elasticsearch with Docker:" -ForegroundColor Yellow
    Write-Host "  docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e `"discovery.type=single-node`" -e `"xpack.security.enabled=false`" docker.elastic.co/elasticsearch/elasticsearch:8.11.0" -ForegroundColor White
    Write-Host ""
    $useDocker = Read-Host "Would you like to run Elasticsearch with Docker now? (y/n)"
    if ($useDocker -eq 'y') {
        Write-Host "Starting Elasticsearch in Docker..." -ForegroundColor Cyan
        docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        Start-Sleep -Seconds 5
        Write-Host "✓ Elasticsearch is running in Docker!" -ForegroundColor Green
        curl http://localhost:9200
        exit 0
    }
}

# If none of the above worked
Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Manual Installation Required" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "No automatic installation method is available." -ForegroundColor Red
Write-Host ""
Write-Host "Please install Elasticsearch manually:" -ForegroundColor Yellow
Write-Host "1. Install Java 17: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor White
Write-Host "2. Download Elasticsearch: https://www.elastic.co/downloads/elasticsearch" -ForegroundColor White
Write-Host "3. Extract to C:\elasticsearch" -ForegroundColor White
Write-Host "4. Run: C:\elasticsearch\elasticsearch-8.11.0\bin\elasticsearch.bat" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: ELASTICSEARCH_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"


