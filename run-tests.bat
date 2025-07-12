@echo off
echo Starting Campaign Manager Test Suite...
echo.

REM Check if server is running
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server is not running. Please start the server first:
    echo    npm start
    echo.
    pause
    exit /b 1
)

echo ✅ Server is running, executing tests...
echo.

REM Run the test suite
npm test

echo.
echo Test execution complete!
pause 