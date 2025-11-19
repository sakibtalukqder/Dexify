@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Remote Desktop Web App - Complete Setup
echo ========================================================
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo    Please install Node.js v16 or higher from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js found
node --version
echo.

REM Check npm
echo [2/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found!
    pause
    exit /b 1
)
echo ✅ npm found
npm --version
echo.

REM Check Docker
echo [3/6] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found!
    echo    Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✅ Docker found
docker --version

docker info >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker is not running!
    echo    Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)
echo ✅ Docker is running
echo.

REM Install frontend dependencies
echo [4/6] Installing frontend dependencies...
cd remote-desktop-viewer
if exist node_modules (
    echo ℹ️  node_modules exists, skipping...
) else (
    echo Installing packages (this may take a few minutes)...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)
cd ..
echo ✅ Frontend dependencies ready
echo.

REM Install backend dependencies
echo [5/6] Installing backend dependencies...
cd rdp-websocket-server
if exist node_modules (
    echo ℹ️  node_modules exists, skipping...
) else (
    echo Installing packages...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
)
cd ..
echo ✅ Backend dependencies ready
echo.

REM Build Docker images
echo [6/6] Building Docker images...
echo This may take several minutes on first run...
docker-compose build --parallel
if errorlevel 1 (
    echo ❌ Failed to build Docker images
    pause
    exit /b 1
)
echo ✅ Docker images built
echo.

echo ========================================================
echo   🎉 Setup Complete!
echo ========================================================
echo.
echo All dependencies are installed and ready.
echo.
echo Next steps:
echo   1. Run: start.bat
echo   2. Wait 45 seconds for services to start
echo   3. Open: http://localhost:3000
echo.
echo Services that will run:
echo   • Frontend React App      (port 3000)
echo   • RDP Launcher API        (port 9091)
echo   • Guacamole Proxy         (port 9092)  
echo   • Apache Guacamole        (port 9090)
echo   • PostgreSQL Database     (internal)
echo.
echo For more information, read:
echo   • QUICKSTART.md
echo   • COMPLETE_SOLUTION.md
echo.
pause
