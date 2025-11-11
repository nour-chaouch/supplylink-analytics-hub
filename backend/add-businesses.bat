@echo off
echo ========================================
echo SupplyLink - Add Sample Businesses
echo ========================================
echo.

echo This script will add 10 sample businesses to your directory.
echo.
echo IMPORTANT: Make sure the backend server is running first!
echo If not, open another terminal and run: npm start
echo.
pause

echo.
echo Adding sample businesses...
echo.

node scripts/addSampleBusinesses.js

echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo Refresh your browser to see the businesses.
echo.

pause



