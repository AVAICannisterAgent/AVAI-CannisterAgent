#!/bin/bash
# Build script for AVAI canisters

set -e

echo "🔧 Building AVAI Canisters..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install the Internet Computer SDK."
    echo "   Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Start dfx if not running
echo "🚀 Starting DFX..."
dfx start --clean --background

# Build all canisters
echo "🔨 Building canisters..."
dfx build

echo "✅ AVAI canisters built successfully!"

# Optional: Deploy to local network
if [ "$1" = "--deploy" ]; then
    echo "🚀 Deploying canisters to local network..."
    dfx deploy
    echo "✅ Canisters deployed successfully!"
fi

echo "🎉 Build process complete!"
