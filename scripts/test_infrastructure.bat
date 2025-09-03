@echo off
REM AVAI Redis Infrastructure Test Script for Windows
REM ==================================================

echo 🧪 AVAI Redis Infrastructure Test Suite
echo ========================================
echo.

echo 📍 Testing Local Services
echo ------------------------

REM Test Redis
echo | set /p="Redis Server... "
docker exec avai-redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ RUNNING
) else (
    echo ❌ DOWN
)

REM Test Analytics API
echo | set /p="Analytics API health... "
curl -s http://localhost:8002/health | findstr "healthy" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ HEALTHY
) else (
    echo ❌ UNHEALTHY
)

REM Test Dashboard
echo | set /p="Dashboard Web UI... "
curl -s -f http://localhost:8003 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PASS
) else (
    echo ❌ FAIL
)

echo.
echo 🌐 Testing Cloudflare Tunnel URLs
echo ---------------------------------

echo | set /p="Dashboard Tunnel... "
curl -s -f -m 10 https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ACCESSIBLE
) else (
    echo ⏳ PENDING ^(DNS propagation or SSL setup needed^)
)

echo | set /p="API Tunnel... "
curl -s -f -m 10 https://avai-redis-api.mrarejimmyz.workers.dev.avai.life/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ACCESSIBLE
) else (
    echo ⏳ PENDING ^(DNS propagation or SSL setup needed^)
)

echo.
echo 🐳 Docker Container Status
echo --------------------------
docker-compose ps

echo.
echo 📊 Service URLs
echo ---------------
echo Local Services:
echo   🔴 Redis:       redis://localhost:6379
echo   📊 Analytics:   http://localhost:8002
echo   🌐 Dashboard:   http://localhost:8003
echo   🔍 RedisInsight: http://localhost:8001
echo.
echo Cloudflare Tunnel URLs:
echo   📊 Dashboard:   https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
echo   🔌 API:         https://avai-redis-api.mrarejimmyz.workers.dev.avai.life
echo   🤖 Main App:    https://avai-main.mrarejimmyz.workers.dev.avai.life
echo.
echo 📋 Management Commands
echo ---------------------
echo   View logs:      docker-compose logs -f [service]
echo   Stop all:       docker-compose down
echo   Restart:        docker-compose restart
echo   Update:         docker-compose pull ^&^& docker-compose up -d
echo.
echo 🏁 Test Complete!
echo.
pause
