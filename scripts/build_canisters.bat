@echo off
REM Build script for AVAI canisters (Windows)

echo 🔧 Building AVAI Canisters...

REM Check if dfx is installed
where dfx >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ DFX is not installed. Please install the Internet Computer SDK.
    echo    Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/
    exit /b 1
)

REM Start dfx if not running
echo 🚀 Starting DFX...
dfx start --clean --background

REM Build all canisters
echo 🔨 Building canisters...
dfx build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ AVAI canisters built successfully!

REM Optional: Deploy to local network
if "%1"=="--deploy" (
    echo 🚀 Deploying canisters to local network...
    dfx deploy
    if %ERRORLEVEL% neq 0 (
        echo ❌ Deployment failed!
        exit /b 1
    )
    echo ✅ Canisters deployed successfully!
)

echo 🎉 Build process complete!
