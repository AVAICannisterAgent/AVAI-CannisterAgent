# AVAI Cloudflare Tunnel Service Installer
# Run as Administrator
# =====================================

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "📝 Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "🚇 AVAI Cloudflare Tunnel Service Installer" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Set execution policy temporarily
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Update PATH
$env:PATH = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'User')

# Define paths
$tunnelId = "05187107-3e79-4bbf-9647-93556674e910"
$configPath = "D:\ICP\avai-agent-for-hire\cloudflare\config.yml"
$credentialsPath = "C:\Users\lakpa\.cloudflared\$tunnelId.json"

Write-Host "📋 Configuration Details:" -ForegroundColor Green
Write-Host "  Tunnel ID: $tunnelId"
Write-Host "  Config Path: $configPath"
Write-Host "  Credentials: $credentialsPath"
Write-Host ""

# Check if files exist
if (!(Test-Path $configPath)) {
    Write-Host "❌ Configuration file not found: $configPath" -ForegroundColor Red
    pause
    exit 1
}

if (!(Test-Path $credentialsPath)) {
    Write-Host "❌ Credentials file not found: $credentialsPath" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Configuration files verified" -ForegroundColor Green
Write-Host ""

try {
    Write-Host "📦 Installing Cloudflare tunnel service..." -ForegroundColor Yellow
    
    # Install the service
    & cloudflared service install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service installed successfully" -ForegroundColor Green
        
        # Create a registry entry for the config file
        Write-Host "🔧 Configuring service parameters..." -ForegroundColor Yellow
        
        # Set the service to use our config file
        $servicePath = "HKLM:\SYSTEM\CurrentControlSet\Services\cloudflared"
        if (Test-Path $servicePath) {
            # Update the service ImagePath to include our config
            $currentImagePath = (Get-ItemProperty -Path $servicePath).ImagePath
            $newImagePath = $currentImagePath.Replace("tunnel run", "tunnel --config `"$configPath`" run")
            
            Set-ItemProperty -Path $servicePath -Name "ImagePath" -Value $newImagePath
            Write-Host "✅ Service configured with custom config file" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "🚀 Starting Cloudflare tunnel service..." -ForegroundColor Yellow
        
        # Start the service
        Start-Service -Name "cloudflared"
        
        # Wait a moment for service to start
        Start-Sleep -Seconds 5
        
        # Check service status
        $service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($service -and $service.Status -eq "Running") {
            Write-Host "✅ Tunnel service started successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 Your AVAI Redis services are now accessible at:" -ForegroundColor Cyan
            Write-Host "  📊 Dashboard: https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life" -ForegroundColor White
            Write-Host "  🔌 API:       https://avai-redis-api.mrarejimmyz.workers.dev.avai.life" -ForegroundColor White
            Write-Host "  🤖 Main App:  https://avai-main.mrarejimmyz.workers.dev.avai.life" -ForegroundColor White
            Write-Host ""
            Write-Host "📋 Service Management:" -ForegroundColor Green
            Write-Host "  Stop:    Stop-Service cloudflared" -ForegroundColor Gray
            Write-Host "  Start:   Start-Service cloudflared" -ForegroundColor Gray
            Write-Host "  Status:  Get-Service cloudflared" -ForegroundColor Gray
            Write-Host "  Remove:  cloudflared service uninstall" -ForegroundColor Gray
        }
        else {
            Write-Host "⚠️ Service installed but not running. Check logs with:" -ForegroundColor Yellow
            Write-Host "   Get-EventLog -LogName Application -Source cloudflared -Newest 10" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "❌ Failed to install service" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error installing service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Installation complete!" -ForegroundColor Cyan
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
