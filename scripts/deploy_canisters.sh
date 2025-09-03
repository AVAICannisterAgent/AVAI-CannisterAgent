#!/bin/bash
# Deploy AVAI canisters to Internet Computer networks

set -e

NETWORK=${1:-local}
CANISTER=${2:-all}

echo "🚀 Deploying AVAI Canisters to $NETWORK network..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install the Internet Computer SDK."
    exit 1
fi

# Function to deploy individual canister
deploy_canister() {
    local canister_name=$1
    echo "📦 Deploying $canister_name..."
    
    if dfx deploy $canister_name --network $NETWORK; then
        echo "✅ $canister_name deployed successfully!"
    else
        echo "❌ Failed to deploy $canister_name"
        return 1
    fi
}

# Deploy specific canister or all canisters
if [ "$CANISTER" = "all" ]; then
    echo "🔄 Deploying all AVAI canisters..."
    
    # Build first
    echo "🔨 Building canisters..."
    dfx build
    
    # Deploy each canister
    deploy_canister "avai_main"
    deploy_canister "avai_analyzer" 
    deploy_canister "avai_report_generator"
    deploy_canister "avai_audit_engine"
    
    echo "🎉 All AVAI canisters deployed successfully to $NETWORK!"
else
    # Deploy specific canister
    echo "📦 Deploying specific canister: $CANISTER"
    deploy_canister $CANISTER
    echo "✅ $CANISTER deployed successfully to $NETWORK!"
fi

# Show canister info
echo "📋 Canister Information:"
dfx canister status --all --network $NETWORK

echo "🎉 Deployment complete!"
