# AVAI Host Automation Setup Script
# Quick setup for automated Redis processing

Write-Host "🤖 AVAI Host Automation Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Check if Docker is running
Write-Host "🐳 Checking Docker status..." -ForegroundColor Yellow
try {
    $DockerStatus = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
$VenvScript = Join-Path $RootDir "activate_venv.ps1"
if (Test-Path $VenvScript) {
    Write-Host "✅ Virtual environment found" -ForegroundColor Green
} else {
    Write-Host "❌ Virtual environment not found at: $VenvScript" -ForegroundColor Red
    Write-Host "Please run setup scripts first" -ForegroundColor Yellow
    exit 1
}

# Start Docker services
Write-Host ""
Write-Host "🚀 Starting Docker services..." -ForegroundColor Yellow
try {
    Set-Location $RootDir
    $Result = docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker services started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error starting Docker services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check Redis connectivity
Write-Host "🔍 Testing Redis connection..." -ForegroundColor Yellow
try {
    $RedisTest = docker exec avai-redis redis-cli ping 2>$null
    if ($RedisTest -eq "PONG") {
        Write-Host "✅ Redis is responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis may not be ready yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not test Redis connection" -ForegroundColor Yellow
}

# Check WebSocket server
Write-Host "🔍 Testing WebSocket server..." -ForegroundColor Yellow
try {
    $WebSocketTest = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($WebSocketTest.status -eq "healthy") {
        Write-Host "✅ WebSocket server is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WebSocket server may not be ready yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not test WebSocket server" -ForegroundColor Yellow
}

# Start host automation
Write-Host ""
Write-Host "🎯 Starting host automation monitor..." -ForegroundColor Yellow
$AutomationScript = Join-Path $ScriptDir "host_automation.ps1"

# Start automation in background
$Job = Start-Job -ScriptBlock {
    param($Script)
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Script -Action monitor
} -ArgumentList $AutomationScript

Write-Host "✅ Host automation started (Job ID: $($Job.Id))" -ForegroundColor Green

# Show status
Write-Host ""
Write-Host "📊 System Status:" -ForegroundColor Yellow
Write-Host "  🐳 Docker Services: Running" -ForegroundColor Green
Write-Host "  📡 WebSocket: wss://websocket.avai.life/ws" -ForegroundColor Green
Write-Host "  💾 Redis: localhost:6379" -ForegroundColor Green
Write-Host "  🤖 Host Automation: Running (Job $($Job.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 AVAI Host Automation Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open your frontend at avai.life" -ForegroundColor White
Write-Host "2. Send a message with a GitHub repository URL" -ForegroundColor White
Write-Host "3. Watch the automation trigger main.py --redis-only" -ForegroundColor White
Write-Host "4. View real-time logs and PDF generation" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "  View logs: Get-Job $($Job.Id) | Receive-Job" -ForegroundColor Cyan
Write-Host "  Stop automation: Stop-Job $($Job.Id); Remove-Job $($Job.Id)" -ForegroundColor Cyan
Write-Host "  Check status: docker-compose ps" -ForegroundColor Cyan
Write-Host "  Stop all: docker-compose down" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Ready for automated AI analysis!" -ForegroundColor Green
