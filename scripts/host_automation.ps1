# AVAI Host Automation Script
# This script runs on the Windows host and executes main.py --redis-only when triggered

param(
    [string]$Action = "start",
    [string]$LogFile = "logs\host_automation.log",
    [int]$CheckInterval = 5
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$VenvActivationScript = Join-Path $RootDir "activate_venv.ps1"
$MainPyScript = Join-Path $RootDir "main.py"
$RedisCheckScript = Join-Path $ScriptDir "check_redis_trigger.py"
$PidFile = Join-Path $RootDir "logs\avai_redis_worker.pid"

# Ensure logs directory exists
$LogDir = Join-Path $RootDir "logs"
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Check if AVAI Redis worker is already running
function Test-WorkerRunning {
    if (Test-Path $PidFile) {
        $WorkerPid = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($WorkerPid -and (Get-Process -Id $WorkerPid -ErrorAction SilentlyContinue)) {
            return $true
        } else {
            # PID file exists but process is not running, clean up
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    return $false
}

# Start the AVAI Redis worker
function Start-AvaiWorker {
    Write-Log "[START] Starting AVAI Redis worker..."
    
    # Check if already running
    if (Test-WorkerRunning) {
        Write-Log "[WARNING] AVAI Redis worker is already running" "WARNING"
        return
    }
    
    # Verify virtual environment activation script exists
    if (!(Test-Path $VenvActivationScript)) {
        Write-Log "[ERROR] Virtual environment activation script not found: $VenvActivationScript" "ERROR"
        return
    }
    
    # Verify main.py exists
    if (!(Test-Path $MainPyScript)) {
        Write-Log "[ERROR] Main Python script not found: $MainPyScript" "ERROR"
        return
    }
    
    try {
        # Create the command to run main.py with Redis queue mode
        $Command = @"
& '$VenvActivationScript'
if (`$LASTEXITCODE -eq 0) {
    Write-Host '[SUCCESS] Virtual environment activated successfully'
    python '$MainPyScript' --redis-only
} else {
    Write-Host '[ERROR] Failed to activate virtual environment'
    exit 1
}
"@
        
        # Start the process in background
        $Process = Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile",
            "-WindowStyle", "Hidden",
            "-Command", $Command
        ) -PassThru -RedirectStandardOutput "$LogDir\avai_worker_output.log" -RedirectStandardError "$LogDir\avai_worker_error.log"
        
        if ($Process) {
            # Save PID for monitoring
            $Process.Id | Out-File -FilePath $PidFile -Encoding UTF8
            Write-Log "[SUCCESS] AVAI Redis worker started successfully (PID: $($Process.Id))"
            Write-Log "[LOG] Output logs: $LogDir\avai_worker_output.log"
            Write-Log "[LOG] Error logs: $LogDir\avai_worker_error.log"
        } else {
            Write-Log "[ERROR] Failed to start AVAI Redis worker" "ERROR"
        }
        
    } catch {
        Write-Log "[ERROR] Exception starting AVAI Redis worker: $($_.Exception.Message)" "ERROR"
    }
}

# Stop the AVAI Redis worker
function Stop-AvaiWorker {
    Write-Log "[STOP] Stopping AVAI Redis worker..."
    
    if (Test-Path $PidFile) {
        $WorkerPid = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($WorkerPid -and (Get-Process -Id $WorkerPid -ErrorAction SilentlyContinue)) {
            try {
                Stop-Process -Id $WorkerPid -Force
                Write-Log "[SUCCESS] AVAI Redis worker stopped (PID: $WorkerPid)"
            } catch {
                Write-Log "[ERROR] Failed to stop AVAI Redis worker: $($_.Exception.Message)" "ERROR"
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    } else {
        Write-Log "[WARNING] AVAI Redis worker is not running" "WARNING"
    }
}

# Monitor Redis for trigger signals
function Start-RedisMonitor {
    Write-Log "[MONITOR] Starting Redis monitor for automation triggers..."
    
    while ($true) {
        try {
            # Check Redis for automation trigger
            if (Test-Path $RedisCheckScript) {
                $Result = & python $RedisCheckScript 2>&1
                if ($LASTEXITCODE -eq 0 -and $Result -eq "START_WORKER") {
                    Write-Log "[TRIGGER] Redis trigger received: Starting AVAI worker"
                    Start-AvaiWorker
                } elseif ($LASTEXITCODE -eq 0 -and $Result -eq "STOP_WORKER") {
                    Write-Log "[TRIGGER] Redis trigger received: Stopping AVAI worker"
                    Stop-AvaiWorker
                } elseif ($LASTEXITCODE -eq 0 -and $Result -eq "RESTART_WORKER") {
                    Write-Log "[TRIGGER] Redis trigger received: Restarting AVAI worker for fresh start"
                    Stop-AvaiWorker
                    Start-Sleep -Seconds 2
                    Start-AvaiWorker
                }
            }
            
            # Check if worker is still running
            if (!(Test-WorkerRunning)) {
                Write-Log "[WARNING] AVAI worker stopped unexpectedly, checking for restart trigger" "WARNING"
            }
            
            Start-Sleep -Seconds $CheckInterval
            
        } catch {
            Write-Log "[ERROR] Error in Redis monitor: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds ($CheckInterval * 2)
        }
    }
}

# Get worker status
function Get-WorkerStatus {
    if (Test-WorkerRunning) {
        $WorkerPid = Get-Content $PidFile
        Write-Log "[STATUS] AVAI Redis worker is running (PID: $WorkerPid)" "INFO"
        
        # Show recent logs
        $OutputLog = "$LogDir\avai_worker_output.log"
        if (Test-Path $OutputLog) {
            Write-Log "[LOG] Recent output (last 10 lines):" "INFO"
            Get-Content $OutputLog -Tail 10 | ForEach-Object { Write-Log "   $_" "INFO" }
        }
    } else {
        Write-Log "[WARNING] AVAI Redis worker is not running" "WARNING"
    }
}

# Main execution
Write-Log "[START] AVAI Host Automation Script Started"
Write-Log "[INFO] Root Directory: $RootDir"
Write-Log "[CONFIG] Action: $Action"

switch ($Action.ToLower()) {
    "start" {
        Start-AvaiWorker
    }
    "stop" {
        Stop-AvaiWorker
    }
    "restart" {
        Stop-AvaiWorker
        Start-Sleep -Seconds 2
        Start-AvaiWorker
    }
    "status" {
        Get-WorkerStatus
    }
    "monitor" {
        Start-RedisMonitor
    }
    default {
        Write-Log "[ERROR] Unknown action: $Action" "ERROR"
        Write-Log "[INFO] Available actions: start, stop, restart, status, monitor" "INFO"
        exit 1
    }
}

Write-Log "[DONE] AVAI Host Automation Script Completed"
