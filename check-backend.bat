@echo off
REM Backend Server Status Checker and Starter (Windows Batch)
REM Checks if backend is running and provides instructions to start it

echo.
echo Checking backend server status on port 5002...
echo.

REM Check if port 5002 is in use
netstat -ano | findstr :5002 >nul
if %errorlevel% equ 0 (
    echo Port 5002 is in use - checking if backend is responding...
    echo.
    
    REM Try to check health endpoint
    curl -s http://localhost:5002/api/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo Backend server is RUNNING and responding correctly!
        echo.
        echo Backend is available at: http://localhost:5002
        echo Health check: http://localhost:5002/api/health
        echo.
        exit /b 0
    ) else (
        echo Port 5002 is in use but backend is NOT responding correctly
        echo.
        echo The process may have crashed or is stuck.
        echo Try stopping the process and restarting the backend server.
        echo.
        exit /b 1
    )
) else (
    echo Port 5002 is NOT in use - backend server is NOT running
    echo.
    echo To start the backend server:
    echo   cd backend
    echo   npm start
    echo.
    exit /b 1
)

