# Check and Start Ollama Service for AVAI
# PowerShell script for Windows environments
# 
# This script checks for Ollama installation, starts the server if needed,
# and verifies that the required models are available.

function Test-OllamaServer {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -Method GET -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Main script starts here
Write-Host "🔍 Checking AVAI Ollama Server Status..." -ForegroundColor Cyan

# Check if Ollama is installed
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Ollama is not installed or not in PATH" -ForegroundColor Red
    Write-Host "📦 Please download and install Ollama from https://ollama.ai/download" -ForegroundColor Yellow
    exit 1
}

# Check if Ollama server is running
Write-Host "🔄 Checking if Ollama server is already running..." -ForegroundColor Cyan
if (Test-OllamaServer) {
    Write-Host "✅ Ollama server is running and accessible at http://localhost:11434" -ForegroundColor Green
} else {
    Write-Host "⚠️ Ollama server is not running or not accessible" -ForegroundColor Yellow
    Write-Host "🚀 Starting Ollama server..." -ForegroundColor Cyan
    
    # Start Ollama server in a new window
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "ollama serve; Read-Host 'Press Enter to close this window'"
    
    # Wait for server to start
    Write-Host "⏳ Waiting for Ollama server to start..." -ForegroundColor Cyan
    $retries = 0
    $maxRetries = 10
    $serverStarted = $false
    
    while (-not $serverStarted -and $retries -lt $maxRetries) {
        Start-Sleep -Seconds 2
        $retries++
        Write-Host "  Checking connection (attempt $retries of $maxRetries)..." -ForegroundColor Cyan
        if (Test-OllamaServer) {
            $serverStarted = $true
        }
    }
    
    if ($serverStarted) {
        Write-Host "✅ Ollama server started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Ollama server after $maxRetries attempts" -ForegroundColor Red
        exit 1
    }
}

# Check if required models are installed
Write-Host "📋 Checking for required models..." -ForegroundColor Cyan
$modelList = ollama list
if ($modelList -match "dolphin3 " -and $modelList -match "llava:7b ") {
    Write-Host "✅ Required models (dolphin3, llava:7b) are installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some required models are missing" -ForegroundColor Yellow
    Write-Host "📥 Downloading required models..." -ForegroundColor Cyan
    
    # Pull models if not available
    if ($modelList -notmatch "dolphin3 ") {
        Write-Host "  Pulling dolphin3 model..." -ForegroundColor Cyan
        ollama pull dolphin3
    }
    
    if ($modelList -notmatch "llava:7b ") {
        Write-Host "  Pulling llava:7b model..." -ForegroundColor Cyan
        ollama pull llava:7b
    }
}

# Ensure config is set up
if (-not (Test-Path -Path "config/config.toml")) {
    Write-Host "⚙️ Setting up Ollama configuration..." -ForegroundColor Cyan
    Copy-Item -Path "config/config_ollama.toml" -Destination "config/config.toml" -Force
    Write-Host "✅ Configuration file created" -ForegroundColor Green
}

Write-Host "✅ AVAI Ollama server is ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 To use AVAI:" -ForegroundColor Cyan
Write-Host "   python main.py --prompt 'Your prompt here'" -ForegroundColor White
Write-Host "   python main.py  # For interactive mode" -ForegroundColor White
