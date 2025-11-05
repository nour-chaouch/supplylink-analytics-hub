# Backend Server Status Checker and Starter
# Checks if backend is running and provides instructions to start it

Write-Host "`n🔍 Checking backend server status on port 5001...`n" -ForegroundColor Cyan

# Check if port 5001 is in use
$portCheck = netstat -ano | findstr :5001

if ($portCheck) {
    Write-Host "✅ Port 5001 is in use - checking if backend is responding...`n" -ForegroundColor Green
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "✅ Backend server is RUNNING and responding correctly!`n" -ForegroundColor Green
            Write-Host "   Status: $($healthData.status)" -ForegroundColor White
            Write-Host "   Message: $($healthData.message)" -ForegroundColor White
            Write-Host "`n🌐 Backend is available at: http://localhost:5001" -ForegroundColor Cyan
            Write-Host "🏥 Health check: http://localhost:5001/api/health`n" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "❌ Port 5001 is in use but backend is NOT responding correctly`n" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "`n💡 The process may have crashed or is stuck. Try:" -ForegroundColor Yellow
        Write-Host "   1. Stop the process using port 5001" -ForegroundColor White
        Write-Host "   2. Restart the backend server`n" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "❌ Port 5001 is NOT in use - backend server is NOT running`n" -ForegroundColor Red
    Write-Host "💡 To start the backend server:`n" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm start`n" -ForegroundColor White
    
    $startNow = Read-Host "Would you like to start it now? (y/n)"
    if ($startNow -eq 'y' -or $startNow -eq 'Y') {
        Write-Host "`n🚀 Starting backend server...`n" -ForegroundColor Cyan
        Set-Location backend
        npm start
    }
    exit 1
}

