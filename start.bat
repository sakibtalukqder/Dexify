@echo off
echo ========================================
echo  Remote Desktop Web App - Startup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Starting Docker containers...
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)

echo.
echo [2/5] Waiting for services to be ready (45 seconds)...
timeout /t 45 /nobreak >nul

echo.
echo [3/5] Starting RDP Launcher API (native Windows)...
cd rdp-websocket-server
start /b cmd /c "node api-server.js > api.log 2>&1"
cd ..

echo.
echo [4/5] Checking service status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo [5/5] Verifying connectivity...
echo   Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1 && echo   ✅ Frontend ready || echo   ⏳ Frontend starting...
echo   Checking Guacamole...
curl -s http://localhost:9090/guacamole/ >nul 2>&1 && echo   ✅ Guacamole ready || echo   ⏳ Guacamole starting...
echo   Checking Proxy...
curl -s http://localhost:9092/ >nul 2>&1 && echo   ✅ Proxy ready || echo   ⏳ Proxy starting...
echo   Checking RDP API...
curl -s http://localhost:9091/ >nul 2>&1 && echo   ✅ RDP API ready || echo   ⏳ RDP API starting...

echo.
echo ========================================
echo  🎉 All services are running!
echo ========================================
echo.
echo  📍 Access points:
echo     Frontend:         http://localhost:3000
echo     Guacamole:        http://localhost:9090/guacamole
echo     RDP API:          http://localhost:9091
echo     Guacamole Proxy:  http://localhost:9092
echo.
echo  ℹ️  Two connection methods:
echo     1. 🖥️  Windows RDP - Native client (recommended)
echo     2. 🌐 Browser RDP - Web-based via Guacamole
echo.
echo  📝 Opening frontend in browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
echo  ✅ Ready to connect!
echo.
echo  To view logs: docker-compose logs -f
echo  To stop:      stop.bat
echo.
pause
