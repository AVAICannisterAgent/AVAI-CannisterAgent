@echo off
REM AVAI Redis Infrastructure Deployment Script for Windows
REM ========================================================

echo 🚀 Starting AVAI Redis Infrastructure Deployment
echo ================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please ensure Docker Desktop is running.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create necessary directories
echo 📁 Creating directory structure...
if not exist "redis\data" mkdir "redis\data"
if not exist "redis\logs" mkdir "redis\logs"
if not exist "docker\redis-analytics\logs" mkdir "docker\redis-analytics\logs"
if not exist "dashboard\logs" mkdir "dashboard\logs"
if not exist "cloudflare\logs" mkdir "cloudflare\logs"

echo ✅ Directory structure created

REM Load environment file if it exists
if exist ".env.redis" (
    echo 📝 Using Redis environment configuration from .env.redis
) else (
    echo ⚠️ .env.redis not found, using default Docker Compose values
)

REM Build and start services
echo 🐳 Building and starting Docker services...

REM Pull latest images
docker-compose pull

REM Build custom images
docker-compose build

REM Start services in background
docker-compose up -d

REM Wait for services to initialize
echo ⏳ Waiting for services to initialize...
timeout /t 15 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

docker-compose ps | findstr "redis" >nul
if %errorlevel% equ 0 (
    echo ✅ Redis service is running
) else (
    echo ❌ Redis service failed to start
    goto :error
)

docker-compose ps | findstr "analytics" >nul
if %errorlevel% equ 0 (
    echo ✅ Analytics service is running
) else (
    echo ❌ Analytics service failed to start
    goto :error
)

docker-compose ps | findstr "dashboard" >nul
if %errorlevel% equ 0 (
    echo ✅ Dashboard service is running
) else (
    echo ❌ Dashboard service failed to start
    goto :error
)

echo.
echo 🎉 AVAI Redis Infrastructure deployed successfully!
echo.
echo 📊 Service URLs:
echo   - Redis Server: redis://localhost:6379
echo   - Analytics API: http://localhost:8001
echo   - Web Dashboard: http://localhost:8002
echo.
echo 📋 Useful commands:
echo   - View logs: docker-compose logs -f [service_name]
echo   - Stop services: docker-compose down
echo   - Restart services: docker-compose restart
echo   - View status: docker-compose ps
echo.
echo 🔧 Configuration:
echo   - Environment: .env.redis
echo   - Redis data: .\redis\data
echo   - Logs: .\redis\logs, .\docker\*\logs
echo.

REM Show recent logs
echo 📜 Showing recent service logs...
echo === Redis ===
docker-compose logs --tail=5 redis
echo.
echo === Analytics ===
docker-compose logs --tail=5 analytics
echo.
echo === Dashboard ===
docker-compose logs --tail=5 dashboard
echo.

echo 🏁 Deployment complete!
echo.
echo Press any key to continue...
pause >nul
goto :end

:error
echo.
echo ❌ Some services failed to start. Check logs with:
echo    docker-compose logs
echo.
echo 🛠️ Troubleshooting:
echo   1. Check if ports 6379, 8001, 8002 are available
echo   2. Verify Docker Desktop is running and has sufficient resources
echo   3. Check .env.redis configuration
echo   4. Try: docker-compose down then run this script again
echo.
pause
exit /b 1

:end
