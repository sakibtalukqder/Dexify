@echo off
echo ================================================
echo   Remote Desktop App - Service Health Check
echo ================================================
echo.

echo [1/4] Checking Docker services...
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul
if errorlevel 1 (
    echo ❌ Docker is not running or containers not started
    echo    Run: start.bat
    goto :end
)
echo.

echo [2/4] Checking Frontend (port 3000)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3000 2>nul
if errorlevel 1 (
    echo ❌ Frontend not responding
) else (
    echo ✅ Frontend OK
)
echo.

echo [3/4] Checking RDP API (port 9091)...
curl -s http://localhost:9091 2>nul
if errorlevel 1 (
    echo ❌ RDP API not responding
    echo    Make sure to run: node rdp-websocket-server\api-server.js
) else (
    echo ✅ RDP API OK
)
echo.

echo [4/4] Checking Guacamole Proxy (port 9092)...
curl -s http://localhost:9092 2>nul
if errorlevel 1 (
    echo ❌ Guacamole Proxy not responding
) else (
    echo ✅ Guacamole Proxy OK
)
echo.

echo ================================================
echo   Check complete!
echo ================================================
echo.
echo If all services show ✅, you're ready to use the app at:
echo   👉 http://localhost:3000
echo.

:end
pause
