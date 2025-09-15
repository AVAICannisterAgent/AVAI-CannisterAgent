# AVAI Unified System Management Script
# Handles complete Docker environment optimization and management

param(
    [Parameter()]
    [ValidateSet("deploy", "restart", "stop", "clean", "logs", "status")]
    [string]$Action = "deploy"
)

Write-Host "AVAI Unified System Management" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor Yellow

function Show-Status {
    Write-Host "Current Docker Status:" -ForegroundColor Green
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host "Network Status:" -ForegroundColor Green
    docker network ls | Select-String "avai"
}

function Stop-AllContainers {
    Write-Host "Stopping all AVAI containers..." -ForegroundColor Red
    
    # Stop all AVAI containers
    $containers = @(
        "avai-motoko-test",
        "avai-motoko-redis", 
        "avai-redis",
        "avai-websocket",
        "avai-processor",
        "avai-host-automation",
        "avai-tunnel"
    )
    
    foreach ($container in $containers) {
        docker stop $container 2>$null
        docker rm $container 2>$null
    }
    
    Write-Host "✅ Containers stopped" -ForegroundColor Green
}

function Clean-Environment {
    Write-Host "🧹 Cleaning Docker environment..." -ForegroundColor Yellow
    
    Stop-AllContainers
    
    # Remove networks
    docker network rm avai-network 2>$null
    docker network rm avai-agent-for-hire_avai-network 2>$null
    
    # Clean up unused volumes and images
    docker system prune -f
    docker volume prune -f
    
    # Create required directories
    New-Item -ItemType Directory -Path ".\data\redis" -Force | Out-Null
    New-Item -ItemType Directory -Path ".\data\dfx" -Force | Out-Null  
    New-Item -ItemType Directory -Path ".\data\vessel" -Force | Out-Null
    
    Write-Host "✅ Environment cleaned" -ForegroundColor Green
}

function Deploy-Unified {
    Write-Host "🚀 Deploying AVAI Unified System..." -ForegroundColor Cyan
    
    # Clean environment first
    Clean-Environment
    
    # Build and deploy unified system
    Write-Host "🔨 Building unified system..." -ForegroundColor Yellow
    docker-compose -f docker-compose-unified.yml build --parallel
    
    Write-Host "🚀 Starting unified services..." -ForegroundColor Yellow
    docker-compose -f docker-compose-unified.yml up -d
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep 30
    
    # Check health status
    Write-Host "🩺 Checking service health..." -ForegroundColor Yellow
    $healthyServices = 0
    $totalServices = 6
    
    $services = @(
        "avai-redis-unified",
        "avai-motoko-unified", 
        "avai-processor-unified",
        "avai-websocket-unified",
        "avai-integration-bridge",
        "avai-host-automation-unified"
    )
    
    foreach ($service in $services) {
        $status = docker inspect --format="{{.State.Health.Status}}" $service 2>$null
        if ($status -eq "healthy" -or $status -eq "") {
            Write-Host "✅ $service : healthy" -ForegroundColor Green
            $healthyServices++
        } else {
            Write-Host "⚠️ $service : $status" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n🎉 AVAI Unified System Deployed!" -ForegroundColor Green
    Write-Host "📊 Health Status: $healthyServices/$totalServices services ready" -ForegroundColor Cyan
    
    # Show access URLs
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Green
    Write-Host "🔗 Motoko Replica: http://localhost:4943" -ForegroundColor White
    Write-Host "🔗 WebSocket Server: wss://websocket.avai.life/ws (Cloudflare Tunnel)" -ForegroundColor White
    Write-Host "🔗 Redis: redis://localhost:6379" -ForegroundColor White
    Write-Host "🔗 Motoko Frontend: http://localhost:8100" -ForegroundColor White
    
    # Test Motoko canister
    Write-Host "`n🧪 Testing Motoko canister..." -ForegroundColor Yellow
    Start-Sleep 10
    
    $testResult = docker exec avai-motoko-unified dfx ping local 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Motoko canister is responding!" -ForegroundColor Green
        
        # Try to get canister ID
        $canisterID = docker exec avai-motoko-unified dfx canister id avai_project_backend 2>$null
        if ($canisterID) {
            Write-Host "🆔 Backend Canister ID: $canisterID" -ForegroundColor Cyan
        }
    } else {
        Write-Host "⚠️ Motoko canister not ready yet (will retry automatically)" -ForegroundColor Yellow
    }
}

function Show-Logs {
    param([string]$Service = "all")
    
    if ($Service -eq "all") {
        Write-Host "📋 Showing logs for all services..." -ForegroundColor Yellow
        docker-compose -f docker-compose-unified.yml logs --tail=50
    } else {
        Write-Host "📋 Showing logs for $Service..." -ForegroundColor Yellow
        docker-compose -f docker-compose-unified.yml logs --tail=100 $Service
    }
}

function Restart-System {
    Write-Host "🔄 Restarting AVAI Unified System..." -ForegroundColor Yellow
    docker-compose -f docker-compose-unified.yml restart
    Start-Sleep 20
    Show-Status
}

# Main execution
switch ($Action) {
    "deploy" { Deploy-Unified }
    "restart" { Restart-System }
    "stop" { Stop-AllContainers }
    "clean" { Clean-Environment }
    "logs" { Show-Logs }
    "status" { Show-Status }
}

Write-Host "`n✨ Management script completed!" -ForegroundColor Green
