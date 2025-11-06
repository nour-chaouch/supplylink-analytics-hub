@echo off
echo ========================================
echo SupplyLink Backend Server Starter
echo ========================================
echo.

REM Check if port 5002 is already in use
netstat -ano | findstr :5002 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 5002 is already in use!
    echo.
    echo Please stop any existing process using port 5002 or
    echo use a different port by setting PORT environment variable.
    echo.
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
echo.
echo Server will start on port 5002
echo Keep this window open!
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm start

pause
