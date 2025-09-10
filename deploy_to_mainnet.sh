#!/bin/bash

echo "🚀 AVAI Motoko Deployment to ICP Mainnet"
echo "========================================"

cd /workspace

echo "📋 Step 1: Check current identity and network status..."
dfx identity whoami
echo ""

echo "📋 Step 2: Setting up for IC mainnet deployment..."
# Use the existing identity 
dfx identity use default

echo "📋 Step 3: Check wallet balance..."
dfx wallet --network ic balance || echo "Wallet not set up - will create during deployment"

echo ""
echo "📋 Step 4: Deploy AVAI canister to IC mainnet..."
echo "This will deploy our AVAI Motoko orchestrator to the real Internet Computer blockchain!"
echo ""

# Deploy with automatic cycles management
dfx deploy --network ic --with-cycles 2000000000000 avai_project_backend

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! AVAI deployed to IC mainnet!"
    echo ""
    echo "📊 Canister Information:"
    dfx canister --network ic id avai_project_backend
    CANISTER_ID=$(dfx canister --network ic id avai_project_backend)
    
    echo ""
    echo "🌐 Public URLs:"
    echo "Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=${CANISTER_ID}"
    echo "Direct API: https://${CANISTER_ID}.icp0.io/"
    
    echo ""
    echo "🧪 Testing deployed canister..."
    dfx canister --network ic call avai_project_backend greet '("ICP Mainnet")'
    
    echo ""
    echo "✅ AVAI is now live on the Internet Computer blockchain!"
    
else
    echo "❌ Deployment failed. Checking for issues..."
    echo "This might be due to:"
    echo "1. Insufficient cycles (need ~2T cycles for deployment)"
    echo "2. Network connectivity issues"
    echo "3. Identity/wallet setup problems"
    echo ""
    echo "💡 Solution: Use the Cycles Faucet or fund your wallet:"
    echo "https://faucet.dfinity.org/"
fi
