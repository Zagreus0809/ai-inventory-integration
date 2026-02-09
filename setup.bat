@echo off
echo ========================================
echo SAP AI Inventory System - Setup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found!
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [3/4] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo .env file created!
    echo.
    echo IMPORTANT: Edit .env file and add your Gemini API key
    echo Get your API key from: https://makersuite.google.com/app/apikey
    echo.
) else (
    echo .env file already exists
)

echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit .env file and add your Gemini API key
echo 2. Run: npm start
echo 3. Open browser: http://localhost:3000
echo.
echo For GitHub/Vercel deployment, see GITHUB_SETUP.md
echo For thesis research, see THESIS_GUIDE.md
echo ========================================
pause
