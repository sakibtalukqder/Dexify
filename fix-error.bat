@echo off
echo ====================================
echo     Docker Compose Fix & Restart
echo ====================================
echo.

echo [1/5] Stopping all containers...
docker-compose down
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Removing old images (optional)...
docker rmi remote_desk-frontend remote_desk-guacamole-proxy 2>nul

echo.
echo [3/5] Rebuilding containers...
docker-compose build --no-cache

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [4/5] Starting services...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ERROR: Start failed!
    pause
    exit /b 1
)

echo.
echo [5/5] Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo ====================================
echo Checking service status...
echo ====================================
docker-compose ps

echo.
echo ====================================
echo Services should be available at:
echo ====================================
echo Frontend:  http://localhost:3000
echo Guacamole: http://localhost:9090/guacamole
echo Proxy API: http://localhost:9092
echo ====================================
echo.
echo Checking logs for errors...
echo.
docker-compose logs --tail=10 guacamole-proxy

echo.
echo ====================================
echo Fix completed!
echo ====================================
echo.
echo Press any key to view live logs...
pause >nul

docker-compose logs -f
