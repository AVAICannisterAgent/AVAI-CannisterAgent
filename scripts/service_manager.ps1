# AVAI Host Service Manager
# This script can be run as a Windows service or scheduled task to manage AVAI automation

param(
    [string]$Action = "monitor",
    [string]$ServiceName = "AVAIHostAutomation",
    [int]$MonitorInterval = 10
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $RootDir "logs"
$LogFile = Join-Path $LogDir "service_manager.log"
$AutomationScript = Join-Path $ScriptDir "host_automation.ps1"

# Ensure logs directory exists
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
function Write-ServiceLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] [SERVICE] $Message"
    Write-Host $LogEntry
    $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Install as Windows Service (requires NSSM - Non-Sucking Service Manager)
function Install-AVAIService {
    Write-ServiceLog "🔧 Installing AVAI Host Automation as Windows Service..."
    
    # Check if NSSM is available
    $NssmPath = Get-Command "nssm.exe" -ErrorAction SilentlyContinue
    if (!$NssmPath) {
        Write-ServiceLog "❌ NSSM (Non-Sucking Service Manager) not found" "ERROR"
        Write-ServiceLog "📝 Please install NSSM: choco install nssm" "INFO"
        Write-ServiceLog "📝 Or download from: https://nssm.cc/download" "INFO"
        return $false
    }
    
    try {
        # Remove existing service if present
        & nssm remove $ServiceName confirm 2>$null
        
        # Install new service
        & nssm install $ServiceName "powershell.exe"
        & nssm set $ServiceName Parameters "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Action monitor"
        & nssm set $ServiceName DisplayName "AVAI Host Automation Service"
        & nssm set $ServiceName Description "Manages AVAI AI agent automation and Redis queue processing"
        & nssm set $ServiceName Start SERVICE_AUTO_START
        & nssm set $ServiceName AppStdout "$LogDir\service_output.log"
        & nssm set $ServiceName AppStderr "$LogDir\service_error.log"
        & nssm set $ServiceName AppRotateFiles 1
        & nssm set $ServiceName AppRotateOnline 1
        & nssm set $ServiceName AppRotateBytes 1048576  # 1MB
        
        Write-ServiceLog "✅ Service installed successfully"
        Write-ServiceLog "🚀 Starting service..."
        
        Start-Service $ServiceName
        Write-ServiceLog "✅ Service started successfully"
        
        return $true
        
    } catch {
        Write-ServiceLog "❌ Failed to install service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Uninstall Windows Service
function Uninstall-AVAIService {
    Write-ServiceLog "🗑️ Uninstalling AVAI Host Automation Service..."
    
    try {
        # Stop service if running
        if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
            Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
            Write-ServiceLog "🛑 Service stopped"
        }
        
        # Remove service
        & nssm remove $ServiceName confirm
        Write-ServiceLog "✅ Service uninstalled successfully"
        
    } catch {
        Write-ServiceLog "❌ Failed to uninstall service: $($_.Exception.Message)" "ERROR"
    }
}

# Monitor mode - main service loop
function Start-ServiceMonitor {
    Write-ServiceLog "👁️ Starting AVAI Host Automation Service Monitor..."
    Write-ServiceLog "📁 Root Directory: $RootDir"
    Write-ServiceLog "🔄 Monitor Interval: $MonitorInterval seconds"
    
    # Service main loop
    while ($true) {
        try {
            # Run the Redis monitor check
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AutomationScript -Action monitor -CheckInterval $MonitorInterval
            
            # If monitor exits, restart it after a delay
            Write-ServiceLog "⚠️ Monitor process exited, restarting in 10 seconds..." "WARNING"
            Start-Sleep -Seconds 10
            
        } catch {
            Write-ServiceLog "❌ Error in service monitor: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 30
        }
    }
}

# Check service status
function Get-ServiceStatus {
    $Service = Get-Service $ServiceName -ErrorAction SilentlyContinue
    
    if ($Service) {
        Write-ServiceLog "📊 Service Status: $($Service.Status)" "INFO"
        
        # Check if automation script is responding
        $Result = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AutomationScript -Action status
        
        return $Service.Status -eq 'Running'
    } else {
        Write-ServiceLog "❌ Service not installed" "WARNING"
        return $false
    }
}

# Manual control commands
function Start-ManualMode {
    Write-ServiceLog "🚀 Starting manual automation mode..."
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AutomationScript -Action monitor
}

function Stop-ManualMode {
    Write-ServiceLog "🛑 Stopping manual automation mode..."
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AutomationScript -Action stop
}

# Main execution
Write-ServiceLog "🤖 AVAI Host Service Manager Started"
Write-ServiceLog "🔧 Action: $Action"

switch ($Action.ToLower()) {
    "install" {
        Install-AVAIService
    }
    "uninstall" {
        Uninstall-AVAIService
    }
    "start" {
        if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
            Start-Service $ServiceName
            Write-ServiceLog "✅ Service started"
        } else {
            Start-ManualMode
        }
    }
    "stop" {
        if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
            Stop-Service $ServiceName
            Write-ServiceLog "🛑 Service stopped"
        } else {
            Stop-ManualMode
        }
    }
    "restart" {
        if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
            Restart-Service $ServiceName
            Write-ServiceLog "🔄 Service restarted"
        } else {
            Stop-ManualMode
            Start-Sleep -Seconds 2
            Start-ManualMode
        }
    }
    "status" {
        Get-ServiceStatus
    }
    "monitor" {
        # This is the main service mode
        Start-ServiceMonitor
    }
    default {
        Write-ServiceLog "❌ Unknown action: $Action" "ERROR"
        Write-ServiceLog "Available actions: install, uninstall, start, stop, restart, status, monitor" "INFO"
        exit 1
    }
}

Write-ServiceLog "🏁 AVAI Host Service Manager Completed"
