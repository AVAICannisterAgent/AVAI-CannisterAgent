@echo off
REM Quick Tunnel Starter for AVAI Redis Infrastructure
REM =================================================

echo 🚇 Starting AVAI Cloudflare Tunnel
echo ===================================
echo.

REM Update PATH to include cloudflared
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SystemPATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "UserPATH=%%b"
set "PATH=%SystemPATH%;%UserPATH%"

REM Check if cloudflared is available
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared not found in PATH
    echo 📝 Make sure Cloudflare tunnel is installed
    pause
    exit /b 1
)

echo ✅ cloudflared found
echo.

REM Change to the AVAI directory
cd /d "D:\ICP\avai-agent-for-hire"

echo 🔧 Configuration:
echo   Config: cloudflare\config.yml
echo   Tunnel ID: 05187107-3e79-4bbf-9647-93556674e910
echo.

echo 🌐 Your services will be available at:
echo   📊 Dashboard: https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life
echo   🔌 API:       https://avai-redis-api.mrarejimmyz.workers.dev.avai.life
echo   🤖 Main App:  https://avai-main.mrarejimmyz.workers.dev.avai.life
echo.

echo 🚀 Starting tunnel... (Press Ctrl+C to stop)
echo.

REM Start the tunnel
cloudflared tunnel --config cloudflare\config.yml run

echo.
echo 🛑 Tunnel stopped
pause
