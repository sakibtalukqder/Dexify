@echo off
echo ========================================
echo  Stopping Remote Desktop Web App
echo ========================================
echo.

echo [1/2] Stopping RDP API server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq api-server*" >nul 2>&1

echo [2/2] Stopping Docker containers...
docker-compose down

echo.
echo ✅ All services stopped.
echo.
pause
