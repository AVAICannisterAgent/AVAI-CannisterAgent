@echo off
REM Cloudflare Tunnel Service Manager for AVAI Redis Infrastructure
REM ==============================================================

set TUNNEL_NAME=avai-redis
set TUNNEL_ID=05187107-3e79-4bbf-9647-93556674e910
set CONFIG_PATH=%~dp0..\cloudflare\config.yml

echo 🚇 AVAI Cloudflare Tunnel Service Manager
echo ==========================================
echo.

if "%1"=="" (
    echo Usage: %0 [install^|uninstall^|start^|stop^|status^|test]
    echo.
    echo Commands:
    echo   install   - Install tunnel as Windows service
    echo   uninstall - Remove tunnel service
    echo   start     - Start tunnel service
    echo   stop      - Stop tunnel service
    echo   status    - Check service status
    echo   test      - Test tunnel configuration
    echo   run       - Run tunnel manually for testing
    echo.
    goto :end
)

if "%1"=="install" goto :install
if "%1"=="uninstall" goto :uninstall
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="status" goto :status
if "%1"=="test" goto :test
if "%1"=="run" goto :run

echo ❌ Unknown command: %1
goto :end

:install
echo 📦 Installing Cloudflare tunnel as Windows service...
cloudflared service install --config "%CONFIG_PATH%"
if %errorlevel% equ 0 (
    echo ✅ Tunnel service installed successfully
    echo 🚀 Starting tunnel service...
    net start cloudflared
    if %errorlevel% equ 0 (
        echo ✅ Tunnel service started successfully
        echo.
        echo 🌐 Your AVAI Redis services are now accessible at:
        echo   📊 Dashboard: https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
        echo   🔌 API:       https://avai-redis-api.mrarejimmyz.workers.dev.avai.life
        echo   🤖 Main App:  https://avai-main.mrarejimmyz.workers.dev.avai.life
    ) else (
        echo ❌ Failed to start tunnel service
    )
) else (
    echo ❌ Failed to install tunnel service
)
goto :end

:uninstall
echo 🗑️ Uninstalling Cloudflare tunnel service...
net stop cloudflared 2>nul
cloudflared service uninstall
if %errorlevel% equ 0 (
    echo ✅ Tunnel service uninstalled successfully
) else (
    echo ❌ Failed to uninstall tunnel service
)
goto :end

:start
echo 🚀 Starting Cloudflare tunnel service...
net start cloudflared
if %errorlevel% equ 0 (
    echo ✅ Tunnel service started successfully
    echo.
    echo 🌐 Your AVAI Redis services are now accessible at:
    echo   📊 Dashboard: https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
    echo   🔌 API:       https://avai-redis-api.mrarejimmyz.workers.dev.avai.life
    echo   🤖 Main App:  https://avai-main.mrarejimmyz.workers.dev.avai.life
) else (
    echo ❌ Failed to start tunnel service
)
goto :end

:stop
echo 🛑 Stopping Cloudflare tunnel service...
net stop cloudflared
if %errorlevel% equ 0 (
    echo ✅ Tunnel service stopped successfully
) else (
    echo ❌ Failed to stop tunnel service
)
goto :end

:status
echo 📊 Checking Cloudflare tunnel service status...
sc query cloudflared
echo.
echo 🌐 Testing tunnel connectivity...
cloudflared tunnel --config "%CONFIG_PATH%" info
goto :end

:test
echo 🧪 Testing Cloudflare tunnel configuration...
cloudflared tunnel --config "%CONFIG_PATH%" ingress validate
echo.
echo 🔗 Testing tunnel connectivity...
cloudflared tunnel --config "%CONFIG_PATH%" ingress url https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
goto :end

:run
echo 🏃 Running Cloudflare tunnel manually (Ctrl+C to stop)...
echo 📊 Dashboard will be available at: https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
echo 🔌 API will be available at: https://avai-redis-api.mrarejimmyz.workers.dev.avai.life
echo 🤖 Main app will be available at: https://avai-main.mrarejimmyz.workers.dev.avai.life
echo.
cloudflared tunnel --config "%CONFIG_PATH%" run
goto :end

:end
echo.
echo Press any key to continue...
pause >nul
