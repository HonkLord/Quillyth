@echo off
title D&D Campaign Manager Server
echo ==========================================
echo   D&D Campaign Manager Server Startup  
echo ==========================================

REM Check if node is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js to run the server.
    pause
    exit /b
)

REM Check if server.js exists
if not exist server.js (
    echo Error: server.js not found!
    echo Make sure you're running this from the campaign-manager directory
    pause
    exit /b
)

REM Start the server and open the app in the default browser
echo Starting server...
start http://localhost:3000/index.html
node server.js 