@echo off
echo ========================================
echo SupplyLink - Elasticsearch Setup
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges.
    echo.
    echo Please:
    echo 1. Right-click on this file
    echo 2. Select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Checking for Elasticsearch...
where elasticsearch >nul 2>&1
if %errorLevel% equ 0 (
    echo Elasticsearch is installed!
    echo.
    goto :START_SERVICE
)

echo.
echo Elasticsearch is not installed.
echo.
echo To install Elasticsearch, you have two options:
echo.
echo OPTION 1: Using Chocolatey (Fastest)
echo   1. Open PowerShell as Administrator
echo   2. Run: choco install elasticsearch -y
echo   3. Run this script again
echo.
echo OPTION 2: Manual Installation
echo   1. Download Elasticsearch from:
echo      https://www.elastic.co/downloads/elasticsearch
echo   2. Extract to C:\elasticsearch
echo   3. Run: C:\elasticsearch\elasticsearch-8.11.0\bin\elasticsearch.bat
echo.
echo For detailed instructions, see: ELASTICSEARCH_SETUP.md
echo.
pause
exit /b 0

:START_SERVICE
echo.
echo Starting Elasticsearch service...
sc query elasticsearch >nul 2>&1
if %errorLevel% equ 0 (
    echo Starting existing Elasticsearch service...
    net start elasticsearch
    if %errorLevel% equ 0 (
        echo.
        echo SUCCESS! Elasticsearch is now running.
        echo.
        echo Test it by opening in browser: http://localhost:9200
        echo.
    ) else (
        echo.
        echo ERROR: Failed to start Elasticsearch service.
        echo.
        echo Try starting manually:
        echo   net start elasticsearch
        echo.
    )
) else (
    echo.
    echo Elasticsearch service is not installed.
    echo You can start Elasticsearch manually:
    echo   cd C:\elasticsearch\elasticsearch-8.11.0\bin
    echo   elasticsearch.bat
    echo.
)

pause


