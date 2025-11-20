@echo off
chcp 65001 >nul
cls

echo ================================================
echo    KNYHARNIYA ONLINE - BOOKSTORE APPLICATION
echo ================================================
echo.
echo Starting BookStore application...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Node modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM Kill any existing node processes on port 3000
echo Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

REM Start the application
node server.js

pause
